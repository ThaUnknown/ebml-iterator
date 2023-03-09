/* global describe, it, beforeAll, beforeEach */
import assert from 'assert'
import { EbmlStreamEncoder } from '../src/EbmlStreamEncoder'
import 'jasmine'
import { EbmlTagId } from '../src/models/enums/EbmlTagId'
import { EbmlTagPosition } from '../src/models/enums/EbmlTagPosition'
import { EbmlTagFactory } from '../src/models/EbmlTagFactory'

const invalidTag = {
  id: undefined,
  type: '404NotFound',
  position: undefined,
  size: -1,
  data: null
}

const incompleteTag = undefined

const ebmlStartTag = Object.assign(EbmlTagFactory.create(EbmlTagId.EBML), {
  size: 10,
  position: EbmlTagPosition.Start
})

const ebmlEndTag = Object.assign(EbmlTagFactory.create(EbmlTagId.EBML), {
  size: 10,
  position: EbmlTagPosition.End
})

const ebmlVersion1Tag = Object.assign(EbmlTagFactory.create(EbmlTagId.EBMLVersion), {
  position: EbmlTagPosition.Content,
  data: 1
})

const ebmlVersion0Tag = Object.assign(EbmlTagFactory.create(EbmlTagId.EBMLVersion), {
  position: EbmlTagPosition.Content,
  data: 0
})

describe('EBML', () => {
  describe('Encoder', () => {
    function createEncoder (expected, done) {
      const encoder = new EbmlStreamEncoder()
      encoder.on('data', chunk => {
        assert.strictEqual(
          chunk.toString('hex'),
          Buffer.from(expected).toString('hex')
        )
        encoder.on('finish', done)
        done()
      })
      encoder.on('finish', done)
      return encoder
    }

    it('should write a single tag', done => {
      const encoder = createEncoder([0x42, 0x86, 0x81, 0x01], done)
      encoder.write(ebmlVersion1Tag)
      encoder.end()
    })
    it('should write a tag with a single child', done => {
      const encoder = createEncoder(
        [0x1a, 0x45, 0xdf, 0xa3, 0x84, 0x42, 0x86, 0x81, 0x00],
        done
      )
      encoder.write(ebmlStartTag)
      encoder.write(ebmlVersion0Tag)
      encoder.write(ebmlEndTag)
      encoder.end()
    })
    describe('#writeTag', () => {
      let encoder
      beforeAll(() => {
        encoder = new EbmlStreamEncoder()
      })
      it('does nothing with incomplete tag data', () => {
        encoder.write(incompleteTag)
        assert.strictEqual(encoder.stack.length, 0)
      })
      it('throws with an invalid tag id', () => {
        assert.throws(
          () => {
            encoder.write(invalidTag)
          },
          /No id found/,
          'Not throwing properly'
        )
      })
    })
    describe('#startTag', () => {
      let encoder
      beforeAll(() => {
        encoder = new EbmlStreamEncoder()
      })
      it('throws with an invalid tag id', () => {
        assert.throws(
          () => {
            encoder.write(invalidTag)
          },
          /No id found/,
          'Not throwing properly'
        )
      })
    })
    describe('#_transform', () => {
      it('should do nothing on an incomplete tag', () => {
        const encoder = new EbmlStreamEncoder()
        encoder.write(incompleteTag)
        assert.ok(encoder.buffer == null || encoder.buffer.length === 0)
      })
    })
    describe('#_bufferAndFlush', () => {
      let encoder
      beforeEach(() => {
        encoder = new EbmlStreamEncoder()
      })
      it('should create a new buffer (but still be empty after eval) with an empty buffer', () => {
        assert.ok(encoder.buffer == null || encoder.buffer.length === 0)
        encoder._bufferAndFlush(Buffer.from([0x42, 0x86, 0x81, 0x01]))
        assert.ok(encoder.buffer == null || encoder.buffer.length === 0)
      })
      it('should append to the buffer (and empty after eval) with an existing buffer', () => {
        encoder.buffer = Buffer.from([0x42, 0x86, 0x81, 0x01])
        assert.ok(encoder.buffer instanceof Buffer)
        encoder._bufferAndFlush(Buffer.from([0x42, 0x86, 0x81, 0x01]))
        assert.ok(encoder.buffer == null || encoder.buffer.length === 0)
      })
    })
  })
})
