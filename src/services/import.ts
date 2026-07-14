import pb from '@/lib/pocketbase/client'

export interface ImportResult {
  success: boolean
  collection: string
  deleted: number
  inserted: number
  message: string
}

export const importExcelData = async (
  collection: string,
  base64File: string,
): Promise<ImportResult> => {
  return pb.send(`/backend/v1/import/${collection}`, {
    method: 'POST',
    body: JSON.stringify({ file: base64File }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
