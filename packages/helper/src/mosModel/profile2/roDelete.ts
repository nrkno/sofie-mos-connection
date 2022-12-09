import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSString128 } from '@mos-connection/model'
import { addTextElement } from '../../utils/Utils'

export class RODelete extends MosMessage {
	constructor(private roId: IMOSString128) {
		super('upper')
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roDelete')
		addTextElement(root, 'roID', this.roId)
		return root
	}
}
