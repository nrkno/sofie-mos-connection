import * as XMLBuilder from 'xmlbuilder'
import { IMOSRunningOrderBase } from '../../api'
import { MosMessage } from '../MosMessage'
import { XMLRunningOrderBase } from './xmlConversion'

export class ROMetadataReplace extends MosMessage {
	constructor(private metadata: IMOSRunningOrderBase) {
		super('upper')
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roMetadataReplace')

		XMLRunningOrderBase.toXML(root, this.metadata)

		return root
	}
}
