import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { getArtifactSlug } from '../lib/artifactSlug.js'
import { QRCodeCanvas } from 'qrcode.react'
import {
  ArrowLeft,
  Download,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  Pencil,
  QrCode,
  Trash2,
  Upload,
} from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const EMPTY_FORM = {
  title_id: '',
  title_en: '',
  era: '',
  material: '',
  location: '',
  description_id: '',
  description_en: '',
  image_alt: '',
}
const INPUT_CLASS = 'mt-1 w-full min-w-0 max-w-md rounded-xl border border-burgundy/30 bg-white px-4 py-3 text-burgundy placeholder:text-burgundy/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
const LABEL_CLASS = 'block text-sm font-semibold text-burgundy'
const ArtifactPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  slug: PropTypes.string,
  title_id: PropTypes.string.isRequired,
  title_en: PropTypes.string,
  era: PropTypes.string.isRequired,
  material: PropTypes.string,
  location: PropTypes.string,
  description_id: PropTypes.string,
  description_en: PropTypes.string,
  image_url: PropTypes.string,
  image_alt: PropTypes.string,
  created_at: PropTypes.string,
})

function PasscodeGate({ onUnlock }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const configuredPasscode = import.meta.env.VITE_ADMIN_PASSCODE

  function submitPasscode(event) {
    event.preventDefault()
    if (!configuredPasscode) {
      setError('Admin belum dikonfigurasi. Atur VITE_ADMIN_PASSCODE di environment aplikasi.')
    } else if (passcode !== configuredPasscode) {
      setError('Passcode tidak sesuai. Silakan coba lagi.')
      setPasscode('')
    } else {
      sessionStorage.setItem('heritage-admin-unlocked', 'true')
      onUnlock()
    }
  }

  return (
    <main className="grid min-h-screen place-items-center overflow-x-hidden bg-cream px-5 py-10 text-burgundy">
      <section className="w-full max-w-md rounded-3xl border border-burgundy/20 bg-white/70 p-5 shadow-xl sm:p-9">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke beranda
        </Link>
        <span className="mt-8 grid size-12 place-items-center rounded-full bg-primary/20"><KeyRound aria-hidden="true" size={24} /></span>
        <h1 className="mt-5 font-serif text-3xl font-bold">Akses pengelola</h1>
        <p className="mt-2 leading-6">Masukkan passcode untuk mengelola koleksi museum.</p>
        <form onSubmit={submitPasscode} className="mt-6">
          <label htmlFor="admin-passcode" className={LABEL_CLASS}>Passcode</label>
          <input
            id="admin-passcode"
            name="passcode"
            type="password"
            autoComplete="current-password"
            required
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className={INPUT_CLASS}
          />
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-terracotta">{error}</p>}
          <button type="submit" className="mt-5 min-h-12 w-full rounded-full bg-burgundy px-5 font-bold text-cream hover:bg-terracotta focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Masuk ke dashboard</button>
        </form>
        <p className="mt-5 border-t border-burgundy/15 pt-4 text-xs leading-5 text-burgundy/75">
          Passcode di browser adalah pembatas sederhana, bukan mekanisme autentikasi aman. Untuk produksi, lindungi operasi tulis dengan Supabase Auth dan kebijakan RLS berbasis peran.
        </p>
      </section>
    </main>
  )
}

PasscodeGate.propTypes = {
  onUnlock: PropTypes.func.isRequired,
}

function ArtifactForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imageName, setImageName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function selectImage(event) {
    const file = event.target.files?.[0] ?? null
    setError('')
    setImageFile(null)
    setImageName('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Pilih berkas gambar dengan format yang valid.')
      event.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran gambar maksimum adalah 10 MB.')
      event.target.value = ''
      return
    }
    setImageFile(file)
    setImageName(file.name)
  }

  async function submitArtifact(event) {
    event.preventDefault()
    if (!supabaseConfigured || !supabase) {
      setError('Supabase belum dikonfigurasi. Lengkapi URL dan anon key pada environment aplikasi.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    let uploadedPath = ''
    try {
      let imageUrl = null
      if (imageFile) {
        const extension = imageFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'img'
        uploadedPath = `${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('artifact-images')
          .upload(uploadedPath, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type })
        if (uploadError) throw new Error(`Gagal mengunggah gambar: ${uploadError.message}`)
        const { data } = supabase.storage.from('artifact-images').getPublicUrl(uploadedPath)
        imageUrl = data.publicUrl
      }

      const { error: insertError } = await supabase.from('artifacts').insert({
        ...form,
        material: form.material.trim() || null,
        location: form.location.trim() || null,
        image_url: imageUrl,
      })
      if (insertError) throw new Error(`Gagal menyimpan artefak: ${insertError.message}`)
      setForm(EMPTY_FORM)
      setImageFile(null)
      setImageName('')
      const fileInput = document.getElementById('artifact-image')
      if (fileInput) fileInput.value = ''
      setMessage('Artefak berhasil ditambahkan ke koleksi.')
      await onCreated()
    } catch (submissionError) {
      let detail = submissionError instanceof Error ? submissionError.message : 'Terjadi kesalahan yang tidak diketahui.'
      if (uploadedPath && supabase) {
        const { error: cleanupError } = await supabase.storage.from('artifact-images').remove([uploadedPath])
        if (cleanupError) detail += ` Gambar sementara juga gagal dibersihkan: ${cleanupError.message}`
      }
      setError(detail)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="new-artifact-title" className="min-w-0 rounded-3xl border border-burgundy/20 bg-white/70 p-4 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-primary/20"><ImagePlus aria-hidden="true" size={21} /></span>
        <div className="min-w-0">
          <h2 id="new-artifact-title" className="font-serif text-2xl font-bold">Tambah artefak</h2>
          <p className="mt-1 text-sm text-burgundy/75">Lengkapi informasi dalam Bahasa Indonesia dan Inggris.</p>
        </div>
      </div>
      <form onSubmit={submitArtifact} className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="title_id" className={LABEL_CLASS}>Nama artefak · Indonesia</label>
          <input id="title_id" name="title_id" required maxLength={200} value={form.title_id} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div className="min-w-0">
          <label htmlFor="title_en" className={LABEL_CLASS}>Artifact title · English</label>
          <input id="title_en" name="title_en" required maxLength={200} value={form.title_en} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div className="min-w-0">
          <label htmlFor="era" className={LABEL_CLASS}>Era / periode</label>
          <input id="era" name="era" required maxLength={160} value={form.era} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="material" className={LABEL_CLASS}>Bahan</label>
          <input id="material" name="material" maxLength={200} value={form.material} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="location" className={LABEL_CLASS}>Lokasi / asal koleksi</label>
          <input id="location" name="location" maxLength={240} value={form.location} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="description_id" className={LABEL_CLASS}>Deskripsi · Bahasa Indonesia</label>
          <textarea id="description_id" name="description_id" required rows={5} maxLength={12000} value={form.description_id} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="description_en" className={LABEL_CLASS}>Description · English</label>
          <textarea id="description_en" name="description_en" required rows={5} maxLength={12000} value={form.description_en} onChange={updateField} className={INPUT_CLASS} />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="image_alt" className={LABEL_CLASS}>Teks alternatif gambar</label>
          <input id="image_alt" name="image_alt" required maxLength={500} value={form.image_alt} onChange={updateField} className={INPUT_CLASS} />
          <p className="mt-1 text-xs text-burgundy/70">Deskripsikan informasi visual gambar secara singkat untuk pembaca layar.</p>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="artifact-image" className={LABEL_CLASS}>Gambar artefak (opsional, maks. 10 MB)</label>
          <input id="artifact-image" name="image" type="file" accept="image/*" onChange={selectImage} className="sr-only" />
          <label htmlFor="artifact-image" className="mt-2 flex min-h-14 w-full max-w-md cursor-pointer items-center justify-center gap-2 break-all rounded-xl border-2 border-dashed border-burgundy/30 px-4 py-3 text-center text-sm font-semibold hover:bg-primary/10 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <Upload aria-hidden="true" size={18} /> {imageName || 'Pilih gambar untuk diunggah'}
          </label>
        </div>
        {(error || message) && (
          <p role={error ? 'alert' : 'status'} className={`sm:col-span-2 text-sm font-semibold ${error ? 'text-terracotta' : 'text-burgundy'}`}>
            {error || message}
          </p>
        )}
        <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-burgundy px-6 font-bold text-cream hover:bg-terracotta focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
          {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <Upload aria-hidden="true" size={18} />}
          {saving ? 'Menyimpan artefak…' : 'Simpan artefak'}
        </button>
      </form>
    </section>
  )
}

ArtifactForm.propTypes = {
  onCreated: PropTypes.func.isRequired,
}

function ArtifactEditModal({ artifact, onCancel, onUpdated }) {
  const [form, setForm] = useState({
    id: artifact.id,
    title_id: artifact.title_id ?? '',
    title_en: artifact.title_en ?? '',
    era: artifact.era ?? '',
    material: artifact.material ?? '',
    location: artifact.location ?? '',
    description_id: artifact.description_id ?? '',
    description_en: artifact.description_en ?? '',
    image_url: artifact.image_url ?? '',
    image_alt: artifact.image_alt ?? '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imageName, setImageName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape' && !saving) onCancel()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onCancel, saving])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function selectImage(event) {
    const file = event.target.files?.[0] ?? null
    setError('')
    setImageFile(null)
    setImageName('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Pilih berkas gambar dengan format yang valid.')
      event.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran gambar maksimum adalah 10 MB.')
      event.target.value = ''
      return
    }
    setImageFile(file)
    setImageName(file.name)
  }

  async function submitUpdate(event) {
    event.preventDefault()
    const requiredFields = ['title_id', 'title_en', 'era', 'description_id', 'description_en', 'image_alt']
    if (requiredFields.some((field) => !form[field].trim())) {
      setError('Lengkapi semua kolom wajib sebelum menyimpan perubahan.')
      return
    }
    if (!supabaseConfigured || !supabase) {
      setError('Supabase belum dikonfigurasi. Lengkapi URL dan anon key pada environment aplikasi.')
      return
    }

    setSaving(true)
    setError('')
    let uploadedPath = ''
    let databaseUpdated = false
    try {
      let imageUrl = form.image_url || null
      if (imageFile) {
        const extension = imageFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'img'
        uploadedPath = `${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('artifact-images')
          .upload(uploadedPath, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type })
        if (uploadError) throw new Error(`Gagal mengunggah gambar: ${uploadError.message}`)
        const { data } = supabase.storage.from('artifact-images').getPublicUrl(uploadedPath)
        imageUrl = data.publicUrl
      }

      const { data: updatedArtifact, error: updateError } = await supabase.from('artifacts').update({
        title_id: form.title_id.trim(),
        title_en: form.title_en.trim(),
        era: form.era.trim(),
        material: form.material.trim() || null,
        location: form.location.trim() || null,
        description_id: form.description_id.trim(),
        description_en: form.description_en.trim(),
        image_url: imageUrl,
        image_alt: form.image_alt.trim(),
      }).eq('id', form.id).select('id').maybeSingle()
      if (updateError) throw new Error(`Artefak gagal diperbarui: ${updateError.message}`)
      if (!updatedArtifact) throw new Error('Artefak tidak diperbarui. Periksa izin akses dan kebijakan Supabase.')

      databaseUpdated = true
      await onUpdated(artifact.title_id)
    } catch (updateError) {
      let detail = updateError instanceof Error ? updateError.message : 'Terjadi kesalahan yang tidak diketahui.'
      if (uploadedPath && !databaseUpdated) {
        const { error: cleanupError } = await supabase.storage.from('artifact-images').remove([uploadedPath])
        if (cleanupError) detail += ` Gambar sementara juga gagal dibersihkan: ${cleanupError.message}`
      }
      setError(detail)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-3 sm:p-6" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel()
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="edit-artifact-title" className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-burgundy/20 bg-cream p-5 text-burgundy shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-artifact-title" className="font-serif text-2xl font-bold">Edit artefak</h2>
            <p className="mt-1 text-sm text-burgundy/75">Perbarui informasi koleksi dan simpan perubahan.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 shrink-0 rounded-full border border-burgundy px-4 text-sm font-semibold disabled:opacity-50">
            Batal
          </button>
        </div>

        <form onSubmit={submitUpdate} className="mt-6 grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="id" value={form.id} />
          <div className="min-w-0">
            <label htmlFor="edit-title_id" className={LABEL_CLASS}>Nama artefak · Indonesia</label>
            <input id="edit-title_id" name="title_id" required maxLength={200} value={form.title_id} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0">
            <label htmlFor="edit-title_en" className={LABEL_CLASS}>Artifact title · English</label>
            <input id="edit-title_en" name="title_en" required maxLength={200} value={form.title_en} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0">
            <label htmlFor="edit-era" className={LABEL_CLASS}>Era / periode</label>
            <input id="edit-era" name="era" required maxLength={160} value={form.era} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0">
            <label htmlFor="edit-material" className={LABEL_CLASS}>Bahan</label>
            <input id="edit-material" name="material" maxLength={200} value={form.material} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="edit-location" className={LABEL_CLASS}>Lokasi / asal koleksi</label>
            <input id="edit-location" name="location" maxLength={240} value={form.location} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="edit-description_id" className={LABEL_CLASS}>Deskripsi · Bahasa Indonesia</label>
            <textarea id="edit-description_id" name="description_id" required rows={5} maxLength={12000} value={form.description_id} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="edit-description_en" className={LABEL_CLASS}>Description · English</label>
            <textarea id="edit-description_en" name="description_en" required rows={5} maxLength={12000} value={form.description_en} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="edit-image_alt" className={LABEL_CLASS}>Teks alternatif gambar</label>
            <input id="edit-image_alt" name="image_alt" required maxLength={500} value={form.image_alt} onChange={updateField} className={INPUT_CLASS} />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="edit-artifact-image" className={LABEL_CLASS}>Ganti gambar (opsional, maks. 10 MB)</label>
            {form.image_url && !imageFile && (
              <img src={form.image_url} alt={form.image_alt} className="mt-2 h-32 w-48 rounded-xl border border-burgundy/20 object-cover" />
            )}
            <input id="edit-artifact-image" name="image" type="file" accept="image/*" onChange={selectImage} className="sr-only" />
            <label htmlFor="edit-artifact-image" className="mt-2 flex min-h-14 w-full max-w-md cursor-pointer items-center justify-center gap-2 break-all rounded-xl border-2 border-dashed border-burgundy/30 px-4 py-3 text-center text-sm font-semibold hover:bg-primary/10 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <Upload aria-hidden="true" size={18} /> {imageName || 'Pilih gambar baru'}
            </label>
            <p className="mt-1 text-xs text-burgundy/70">Jika tidak memilih gambar baru, gambar saat ini akan tetap digunakan.</p>
          </div>
          {error && <p role="alert" className="sm:col-span-2 text-sm font-semibold text-terracotta">{error}</p>}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-burgundy px-6 font-bold text-cream hover:bg-terracotta focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <Pencil aria-hidden="true" size={17} />}
              {saving ? 'Menyimpan perubahan…' : 'Simpan perubahan'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving} className="min-h-12 rounded-full border border-burgundy px-6 font-semibold disabled:opacity-50">
              Batal
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

ArtifactEditModal.propTypes = {
  artifact: ArtifactPropType.isRequired,
  onCancel: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
}

function drawWrappedText(context, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  lines.forEach((textLine, index) => context.fillText(textLine, centerX, startY + index * lineHeight))
  return lines.length
}

function QRStudioCard({ artifact, onDelete, onEdit, deleting }) {
  const artifactSlug = getArtifactSlug(artifact)
  const artifactUrl = `${window.location.origin}/artifact/${encodeURIComponent(artifactSlug)}`

  async function downloadPrintableQR(event) {
    const sourceCanvas = event.currentTarget.closest('[data-qr-card]')?.querySelector('canvas')
    if (!sourceCanvas) throw new Error('QR code belum siap untuk diunduh.')
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 560
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Browser tidak mendukung pembuatan gambar QR.')

    context.fillStyle = '#F8E0A4'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#6C1A1A'
    context.lineWidth = 14
    context.strokeRect(7, 7, canvas.width - 14, canvas.height - 14)
    const qrSize = 320
    context.fillStyle = '#FFFFFF'
    context.fillRect((canvas.width - qrSize) / 2 - 12, 34, qrSize + 24, qrSize + 24)
    context.drawImage(sourceCanvas, (canvas.width - qrSize) / 2, 46, qrSize, qrSize)
    context.fillStyle = '#6C1A1A'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.font = 'bold 24px Georgia, serif'
    drawWrappedText(context, artifact.title_id, canvas.width / 2, 400, 396, 30)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG tidak dapat dibuat oleh browser.')), 'image/png')
    })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `qr-${artifactSlug}.png`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }

  async function handleDownload(event) {
    const button = event.currentTarget
    const originalLabel = button.textContent
    button.disabled = true
    try {
      await downloadPrintableQR(event)
      button.dataset.status = 'success'
      button.setAttribute('aria-label', 'QR printable berhasil diunduh')
    } catch (downloadError) {
      button.dataset.status = 'error'
      button.setAttribute('aria-label', downloadError instanceof Error ? downloadError.message : 'Gagal mengunduh QR')
      window.alert(downloadError instanceof Error ? downloadError.message : 'Gagal mengunduh QR code.')
    } finally {
      button.disabled = false
      button.textContent = originalLabel
      window.setTimeout(() => {
        delete button.dataset.status
        button.removeAttribute('aria-label')
      }, 2500)
    }
  }

  return (
    <article data-qr-card className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-burgundy/20 bg-cream p-4">
      <div className="grid min-h-48 w-full max-w-md place-items-center overflow-hidden rounded-xl bg-white p-3 sm:p-4">
        <QRCodeCanvas value={artifactUrl} size={160} level="H" includeMargin aria-label={`QR code untuk ${artifact.title_id}`} className="h-auto max-w-full" />
      </div>
      <h3 className="mt-4 line-clamp-2 min-h-12 font-serif text-lg font-bold">{artifact.title_id}</h3>
      <p className="mt-1 text-sm text-burgundy/75">{artifact.era}</p>
      <a href={artifactUrl} className="mt-2 break-all text-xs text-burgundy underline underline-offset-2">{artifactUrl}</a>
      <button type="button" onClick={handleDownload} className="mt-4 inline-flex min-h-11 w-full max-w-md items-center justify-center gap-2 rounded-full bg-burgundy px-3 text-sm font-bold text-cream hover:bg-terracotta focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <Download aria-hidden="true" size={17} /> Download QR printable
      </button>
      <div className="mt-2 flex w-full max-w-md gap-2">
        <button type="button" onClick={() => onEdit(artifact)} disabled={deleting} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-burgundy px-3 text-sm font-semibold hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50">
          <Pencil aria-hidden="true" size={16} /> Edit
        </button>
        <button type="button" onClick={() => onDelete(artifact)} disabled={deleting} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-terracotta px-3 text-sm font-semibold text-terracotta hover:bg-terracotta hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50">
          <Trash2 aria-hidden="true" size={16} /> {deleting ? 'Menghapus…' : 'Hapus'}
        </button>
      </div>
    </article>
  )
}

QRStudioCard.propTypes = {
  artifact: ArtifactPropType.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  deleting: PropTypes.bool.isRequired,
}

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('heritage-admin-unlocked') === 'true')
  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(() => sessionStorage.getItem('heritage-admin-unlocked') === 'true')
  const [pageError, setPageError] = useState('')
  const [pageMessage, setPageMessage] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [editingArtifact, setEditingArtifact] = useState(null)

  async function loadArtifacts() {
    if (!supabaseConfigured || !supabase) {
      setPageError('Supabase belum dikonfigurasi. Lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
      return
    }
    setLoading(true)
    setPageError('')
    const { data, error } = await supabase.from('artifacts')
      .select('id, slug, title_id, title_en, era, material, location, description_id, description_en, image_url, image_alt, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      setPageError(`Gagal memuat koleksi: ${error.message}`)
    } else {
      setArtifacts(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!unlocked) return undefined
    let active = true
    Promise.resolve().then(async () => {
      if (!supabaseConfigured || !supabase) {
        if (active) {
          setPageError('Supabase belum dikonfigurasi. Lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
          setLoading(false)
        }
        return
      }
      const { data, error } = await supabase.from('artifacts')
        .select('id, slug, title_id, title_en, era, material, location, description_id, description_en, image_url, image_alt, created_at')
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        setPageError(`Gagal memuat koleksi: ${error.message}`)
      } else {
        setArtifacts(data ?? [])
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [unlocked])

  async function deleteArtifact(artifact) {
    if (!window.confirm(`Hapus artefak “${artifact.title_id}”? Tindakan ini tidak dapat dibatalkan.`)) return
    if (!supabase) {
      setPageError('Supabase belum dikonfigurasi.')
      return
    }
    setDeletingId(artifact.id)
    setPageError('')
    setPageMessage('')
    const { error } = await supabase.from('artifacts').delete().eq('id', artifact.id)
    if (error) {
      setPageError(`Artefak gagal dihapus: ${error.message}`)
    } else {
      setArtifacts((current) => current.filter((item) => item.id !== artifact.id))
      setPageMessage(`“${artifact.title_id}” berhasil dihapus.`)
    }
    setDeletingId('')
  }

  async function handleArtifactUpdated(title) {
    setEditingArtifact(null)
    setPageMessage(`“${title}” berhasil diperbarui.`)
    await loadArtifacts()
  }

  if (!unlocked) return <PasscodeGate onUnlock={() => { setLoading(true); setUnlocked(true) }} />

  return (
    <main className="min-h-screen overflow-x-hidden bg-cream px-5 pb-16 pt-6 text-burgundy sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-burgundy/20 pb-6">
          <div>
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <ArrowLeft aria-hidden="true" size={17} /> Beranda
            </Link>
            <h1 className="mt-5 font-serif text-4xl font-bold">Studio koleksi</h1>
            <p className="mt-2">Kelola artefak dan siapkan QR untuk ruang pamer.</p>
          </div>
          <button type="button" onClick={() => { sessionStorage.removeItem('heritage-admin-unlocked'); setUnlocked(false) }} className="min-h-11 rounded-full border border-burgundy px-4 text-sm font-semibold hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Keluar dari admin
          </button>
        </header>

        <div className="mt-8 space-y-10">
          {!supabaseConfigured && <div role="alert" className="rounded-2xl border border-terracotta bg-white/60 p-4 text-sm font-semibold text-terracotta">Koneksi Supabase belum tersedia. Periksa file environment sebelum mengelola koleksi.</div>}
          {pageError && <div role="alert" className="rounded-2xl border border-terracotta bg-white/60 p-4 text-sm font-semibold text-terracotta">{pageError}</div>}
          {pageMessage && <div role="status" className="rounded-2xl border border-primary bg-white/60 p-4 text-sm font-semibold">{pageMessage}</div>}
          <ArtifactForm onCreated={loadArtifacts} />

          <section aria-labelledby="collection-title" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">QR studio</p>
                <h2 id="collection-title" className="mt-1 font-serif text-3xl font-bold">Koleksi artefak</h2>
              </div>
              <span className="rounded-full bg-primary/20 px-4 py-2 text-sm font-bold">{artifacts.length} artefak</span>
            </div>
            {loading ? (
              <p role="status" className="mt-6 inline-flex items-center gap-2"><LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> Memuat koleksi…</p>
            ) : artifacts.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-burgundy/30 bg-white/40 p-8 text-center">
                <QrCode className="mx-auto" aria-hidden="true" size={32} />
                <p className="mt-3 font-semibold">Belum ada artefak dalam koleksi.</p>
                <p className="mt-1 text-sm">Artefak yang disimpan akan muncul di sini bersama QR code-nya.</p>
              </div>
            ) : (
              <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {artifacts.map((artifact) => (
                  <QRStudioCard
                    key={artifact.id}
                    artifact={artifact}
                    onDelete={deleteArtifact}
                    onEdit={setEditingArtifact}
                    deleting={deletingId === artifact.id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      {editingArtifact && (
        <ArtifactEditModal
          artifact={editingArtifact}
          onCancel={() => setEditingArtifact(null)}
          onUpdated={handleArtifactUpdated}
        />
      )}
    </main>
  )
}
