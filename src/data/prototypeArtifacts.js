import scrollImage from '../assets/prototype-scroll.svg'
import maskImage from '../assets/prototype-mask.svg'
import tabletImage from '../assets/prototype-tablet.svg'

export const PROTOTYPE_ARTIFACTS = [
  {
    id: 'senja-kingdom-sealing-scroll',
    slug: 'senja-kingdom-sealing-scroll',
    title_id: 'Gulungan Segel Kerajaan Senja',
    title_en: 'Dusk Kingdom Sealing Scroll',
    era: 'Era Kerajaan Awal',
    description_id: 'Gulungan serat kulit kayu ini memuat pola segel kerajaan yang digunakan untuk menjaga catatan dan benda pusaka. Pigmen mineralnya masih tampak pada lipatan kertas yang telah menua.',
    description_en: 'This bark-fiber scroll bears a royal seal pattern once used to safeguard records and heirlooms. Mineral pigments remain visible among its timeworn folds.',
    material: 'Serat kulit kayu dan pigmen mineral',
    location: 'Lembah Senja',
    image_url: scrollImage,
    image_alt: 'Ilustrasi gulungan tua dengan pita dan cap merah',
  },
  {
    id: 'gate-guardian-ceremonial-mask',
    slug: 'gate-guardian-ceremonial-mask',
    title_id: 'Topeng Upacara Penjaga Gerbang',
    title_en: 'Gate Guardian Ceremonial Mask',
    era: 'Masa Kota Bertembok',
    description_id: 'Topeng kayu ringan ini dikenakan oleh penjaga gerbang dalam upacara pergantian musim. Ukiran geometris di bagian pipi melambangkan kewaspadaan dan tanggung jawab kepada masyarakat.',
    description_en: 'This lightweight wooden mask was worn by gate guardians during seasonal ceremonies. Geometric carvings on the cheeks represent vigilance and civic responsibility.',
    material: 'Kayu dan pernis alami',
    location: 'Kota Bertembok',
    image_url: maskImage,
    image_alt: 'Ilustrasi topeng kayu upacara dengan pola geometris',
  },
  {
    id: 'star-map-stone-tablet-fragment',
    slug: 'star-map-stone-tablet-fragment',
    title_id: 'Fragmen Tablet Peta Bintang',
    title_en: 'Star Map Tablet Fragment',
    era: 'Periode Purbakala',
    description_id: 'Fragmen batu vulkanik ini memperlihatkan jalur bintang dan penanda musim yang dipahat dengan tangan. Para peneliti menggunakannya untuk memahami cara masyarakat kuno mengamati langit.',
    description_en: 'This volcanic stone fragment reveals hand-carved star paths and seasonal markers. Researchers study it to understand how ancient communities observed the night sky.',
    material: 'Batu vulkanik',
    location: 'Dataran Tinggi Utara',
    image_url: tabletImage,
    image_alt: 'Ilustrasi fragmen tablet batu dengan ukiran bintang',
  },
]
