import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  Contrast,
  Landmark,
  LoaderCircle,
} from 'lucide-react'
import { PROTOTYPE_ARTIFACTS } from '../data/prototypeArtifacts.js'
import { getArtifactSlug } from '../lib/artifactSlug.js'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

function ArtifactCard({ artifact, highContrast }) {
  const titleId = artifact.title_id
  const titleEn = artifact.title_en
  const slug = getArtifactSlug(artifact)
  const summaryId = artifact.description_id || ''
  const summaryEn = artifact.description_en || ''
  const detailsPath = `/artifact/${encodeURIComponent(slug)}`

  return (
    <article className={`group overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/65 text-burgundy'}`}>
      <Link to={detailsPath} className="block overflow-hidden" aria-label={`Lihat artefak: ${titleId}`}>
        <img
          src={artifact.image_url || PROTOTYPE_ARTIFACTS[0].image_url}
          alt={artifact.image_alt || `Ilustrasi ${titleId}`}
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="p-5 sm:p-6">
        <span className="inline-flex rounded-full bg-primary/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-burgundy">
          {artifact.era}
        </span>
        <h3 className="mt-4 font-serif text-xl font-bold leading-snug">{titleId}</h3>
        <p className="mt-1 text-sm font-medium text-burgundy/80">{titleEn}</p>
        <p className="mt-4 line-clamp-3 leading-7 text-burgundy">{summaryId || summaryEn}</p>
        {summaryId && summaryEn && <p lang="en" className="mt-2 line-clamp-2 text-sm leading-6 text-burgundy/80">{summaryEn}</p>}
        <Link
          to={detailsPath}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-burgundy px-5 font-semibold text-cream transition hover:bg-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
        >
          Lihat detail artefak <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
      </div>
    </article>
  )
}

ArtifactCard.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string,
    title_id: PropTypes.string.isRequired,
    title_en: PropTypes.string.isRequired,
    era: PropTypes.string.isRequired,
    description_id: PropTypes.string,
    description_en: PropTypes.string,
    image_url: PropTypes.string,
    image_alt: PropTypes.string,
  }).isRequired,
  highContrast: PropTypes.bool.isRequired,
}

