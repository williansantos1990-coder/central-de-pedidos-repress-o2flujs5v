const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function pushU16(arr: number[], v: number) {
  arr.push(v & 0xff, (v >>> 8) & 0xff)
}

function pushU32(arr: number[], v: number) {
  arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff)
}

interface ZipFile {
  name: string
  data: Uint8Array
}

export function createZip(files: ZipFile[]): Uint8Array {
  const fileEntries: { nameBytes: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = []
  const bodyBytes: number[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name)
    const crc = crc32(file.data)
    const localHeader: number[] = []
    pushU32(localHeader, 0x04034b50)
    pushU16(localHeader, 20)
    pushU16(localHeader, 0)
    pushU16(localHeader, 0)
    pushU16(localHeader, 0)
    pushU16(localHeader, 0x0800)
    pushU32(localHeader, crc)
    pushU32(localHeader, file.data.length)
    pushU32(localHeader, file.data.length)
    pushU16(localHeader, nameBytes.length)
    pushU16(localHeader, 0)
    for (const b of nameBytes) localHeader.push(b)

    const headerBytes = new Uint8Array(localHeader)
    bodyBytes.push(...headerBytes)
    for (const b of file.data) bodyBytes.push(b)

    fileEntries.push({ nameBytes, data: file.data, crc, offset })
    offset += headerBytes.length + file.data.length
  }

  const cdBytes: number[] = []
  for (const entry of fileEntries) {
    pushU32(cdBytes, 0x02014b50)
    pushU16(cdBytes, 20)
    pushU16(cdBytes, 20)
    pushU16(cdBytes, 0)
    pushU16(cdBytes, 0)
    pushU16(cdBytes, 0)
    pushU16(cdBytes, 0x0800)
    pushU32(cdBytes, entry.crc)
    pushU32(cdBytes, entry.data.length)
    pushU32(cdBytes, entry.data.length)
    pushU16(cdBytes, entry.nameBytes.length)
    pushU16(cdBytes, 0)
    pushU16(cdBytes, 0)
    pushU16(cdBytes, 0)
    pushU16(cdBytes, 0)
    pushU32(cdBytes, 0)
    pushU32(cdBytes, entry.offset)
    for (const b of entry.nameBytes) cdBytes.push(b)
  }

  const cdOffset = offset

  for (const b of cdBytes) bodyBytes.push(b)

  const cdSize = cdBytes.length
  pushU32(bodyBytes, 0x06054b50)
  pushU16(bodyBytes, 0)
  pushU16(bodyBytes, 0)
  pushU16(bodyBytes, files.length)
  pushU16(bodyBytes, files.length)
  pushU32(bodyBytes, cdSize)
  pushU32(bodyBytes, cdOffset)
  pushU16(bodyBytes, 0)

  return new Uint8Array(bodyBytes)
}
