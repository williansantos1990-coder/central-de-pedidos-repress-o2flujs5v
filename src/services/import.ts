import pb from '@/lib/pocketbase/client'

export interface ImportResult {
  success: boolean
  collection: string
  deleted: number
  inserted: number
  message: string
}

export const importExcelData = async (collection: string, file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/import/${collection}`,
    {
      method: 'POST',
      headers: {
        Authorization: pb.authStore.token,
      },
      body: formData,
    },
  )

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Erro na importação')
  }
  return data as ImportResult
}
