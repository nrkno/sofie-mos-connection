import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { MosString128 } from '../../dataTypes/mosString128'
import { addTextElement } from '../../utils/Utils'

export class ROReq extends MosMessage {

	private roId: MosString128
  /** */
	constructor (roId: MosString128) {
		super()
		this.port = 'upper'
		this.roId = roId
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roReq')
		addTextElement(root, 'roID', this.roId)
		return root
	}
}
