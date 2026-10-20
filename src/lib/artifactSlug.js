export function slugifyArtifactTitle(title) {
  return (title ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getArtifactSlug(artifact) {
  const storedSlug = artifact.slug?.trim()
  if (storedSlug && storedSlug.toLowerCase() !== 'null' && storedSlug.toLowerCase() !== 'undefined') {
    return storedSlug
  }

  return slugifyArtifactTitle(artifact.title_id) || artifact.id
}
