import pb from '@/lib/pocketbase/client'

export interface ImportCollectionResult {
  collection: string
  label: string
  deleted: number
  inserted: number
  errors: number
  message: string
}

export interface ImportAllResult {
  success: boolean
  results: ImportCollectionResult[]
  message: string
}

export async function importAllData(files: {
  pedve012?: File | null
  pedve005?: File | null
  transportadoras?: File | null
}): Promise<ImportAllResult> {
  const formData = new FormData()
  if (files.pedve012) formData.append('pedve012', files.pedve012)
  if (files.pedve005) formData.append('pedve005', files.pedve005)
  if (files.transportadoras) formData.append('transportadoras', files.transportadoras)
  return pb.send('/backend/v1/import', {
    method: 'POST',
    body: formData,
  })
}
