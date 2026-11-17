import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Landmark, LoaderCircle } from 'lucide-react'
import { PROTOTYPE_ARTIFACTS } from '../data/prototypeArtifacts.js'
import { getArtifactSlug } from '../lib/artifactSlug.js'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const PAGE_SIZE = 500

export default function CollectionPage() {
  const [artifacts, setArtifacts] = useState(PROTOTYPE_ARTIFACTS)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [notice, setNotice] = useState(supabaseConfigured ? '' : 'Menampilkan koleksi contoh. Hubungkan Supabase untuk memuat seluruh koleksi temuan Sangiran.')

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return undefined
    let active = true

    async function loadArtifacts() {
      const allArtifacts = []
      let offset = 0
      let fetchError = null

      while (true) {
        const { data, error } = await supabase
          .from('artifacts')
          .select('id, slug, title_id, title_en, era, description_id, description_en, image_url, image_alt')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)

        if (error) {
          fetchError = error
          break
        }
        allArtifacts.push(...(data ?? []))
        if (!data || data.length < PAGE_SIZE) break
        offset += PAGE_SIZE
      }

      if (!active) return
      if (fetchError) {
        setNotice(`Koleksi contoh ditampilkan karena koleksi Sangiran belum dapat dimuat: ${fetchError.message}`)
      } else if (allArtifacts.length) {
        setArtifacts(allArtifacts)
        setNotice('')
      } else {
        setArtifacts([])
        setNotice('Belum ada temuan yang dimasukkan ke katalog digital Sangiran.')
      }
      setLoading(false)
    }

    loadArtifacts()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen overflow-x-hidden bg-cream text-burgundy">
      <header className="border-b border-burgundy/15 bg-white/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary">
            <ArrowLeft aria-hidden="true" size={18} /> Kembali ke beranda
          </Link>
          <Link to="/" aria-label="Situs Manusia Purba Sangiran, beranda" className="grid size-11 place-items-center rounded-full bg-burgundy text-cream">
            <Landmark aria-hidden="true" size={21} />
          </Link>
        </div>
      </header>

      <section aria-labelledby="all-collections-title" className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-terracotta">Situs Manusia Purba Sangiran · Jawa Tengah</p>
        <h1 id="all-collections-title" className="mt-2 font-serif text-3xl font-bold sm:text-5xl">Katalog temuan Sangiran</h1>
        <p className="mt-4 max-w-2xl leading-7">Jelajahi fosil manusia purba, fauna, dan artefak yang merekam kehidupan serta lingkungan Sangiran pada masa lampau.</p>
        {loading && <p role="status" className="mt-8 inline-flex items-center gap-2 font-semibold"><LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> Memuat seluruh koleksi…</p>}
        {notice && <p role="status" className="mt-8 rounded-2xl border border-burgundy/20 bg-white/60 p-4 text-sm leading-6">{notice}</p>}

        {artifacts.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-semibold">{artifacts.length} temuan</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {artifacts.map((artifact) => {
                const slug = getArtifactSlug(artifact)
                return (
                  <article key={artifact.id} className="flex h-full flex-col overflow-hidden rounded-3xl border border-burgundy/15 bg-white/65 shadow-sm">
                    <Link to={`/artifact/${encodeURIComponent(slug)}`} aria-label={`Lihat artefak: ${artifact.title_id}`} className="block overflow-hidden">
                      <img src={artifact.image_url || PROTOTYPE_ARTIFACTS[0].image_url} alt={artifact.image_alt || `Ilustrasi ${artifact.title_id}`} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                    </Link>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <span className="inline-flex w-fit rounded bg-primary/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">{artifact.era}</span>
                      <h2 className="mt-4 font-serif text-xl font-bold leading-snug">{artifact.title_id}</h2>
                      <p className="mt-1 text-sm font-medium text-burgundy/80">{artifact.title_en}</p>
                      <p className="mt-4 line-clamp-3 leading-7">{artifact.description_id || artifact.description_en}</p>
                      <Link to={`/artifact/${encodeURIComponent(slug)}`} className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-burgundy px-5 py-2 font-semibold text-cream transition hover:bg-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy">
                        Lihat detail artefak <ArrowUpRight aria-hidden="true" size={17} />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        ) : !loading && !notice ? (
          <p role="status" className="mt-8 rounded-2xl border border-dashed border-burgundy/30 p-8 text-center">Belum ada temuan dalam katalog digital Sangiran.</p>
        ) : null}
      </section>
    </main>
  )
}
