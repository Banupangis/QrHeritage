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
  Search,
  X,
} from 'lucide-react'
import { PROTOTYPE_ARTIFACTS } from '../data/prototypeArtifacts.js'
import heroImage from '../assets/images.jpg'
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
    <article className={`group flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/65 text-burgundy'}`}>
      <Link to={detailsPath} className="block overflow-hidden" aria-label={`Lihat artefak: ${titleId}`}>
        <img
          src={artifact.image_url || PROTOTYPE_ARTIFACTS[0].image_url}
          alt={artifact.image_alt || `Ilustrasi ${titleId}`}
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className="inline-flex rounded bg-primary/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-burgundy">
          {artifact.era}
        </span>
        <h3 className="mt-4 font-serif text-xl font-bold leading-snug">{titleId}</h3>
        <p className="mt-1 text-sm font-medium text-burgundy/80">{titleEn}</p>
        <p className="mt-4 line-clamp-3 leading-7 text-burgundy">{summaryId || summaryEn}</p>
        {summaryId && summaryEn && <p lang="en" className="mt-2 line-clamp-2 text-sm leading-6 text-burgundy/80">{summaryEn}</p>}
        <Link
          to={detailsPath}
          className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-burgundy px-5 py-2 font-semibold text-cream transition hover:bg-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
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
        <p>Situs Manusia Purba Sangiran — jejak evolusi manusia di Indonesia.</p>
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
  const [searchQuery, setSearchQuery] = useState('')
  const [collectionNotice, setCollectionNotice] = useState(
    supabaseConfigured ? '' : 'Menampilkan koleksi contoh. Hubungkan Supabase untuk memuat koleksi museum.',
  )
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('id')
  const filteredArtifacts = normalizedSearch
    ? artifacts.filter((artifact) => [
      artifact.title_id,
      artifact.title_en,
      artifact.era,
      artifact.description_id,
      artifact.description_en,
    ].some((value) => value?.toLocaleLowerCase('id').includes(normalizedSearch)))
    : artifacts
  const visibleArtifacts = normalizedSearch ? filteredArtifacts : filteredArtifacts.slice(0, 6)

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return undefined
    let active = true

    async function loadArtifacts() {
      const pageSize = 1000
      const allArtifacts = []
      let offset = 0
      let loadError = null
      while (true) {
        const { data, error } = await supabase
          .from('artifacts')
          .select('id, slug, title_id, title_en, era, description_id, description_en, image_url, image_alt')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1)
        if (error) {
          loadError = error
          break
        }
        allArtifacts.push(...(data ?? []))
        if (!data || data.length < pageSize) break
        offset += pageSize
      }

      if (!active) return
      if (loadError) {
        setCollectionNotice(`Koleksi contoh ditampilkan karena koleksi Supabase belum dapat dimuat: ${loadError.message}`)
      } else if (allArtifacts.length) {
        setArtifacts(allArtifacts)
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
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${highContrast ? 'border-cream/20 bg-burgundy/95' : 'border-burgundy/10 bg-cream/95'}`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-primary" aria-label="Situs Manusia Purba Sangiran, beranda">
            <span className={`grid size-11 shrink-0 place-items-center rounded-full ${highContrast ? 'bg-cream text-burgundy' : 'bg-burgundy text-cream'}`}>
              <Landmark aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block font-serif text-lg font-bold leading-tight sm:text-xl">Situs Sangiran</span>
              <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.16em] sm:text-xs">Situs Manusia Purba · Jawa Tengah</span>
            </span>
          </Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-2">
            <a href="#koleksi" className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex">Koleksi</a>
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

          </nav>
        </div>
      </header>

      <div id="main-content">
        <section aria-labelledby="hero-title" className={`relative isolate min-h-[34rem] overflow-hidden sm:min-h-[42rem] ${highContrast ? 'bg-burgundy' : 'bg-cream'}`}>
          <img src={heroImage} alt="Gerbang Museum Manusia Purba Sangiran di tengah kawasan hijau" className="absolute inset-0 -z-20 size-full object-cover object-center" fetchPriority="high" />
          <div aria-hidden="true" className={`absolute inset-0 -z-10 bg-gradient-to-b ${highContrast ? 'from-burgundy/35 via-burgundy/55 to-burgundy' : 'from-black/35 via-black/45 to-black/65'}`} />
          <div className="mx-auto flex min-h-[34rem] max-w-6xl items-end px-5 pb-12 pt-48 sm:min-h-[42rem] sm:px-8 sm:pb-16">
            <div className="max-w-3xl text-cream drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cream">Warisan Dunia UNESCO · Indonesia</p>
              <h1 id="hero-title" className="break-words font-serif text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
                SITUS MANUSIA PURBA SANGIRAN
              </h1>
              <p className="mt-4 text-lg font-semibold leading-7 sm:text-xl">
                Salah satu situs kunci untuk memahami evolusi manusia.
              </p>
              <p className="mt-3 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
                Jelajahi jejak Homo erectus, fosil fauna purba, dan alat batu yang tersimpan dalam lapisan bumi Sangiran selama jutaan tahun.
              </p>
              <a href="#koleksi" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cream px-6 py-3 font-bold text-burgundy transition hover:bg-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                Lihat koleksi <ArrowDown aria-hidden="true" size={18} />
              </a>
            </div>
          </div>
        </section>

        <section id="koleksi" aria-labelledby="collection-title" className={`scroll-mt-6 border-y px-5 py-14 sm:px-8 sm:py-16 ${highContrast ? 'border-cream/30 bg-burgundy' : 'border-burgundy/15 bg-white/35'}`}>
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`text-sm font-bold uppercase tracking-[0.2em] ${highContrast ? 'text-cream' : 'text-terracotta'}`}>Cerita dari masa lampau</p>
                <h2 id="collection-title" className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Jelajahi temuan Sangiran</h2>
                <p className="mt-3 max-w-2xl leading-7">Fosil manusia dan hewan serta alat batu dari Sangiran membantu peneliti memahami kehidupan dan lingkungan pada masa Pleistosen.</p>
              </div>
              {loading && <p role="status" className="inline-flex items-center gap-2 text-sm font-semibold"><LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> Memuat koleksi…</p>}
            </div>

            <div className="relative mt-6 max-w-xl">
              <Search aria-hidden="true" size={19} className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${highContrast ? 'text-burgundy/70' : 'text-burgundy/60'}`} />
              <label htmlFor="collection-search" className="sr-only">Cari di seluruh koleksi Sangiran</label>
              <input
                id="collection-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari di seluruh koleksi: nama, era, atau deskripsi…"
                className={`min-h-12 w-full rounded-full border py-3 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${highContrast ? 'border-cream/50 bg-cream text-burgundy placeholder:text-burgundy/60' : 'border-burgundy/25 bg-white text-burgundy placeholder:text-burgundy/55'}`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X aria-hidden="true" size={17} />
                </button>
              )}
            </div>

            {collectionNotice && (
              <p role="status" className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/20 bg-cream text-burgundy'}`}>
                {collectionNotice}
              </p>
            )}

            {filteredArtifacts.length > 0 ? (
              <>
                {normalizedSearch && <p role="status" aria-live="polite" className="mt-5 text-sm">Ditemukan {filteredArtifacts.length} artefak di seluruh koleksi.</p>}
                <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {visibleArtifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} highContrast={highContrast} />)}
                </div>
                {!normalizedSearch && artifacts.length > 6 && (
                  <div className="mt-8 text-center">
                    <Link to="/koleksi" className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 font-bold transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${highContrast ? 'border border-cream text-cream hover:bg-cream hover:text-burgundy' : 'border border-burgundy text-burgundy hover:bg-burgundy hover:text-cream'}`}>
                      Lihat lebih banyak
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div role="status" aria-live="polite" className={`mt-8 rounded-3xl border border-dashed p-8 text-center ${highContrast ? 'border-cream/40' : 'border-burgundy/30'}`}>
                <p className="font-serif text-xl font-bold">Tidak ada temuan yang cocok</p>
                <p className="mt-2 leading-7">Coba kata kunci lain, seperti nama fosil, alat batu, atau periodenya.</p>
                <button type="button" onClick={() => setSearchQuery('')} className="mt-4 min-h-11 rounded-full border border-current px-5 font-semibold transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary">
                  Hapus pencarian
                </button>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="values-title" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <p className={`text-sm font-bold uppercase tracking-[0.2em] ${highContrast ? 'text-cream' : 'text-terracotta'}`}>Mengapa Sangiran penting</p>
          <h2 id="values-title" className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Membaca jejak kehidupan purba</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <article className={`rounded-3xl border p-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/55 text-burgundy'}`}>
              <span className="grid size-12 place-items-center rounded-full bg-primary/20"><Check aria-hidden="true" size={24} /></span>
              <h3 className="mt-4 font-serif text-xl font-bold">Bukti evolusi manusia</h3>
              <p className="mt-2 leading-7">Temuan Homo erectus menjadikan Sangiran salah satu situs penting dalam kajian evolusi manusia.</p>
            </article>
            <article className={`rounded-3xl border p-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/55 text-burgundy'}`}>
              <span className="grid size-12 place-items-center rounded-full bg-primary/20"><AudioLines aria-hidden="true" size={24} /></span>
              <h3 className="mt-4 font-serif text-xl font-bold">Lapisan bumi yang berkesinambungan</h3>
              <p className="mt-2 leading-7">Lapisan geologi Sangiran menyimpan rekaman panjang perubahan manusia, fauna, dan lingkungan.</p>
            </article>
            <article className={`rounded-3xl border p-6 ${highContrast ? 'border-cream/30 bg-cream text-burgundy' : 'border-burgundy/15 bg-white/55 text-burgundy'}`}>
              <span className="grid size-12 place-items-center rounded-full bg-primary/20"><BookOpen aria-hidden="true" size={24} /></span>
              <h3 className="mt-4 font-serif text-xl font-bold">Warisan Dunia</h3>
              <p className="mt-2 leading-7">Sangiran tercatat sebagai Situs Warisan Dunia UNESCO karena nilai penting temuan fosil dan arkeologinya.</p>
            </article>
          </div>
        </section>

      </div>
      <MuseumFooter highContrast={highContrast} />
    </main>
  )
}
