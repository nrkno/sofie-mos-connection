import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSString128 } from '@mos-connection/model'
import { addTextElementInternal } from '../../utils/Utils'

export class RODelete extends MosMessage {
	constructor(private roId: IMOSString128, strict: boolean) {
		super('upper', strict)
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roDelete')
		addTextElementInternal(root, 'roID', this.roId, undefined, this.strict)
		return root
	}
}
