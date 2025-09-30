// utils/storage.ts
// Temporary stub so UI can run without backend.
// Always returns fake URLs based on the path.

export async function getSignedUrls(paths: string[], _ttl = 3600) {
  return paths.map((p) => ({
    path: p,
    url: `/placeholder/${encodeURIComponent(p)}`,
  }))
}
