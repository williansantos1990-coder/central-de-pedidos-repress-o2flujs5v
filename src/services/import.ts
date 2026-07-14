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

  const baseUrl = import.meta.env.VITE_POCKETBASE_URL
  const response = await fetch(`${baseUrl}/backend/v1/import`, {
    method: 'POST',
    headers: {
      Authorization: pb.authStore.token || '',
    },
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    let message = 'Erro ao processar importação'
    if (typeof data === 'string' && data.length > 0) {
      message = data
    } else if (data?.message) {
      message = data.message
    } else if (data?.data?.message) {
      message = data.data.message
    }
    throw new Error(message)
  }

  return data as ImportAllResult
}
