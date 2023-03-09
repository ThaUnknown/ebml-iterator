import EbmlTagPosition from './models/enums/EbmlTagPosition.js'
import EbmlTagId from './models/enums/EbmlTagId.js'

export default class EbmlStreamEncoder {
  constructor ({ stream } = {}) {
    this._stream = stream
    this.dataBuffer = Buffer.alloc(0)
    this.openTags = []
  }

  async * [Symbol.asyncIterator] (stream) {
    for await (const tag of stream) {
      const chunk = this.processTag(tag)
      if (chunk) yield chunk
    }
  }

  processTag (tag) {
    if (tag) {
      if (!tag.id) throw new Error(`No id found for ${JSON.stringify(tag)}`)
      switch (tag.position) {
        case EbmlTagPosition.Start:
          this.startTag(tag)
          break
        case EbmlTagPosition.Content:
          return this.writeTag(tag)
        case EbmlTagPosition.End:
          return this.endTag(tag)
        default:
          break
      }
    }
  }

  constructBuffer (buffer) {
    this.dataBuffer = Buffer.concat([this.dataBuffer, buffer])
    if (this.dataBuffer.length > 0) {
      const chunk = Buffer.from(this.dataBuffer)
      this.dataBuffer = Buffer.alloc(0)
      return chunk
    }
  }

  get buffer () {
    return this.dataBuffer
  }

  set buffer (val) {
    this.dataBuffer = val
  }

  writeTag (tag) {
    if (this.openTags.length > 0) {
      this.openTags[this.openTags.length - 1].Children.push(tag)
    } else {
      return this.constructBuffer(tag.encode())
    }
  }

  startTag (tag) {
    if (this.openTags.length > 0) {
      this.openTags[this.openTags.length - 1].Children.push(tag)
    }
    this.openTags.push(tag)
  }

  endTag (tag) {
    const inMemoryTag = this.openTags.pop()
    if (tag.id !== inMemoryTag.id) {
      throw new Error(`Logic error - closing tag "${EbmlTagId[tag.id]}" is not expected tag "${EbmlTagId[inMemoryTag.id]}"`)
    }
    if (this.openTags.length < 1) {
      return this.constructBuffer(inMemoryTag.encode())
    }
  }
}
