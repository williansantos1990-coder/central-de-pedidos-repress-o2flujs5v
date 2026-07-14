async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data)
      controller.close()
    },
  })
  const decompressed = stream.pipeThrough(new DecompressionStream('deflate-raw'))
  const reader = decompressed.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    result.set(c, offset)
    offset += c.length
  }
  return result
}

function readUint16(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8)
}

function readUint32(data: Uint8Array, offset: number): number {
  return (
    (data[offset] |
      (data[offset + 1] << 8) |
      (data[offset + 2] << 16) |
      (data[offset + 3] << 24)) >>>
    0
  )
}

export async function extractZipEntries(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {}
  let eocd = -1
  for (let i = data.length - 22; i >= 0; i--) {
    if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
      eocd = i
      break
    }
  }
  if (eocd === -1) return files

  const cdOffset = readUint32(data, eocd + 16)
  const cdEntries = readUint16(data, eocd + 10)
  let pos = cdOffset

  for (let i = 0; i < cdEntries; i++) {
    if (
      data[pos] !== 0x50 ||
      data[pos + 1] !== 0x4b ||
      data[pos + 2] !== 0x01 ||
      data[pos + 3] !== 0x02
    )
      break
    const compMethod = readUint16(data, pos + 10)
    const compSize = readUint32(data, pos + 20)
    const nameLen = readUint16(data, pos + 28)
    const extraLen = readUint16(data, pos + 30)
    const commentLen = readUint16(data, pos + 32)
    const localOffset = readUint32(data, pos + 42)

    let name = ''
    for (let j = 0; j < nameLen; j++) name += String.fromCharCode(data[pos + 46 + j])

    const localNameLen = readUint16(data, localOffset + 26)
    const localExtraLen = readUint16(data, localOffset + 28)
    const dataOffset = localOffset + 30 + localNameLen + localExtraLen
    const compData = data.slice(dataOffset, dataOffset + compSize)

    if (compMethod === 0) {
      files[name] = compData
    } else if (compMethod === 8) {
      files[name] = await inflate(compData)
    }
    pos += 46 + nameLen + extraLen + commentLen
  }
  return files
}
