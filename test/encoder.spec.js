/* global describe, it, beforeAll, beforeEach */
import assert from 'assert'
import EbmlStreamEncoder from '../src/EbmlStreamEncoder.js'
import 'jasmine'
import EbmlTagId from '../src/models/enums/EbmlTagId.js'
import EbmlTagPosition from '../src/models/enums/EbmlTagPosition.js'
import EbmlTagFactory from '../src/models/EbmlTagFactory.js'

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
    function createEncoder (expected, done, data) {
      const encoder = new EbmlStreamEncoder()
      for (const item of data) {
        const chunk = encoder.processTag(item)
        if (chunk) {
          assert.strictEqual(
            chunk.toString('hex'),
            Buffer.from(expected).toString('hex')
          )
          done()
        }
      }
    }

    it('should write a single tag', done => {
      createEncoder([0x42, 0x86, 0x81, 0x01], done, [ebmlVersion1Tag])
    })
    it('should write a tag with a single child', done => {
      createEncoder(
        [0x1a, 0x45, 0xdf, 0xa3, 0x84, 0x42, 0x86, 0x81, 0x00],
        done,
        [ebmlStartTag, ebmlVersion0Tag, ebmlEndTag]
      )
    })
    describe('#writeTag', () => {
      let encoder
      beforeAll(() => {
        encoder = new EbmlStreamEncoder()
      })
      it('does nothing with incomplete tag data', () => {
        encoder.processTag(incompleteTag)
        assert.strictEqual(encoder.openTags.length, 0)
      })
      it('throws with an invalid tag id', () => {
        assert.throws(
          () => {
            encoder.processTag(invalidTag)
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
            encoder.processTag(invalidTag)
          },
          /No id found/,
          'Not throwing properly'
        )
      })
    })
    describe('#_transform', () => {
      it('should do nothing on an incomplete tag', () => {
        const encoder = new EbmlStreamEncoder()
        encoder.processTag(incompleteTag)
        assert.ok(encoder.dataBuffer == null || encoder.dataBuffer.length === 0)
      })
    })
    describe('#constructBuffer', () => {
      let encoder
      beforeEach(() => {
        encoder = new EbmlStreamEncoder()
      })
      it('should create a new buffer (but still be empty after eval) with an empty buffer', () => {
        assert.ok(encoder.dataBuffer == null || encoder.dataBuffer.length === 0)
        encoder.constructBuffer(Buffer.from([0x42, 0x86, 0x81, 0x01]))
        assert.ok(encoder.dataBuffer == null || encoder.dataBuffer.length === 0)
      })
      it('should append to the buffer (and empty after eval) with an existing buffer', () => {
        encoder.buffer = Buffer.from([0x42, 0x86, 0x81, 0x01])
        assert.ok(encoder.dataBuffer instanceof Buffer)
        encoder.constructBuffer(Buffer.from([0x42, 0x86, 0x81, 0x01]))
        assert.ok(encoder.dataBuffer == null || encoder.dataBuffer.length === 0)
      })
    })
  })
})
