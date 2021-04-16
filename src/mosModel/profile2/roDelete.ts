import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { addTextElement } from '../../utils/Utils'
import { MosString128 } from '../../dataTypes/mosString128'

export class RODelete extends MosMessage {
	constructor (
		private roId: MosString128
	) {
		super('upper')
	}
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roDelete')
		addTextElement(root, 'roID', this.roId)
		return root
	}
}