function MuseumFooter({ highContrast }) {
  return (
    <footer className={`border-t px-5 py-8 sm:px-8 ${highContrast ? 'border-cream/30 text-cream' : 'border-burgundy/20 text-burgundy'}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>Museum Konoha  — pengetahuan dan warisan untuk semua.</p>
        <p>Tugas Pancasila Kelompok 2.</p>
      </div>
    </footer>
  )
}

MuseumFooter.propTypes = {
  highContrast: PropTypes.bool.isRequired,
}

export default function HomePage() {
  const [artifacts, setArtifacts] = useState(PROTOTYPE_ARTIFACTS)
  const [highContrast, setHighContrast] = useState(false)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [collectionNotice, setCollectionNotice] = useState(
    supabaseConfigured ? '' : 'Menampilkan koleksi contoh. Hubungkan Supabase untuk memuat koleksi museum.',
  )

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return undefined
    let active = true

    async function loadArtifacts() {
      const { data, error } = await supabase
        .from('artifacts')
        .select('id, slug, title_id, title_en, era, description_id, description_en, image_url, image_alt')
        .order('created_at', { ascending: false })
        .limit(6)

      if (!active) return
      if (error) {
        setCollectionNotice(`Koleksi contoh ditampilkan karena koleksi Supabase belum dapat dimuat: ${error.message}`)
      } else if (data?.length) {
        setArtifacts(data)
        setCollectionNotice('')
      } else {
        setCollectionNotice('Belum ada koleksi di Supabase. Berikut beberapa artefak contoh untuk pratinjau.')
      }
      setLoading(false)
    }

    loadArtifacts()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className={`min-h-screen overflow-x-hidden transition-colors ${highContrast ? 'bg-burgundy text-cream' : 'bg-cream text-burgundy'}`}>
      <a href="#main-content" className={`sr-only z-50 rounded-full px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 ${highContrast ? 'bg-cream text-burgundy' : 'bg-burgundy text-cream'}`}>
        Lewati ke konten utama
      </a>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Museum Pusaka Cakrawala, beranda">
          <span className={`grid size-11 shrink-0 place-items-center rounded-full ${highContrast ? 'bg-cream text-burgundy' : 'bg-burgundy text-cream'}`}>
            <Landmark aria-hidden="true" size={22} />
          </span>
          <span>
            <span className="block font-serif text-lg font-bold leading-tight sm:text-xl">Museum Konoha</span>
            <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.16em] sm:text-xs">Arsip budaya dan peradaban</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHighContrast((value) => !value)}
            aria-pressed={highContrast}
            aria-label={highContrast ? 'Matikan inversi warna' : 'Aktifkan inversi warna'}
            title={highContrast ? 'Matikan inversi warna' : 'Aktifkan inversi warna'}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-current transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Contrast aria-hidden="true" size={19} />
          </button>
          <Link to="/admin" className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${highContrast ? 'border-cream hover:bg-cream hover:text-burgundy' : 'border-burgundy hover:bg-burgundy hover:text-cream'}`}>
            Akses admin
          </Link>
        </div>
      </header>

      <div id="main-content">
        <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-9 sm:px-8 sm:pb-24 sm:pt-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className={`mb-5 text-sm font-bold uppercase tracking-[0.2em] ${highContrast ? 'text-cream' : 'text-terracotta'}`}>Merawat kisah lintas generasi</p>
            <h1 id="hero-title" className="max-w-2xl break-words font-serif text-3xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              MUSEUM KONOHA
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-7">
              Konoha Archaeological Heritage Museum
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">
              Melestarikan artefak, naskah, dan pusaka kuno dengan aksesibilitas tinggi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#koleksi" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 font-bold transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${highContrast ? 'bg-cream text-burgundy hover:bg-white' : 'bg-burgundy text-cream hover:bg-terracotta'}`}>
                Lihat koleksi <ArrowDown aria-hidden="true" size={18} />
              </a>

            </div>
          </div>
          <div role="img" aria-label="Ilustrasi artefak kuno yang disimpan dan dirawat di museum" className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2rem] border-4 p-3 ${highContrast ? 'border-cream bg-burgundy' : 'border-burgundy bg-cream'}`}>
            <div aria-hidden="true" className={`absolute inset-5 rounded-[1.5rem] border ${highContrast ? 'border-cream/40' : 'border-burgundy/30'}`} />
            <div aria-hidden="true" className="relative grid size-48 place-items-center rounded-full border border-burgundy/30 bg-cream/70 text-burgundy shadow-xl sm:size-64">
              <Landmark size={132} strokeWidth={1.15} className="size-28 sm:size-40" />
            </div>
          </div>
        </section>

        <section id="koleksi" aria-labelledby="collection-title" className={`scroll-mt-6 border-y px-5 py-14 sm:px-8 sm:py-16 ${highContrast ? 'border-cream/30 bg-burgundy' : 'border-burgundy/15 bg-white/35'}`}>
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`text-sm font-bold uppercase tracking-[0.2em] ${highContrast ? 'text-cream' : 'text-terracotta'}`}>Cerita dari masa lampau</p>
                <h2 id="collection-title" className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Jelajahi koleksi</h2>
                <p className="mt-3 max-w-2xl leading-7">Setiap benda menyimpan pengetahuan tentang kehidupan, keterampilan, dan nilai masyarakat terdahulu.</p>
              </div>
              {loading && <p role="status" className="inline-flex items-center gap-2 text-sm font-semibold"><LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> Memuat koleksi…</p>}
            </div>

            {collectionNotice && (
              <p role="status" className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/20 bg-cream text-burgundy'}`}>
                {collectionNotice}
              </p>
            )}

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {artifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} highContrast={highContrast} />)}
            </div>
          </div>
        </section>

        <section aria-labelledby="values-title" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <p className={`text-sm font-bold uppercase tracking-[0.2em] ${highContrast ? 'text-cream' : 'text-terracotta'}`}>Nilai museum</p>
          <h2 id="values-title" className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Warisan terbuka untuk semua</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <article className={`rounded-3xl border p-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/55 text-burgundy'}`}>
              <span className="grid size-12 place-items-center rounded-full bg-primary/20"><Check aria-hidden="true" size={24} /></span>
              <h3 className="mt-4 font-serif text-xl font-bold">100% non-komersial</h3>
              <p className="mt-2 leading-7">Koleksi dibagikan demi pembelajaran dan pelestarian, bukan untuk iklan atau transaksi.</p>
            </article>
            <article className={`rounded-3xl border p-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/55 text-burgundy'}`}>
              <span className="grid size-12 place-items-center rounded-full bg-primary/20"><AudioLines aria-hidden="true" size={24} /></span>
              <h3 className="mt-4 font-serif text-xl font-bold">Aksesibilitas universal</h3>
              <p className="mt-2 leading-7">Narasi audio, ukuran teks yang dapat disesuaikan, dan kontrol kontras mendukung beragam kebutuhan.</p>
            </article>
            <article className={`rounded-3xl border p-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/55 text-burgundy'}`}>
              <span className="grid size-12 place-items-center rounded-full bg-primary/20"><BookOpen aria-hidden="true" size={24} /></span>
              <h3 className="mt-4 font-serif text-xl font-bold">Akurasi warisan sejarah</h3>
              <p className="mt-2 leading-7">Informasi koleksi disajikan dengan teliti, menghormati sumber dan konteks sejarahnya.</p>
            </article>
          </div>
        </section>
      </div>
      <MuseumFooter highContrast={highContrast} />
    </main>
  )
}
