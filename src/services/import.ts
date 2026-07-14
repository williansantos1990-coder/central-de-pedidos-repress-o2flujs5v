import pb from '@/lib/pocketbase/client'

export interface ImportResult {
  success: boolean
  collection: string
  deleted: number
  inserted: number
  message: string
}

export async function importData(collection: string, file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return pb.send(`/backend/v1/import/${collection}`, {
    method: 'POST',
    body: formData,
  })
}
