import { hex2arr, concat } from 'uint8-util'

import Tools from '../tools.js'

export default class EbmlTag {
  constructor (id, type, position) {
    this.id = id
    this.type = type
    this.position = position
  }

  getTagDeclaration () {
    let tagHex = this.id.toString(16)
    if (tagHex.length % 2 !== 0) {
      tagHex = `0${tagHex}`
    }
    return hex2arr(tagHex)
  }

  encode () {
    let vintSize = null
    const content = this.encodeContent()
    if (this.size === -1) {
      vintSize = hex2arr('01ffffffffffffff')
    } else {
      vintSize = Tools.writeVint(content.length, this.sizeLength)
    }
    return concat([
      this.getTagDeclaration(),
      vintSize,
      content
    ])
  }
}
