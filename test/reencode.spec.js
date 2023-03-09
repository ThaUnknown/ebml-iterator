import { createReadStream } from 'fs'
import { EbmlIteratorDecoder, EbmlIteratorEncoder } from '../src/index.js'
import { createHash } from 'crypto'
import { EbmlStreamDecoder, EbmlStreamEncoder, EbmlTagId } from 'ebml-stream'
import { pipeline as _p, Readable } from 'stream'
import { promisify } from 'util'

const pipeline = promisify(_p)

const files = ['video1.webm', 'video2.webm', 'video3.webm', 'video4.webm', 'test5.mkv']

async function * encode (stream) {
  yield * new EbmlIteratorEncoder({ stream })
}
async function * decode (stream) {
  yield * new EbmlIteratorDecoder({ stream })
}

for (const file of files) {
  console.log(file)
  const hasher1 = createHash('sha1').setEncoding('hex')
  const stream1 = createReadStream('media/' + file)
  await pipeline(stream1, hasher1)

  const hash1 = hasher1.read()
  console.log(hash1)

  const hasher2 = createHash('sha1').setEncoding('hex')
  const stream2 = Readable.from(encode(decode(createReadStream('media/' + file))))
  await pipeline(stream2, hasher2)

  const hash2 = hasher2.read()
  console.log(hash2)

  const ebmlDecoder = new EbmlStreamDecoder({
    bufferTagIds: [
      EbmlTagId.TrackEntry
    ]
  })
  const ebmlEncoder = new EbmlStreamEncoder()

  const hasher3 = createHash('sha1').setEncoding('hex')
  await pipeline(createReadStream('media/' + file), ebmlDecoder, ebmlEncoder, hasher3)

  const hash3 = hasher3.read()
  console.log(hash3)
}
