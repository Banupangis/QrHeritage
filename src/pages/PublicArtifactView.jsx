import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useParams } from 'react-router-dom'
import { PROTOTYPE_ARTIFACTS } from '../data/prototypeArtifacts.js'
import { getArtifactSlug, slugifyArtifactTitle } from '../lib/artifactSlug.js'
import {
  ArrowLeft,
  Check,
  Contrast,
  Copy,
  Expand,
  Headphones,
  Landmark,
  MapPin,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function ArtifactSkeleton() {
  return (
    <main aria-label="Memuat informasi artefak" aria-busy="true" className="min-h-screen animate-pulse bg-cream px-5 py-8 text-burgundy sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="h-9 w-40 rounded bg-burgundy/10" />
        <div className="mt-8 h-12 max-w-xl rounded bg-burgundy/10" />
        <div className="mt-4 h-5 w-40 rounded bg-burgundy/10" />
        <div className="mt-8 aspect-[16/10] rounded-3xl bg-burgundy/10" />
        <div className="mt-8 space-y-3">
          <div className="h-4 rounded bg-burgundy/10" />
          <div className="h-4 rounded bg-burgundy/10" />
          <div className="h-4 w-4/5 rounded bg-burgundy/10" />
        </div>
      </div>
    </main>
  )
}

function SiteFooter({ highContrast }) {
  return (
    <footer className={`mt-16 border-t px-5 py-8 text-sm sm:px-8 ${highContrast ? 'border-cream/30 text-cream/90' : 'border-burgundy/20 text-burgundy/80'}`}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl leading-6">
          Ruang Warisan didedikasikan untuk pendidikan dan konservasi budaya. Informasi koleksi disediakan tanpa tujuan komersial.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">
          <Landmark aria-hidden="true" size={17} /> Ruang Warisan
        </Link>
      </div>
    </footer>
  )
}

SiteFooter.propTypes = {
  highContrast: PropTypes.bool.isRequired,
}

export default function PublicArtifactView() {
  const { id } = useParams()
  const [artifact, setArtifact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lang, setLang] = useState('ID')
  const [fontIndex, setFontIndex] = useState(1)
  const [highContrast, setHighContrast] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    async function loadArtifact() {
      setLoading(true)
      setError('')
      setArtifact(null)
      const prototypeArtifact = PROTOTYPE_ARTIFACTS.find((item) => item.id === id)
      if (!supabaseConfigured || !supabase) {
        if (prototypeArtifact) {
          setArtifact(prototypeArtifact)
          setNotice('Anda sedang melihat artefak contoh untuk pratinjau museum.')
        } else {
          setError('Museum belum terhubung ke Supabase. Lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY untuk memuat koleksi.')
        }
        setLoading(false)
        return
      }

      let { data, error: fetchError } = await supabase
        .from('artifacts')
        .select('id, slug, title_id, title_en, era, description_id, description_en, material, location, image_url, image_alt, created_at')
        .eq('slug', id)
        .maybeSingle()
      if (!fetchError && !data) {
        data = prototypeArtifact ?? null
      }
      if (!fetchError && !data && UUID_PATTERN.test(id ?? '')) {
        const legacyResult = await supabase
          .from('artifacts')
          .select('id, slug, title_id, title_en, era, description_id, description_en, material, location, image_url, image_alt, created_at')
          .eq('id', id)
          .maybeSingle()
        data = legacyResult.data
        fetchError = legacyResult.error
      }
      if (!fetchError && !data && !UUID_PATTERN.test(id ?? '')) {
        const legacySlugResult = await supabase
          .from('artifacts')
          .select('id, slug, title_id, title_en, era, description_id, description_en, material, location, image_url, image_alt, created_at')
          .is('slug', null)
        if (legacySlugResult.error) {
          fetchError = legacySlugResult.error
        } else {
          data = legacySlugResult.data?.find((item) => slugifyArtifactTitle(item.title_id) === id) ?? null
        }
      }
      if (!active) return
      if (fetchError) {
        if (prototypeArtifact) {
          setArtifact(prototypeArtifact)
          setNotice(`Artefak contoh ditampilkan karena koleksi Supabase belum dapat dimuat: ${fetchError.message}`)
        } else {
          setError(`Koleksi tidak dapat dimuat: ${fetchError.message}`)
        }
      } else if (!data) {
        setError('Artefak yang Anda cari tidak ditemukan.')
      } else {
        setArtifact(data)
        if (PROTOTYPE_ARTIFACTS.some((prototype) => prototype.id === data.id)) {
          setNotice('Anda sedang melihat artefak contoh untuk pratinjau museum.')
        } else if (getArtifactSlug(data) !== data.slug) {
          setNotice('Slug artefak ini belum tersimpan. Jalankan migrasi slug di Supabase untuk membuat tautan unik yang permanen.')
        }
      }
      setLoading(false)
    }

    loadArtifact()
    return () => {
      active = false
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [id])

  useEffect(() => {
    if (!imageOpen) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape') setImageOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [imageOpen])

  const title = artifact ? (lang === 'ID' ? artifact.title_id : artifact.title_en) : ''
  const description = artifact ? (lang === 'ID' ? artifact.description_id : artifact.description_en) : ''
  const readingMinutes = useMemo(() => {
    const words = description.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  }, [description])

  const toggleSpeech = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setNotice(lang === 'ID' ? 'Fitur suara tidak didukung di browser ini.' : 'Text-to-speech is not supported in this browser.')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(`${title}. ${description}`)
    utterance.lang = lang === 'ID' ? 'id-ID' : 'en-US'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => {
      setSpeaking(false)
      setNotice(lang === 'ID' ? 'Narasi suara tidak dapat diputar.' : 'The narration could not be played.')
    }
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    setNotice('')
  }, [description, lang, speaking, title])

  async function copyCitation() {
    const year = artifact.created_at ? new Date(artifact.created_at).getFullYear() : new Date().getFullYear()
    const workTitle = lang === 'ID' ? `${title} [Artefak museum]` : `${title} [Museum artifact]`
    const citation = `Ruang Warisan. (${year}). ${workTitle}. ${window.location.origin}/artifact/${artifact.id}`
    try {
      await navigator.clipboard.writeText(citation)
      setNotice(lang === 'ID' ? 'Sitasi akademik berhasil disalin.' : 'Academic citation copied.')
    } catch {
      setNotice(lang === 'ID' ? 'Clipboard tidak tersedia. Salin sitasi berikut secara manual: ' + citation : 'Clipboard is unavailable. Copy this citation manually: ' + citation)
    }
  }

  if (loading) return <ArtifactSkeleton />

  if (!artifact) {
    return (
      <main lang={lang === 'ID' ? 'id' : 'en'} className="grid min-h-screen place-items-center bg-cream px-5 text-burgundy">
        <div className="max-w-lg rounded-3xl border border-burgundy/20 bg-white/60 p-8 text-center shadow-sm">
          <Landmark className="mx-auto" size={34} aria-hidden="true" />
          <h1 className="mt-5 font-serif text-3xl font-bold">{lang === 'ID' ? 'Koleksi belum tersedia' : 'Collection unavailable'}</h1>
          <p role="alert" className="mt-3 leading-7">{error}</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-burgundy px-5 py-3 font-semibold text-cream">
            {lang === 'ID' ? 'Kembali ke beranda' : 'Back to home'}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main lang={lang === 'ID' ? 'id' : 'en'} className={`min-h-screen transition-colors ${highContrast ? 'bg-burgundy text-cream' : 'bg-cream text-burgundy'}`}>
      <div className={`sticky top-0 z-20 border-b backdrop-blur ${highContrast ? 'border-cream/20 bg-burgundy/95' : 'border-burgundy/15 bg-cream/95'}`}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link to="/" aria-label={lang === 'ID' ? 'Kembali ke beranda' : 'Back to home'} className="inline-flex items-center gap-2 rounded-full px-2 py-2 font-semibold">
            <ArrowLeft aria-hidden="true" size={18} /> <span className="hidden sm:inline">{lang === 'ID' ? 'Beranda' : 'Home'}</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={toggleSpeech} aria-pressed={speaking} aria-label={speaking ? 'Hentikan narasi' : 'Dengarkan narasi'} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-current px-3 text-sm font-semibold hover:bg-primary/20">
              {speaking ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
              <span className="hidden sm:inline">{speaking ? (lang === 'ID' ? 'Hentikan' : 'Stop') : (lang === 'ID' ? 'Dengarkan' : 'Listen')}</span>
            </button>
            <div role="group" aria-label={lang === 'ID' ? 'Ukuran teks' : 'Text size'} className="flex overflow-hidden rounded-full border border-current">
              <button type="button" onClick={() => setFontIndex((value) => Math.max(0, value - 1))} disabled={fontIndex === 0} aria-label={lang === 'ID' ? 'Perkecil teks' : 'Decrease text size'} className="size-10 text-lg font-bold disabled:opacity-40">A−</button>
              <button type="button" onClick={() => setFontIndex((value) => Math.min(FONT_SIZES.length - 1, value + 1))} disabled={fontIndex === FONT_SIZES.length - 1} aria-label={lang === 'ID' ? 'Perbesar teks' : 'Increase text size'} className="size-10 border-l border-current text-lg font-bold disabled:opacity-40">A+</button>
            </div>
            <button type="button" onClick={() => setLang((value) => value === 'ID' ? 'EN' : 'ID')} aria-label={lang === 'ID' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'} className="min-h-10 rounded-full border border-current px-3 text-sm font-bold">
              {lang === 'ID' ? 'ID · EN' : 'EN · ID'}
            </button>
            <button type="button" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast} aria-label={lang === 'ID' ? 'Aktifkan kontras tinggi' : 'Toggle high contrast'} className="grid size-10 place-items-center rounded-full border border-current">
              <Contrast aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      </div>

      <article className={`mx-auto max-w-4xl px-5 pb-4 pt-9 sm:px-8 sm:pt-14 ${FONT_SIZES[fontIndex]}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.17em]">
          <span className={`rounded-full px-3 py-1.5 ${highContrast ? 'bg-cream text-burgundy' : 'bg-primary/20 text-burgundy'}`}>{artifact.era}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-current/30 px-3 py-1.5">
            <Headphones aria-hidden="true" size={14} /> {readingMinutes} {lang === 'ID' ? 'menit membaca' : 'min read'}
          </span>
        </div>
        <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>

        {artifact.image_url ? (
          <button type="button" onClick={() => setImageOpen(true)} aria-label={lang === 'ID' ? `Perbesar gambar: ${artifact.image_alt}` : `Zoom image: ${artifact.image_alt}`} className="group relative mt-8 block w-full overflow-hidden rounded-3xl border-2 border-current/20 text-left">
            <img src={artifact.image_url} alt={artifact.image_alt} className="max-h-[34rem] w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-cream">
              <Expand aria-hidden="true" size={16} /> {lang === 'ID' ? 'Perbesar' : 'Zoom'}
            </span>
          </button>
        ) : (
          <div className={`mt-8 grid aspect-[16/8] place-items-center rounded-3xl border border-dashed border-current/30 ${highContrast ? 'bg-white/5' : 'bg-white/30'}`}>
            <Landmark aria-hidden="true" size={48} className="opacity-50" />
          </div>
        )}

        <section aria-labelledby="story-title" className="mt-9">
          <h2 id="story-title" className="font-serif text-2xl font-bold">{lang === 'ID' ? 'Kisah artefak' : 'The artifact story'}</h2>
          <p className="mt-4 whitespace-pre-line leading-[1.9]">{description}</p>
        </section>

        <section aria-labelledby="facts-title" className={`mt-10 rounded-3xl border p-5 sm:p-7 ${highContrast ? 'border-cream/30 bg-white/5' : 'border-burgundy/15 bg-white/50'}`}>
          <h2 id="facts-title" className="font-serif text-xl font-bold">{lang === 'ID' ? 'Fakta singkat' : 'Quick facts'}</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider opacity-70">{lang === 'ID' ? 'Bahan' : 'Material'}</dt>
              <dd className="mt-1 font-semibold">{artifact.material || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider opacity-70">{lang === 'ID' ? 'Lokasi' : 'Location'}</dt>
              <dd className="mt-1 inline-flex items-center gap-1 font-semibold"><MapPin aria-hidden="true" size={16} /> {artifact.location || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider opacity-70">{lang === 'ID' ? 'Era' : 'Era'}</dt>
              <dd className="mt-1 font-semibold">{artifact.era}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-8">
          <button type="button" onClick={copyCitation} className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold ${highContrast ? 'bg-cream text-burgundy hover:bg-white' : 'bg-burgundy text-cream hover:bg-terracotta'}`}>
            {notice.includes(lang === 'ID' ? 'disalin' : 'copied') ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
            {lang === 'ID' ? 'Salin sitasi akademik' : 'Copy academic citation'}
          </button>
          {notice && <p role="status" className="mt-3 break-words text-sm" aria-live="polite">{notice}</p>}
        </div>
      </article>

      <SiteFooter highContrast={highContrast} />

      {imageOpen && artifact.image_url && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setImageOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={artifact.image_alt} className="relative max-h-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" autoFocus onClick={() => setImageOpen(false)} aria-label={lang === 'ID' ? 'Tutup gambar' : 'Close image'} className="absolute -right-2 -top-2 z-10 grid size-11 place-items-center rounded-full bg-cream text-burgundy">
              <X aria-hidden="true" size={22} />
            </button>
            <img src={artifact.image_url} alt={artifact.image_alt} className="max-h-[90vh] max-w-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </main>
  )
}
