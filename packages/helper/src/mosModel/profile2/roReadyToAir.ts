import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSString128 } from '@mos-connection/model'
import { addTextElement } from '../../utils/Utils'

// http://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS-Protocol-2.8.4-Current.htm#roReadyToAir

export interface ROReadyToAirOptions {
	roId: IMOSString128
	roAir: 'READY' | 'NOT READY'
}
export class ROReadyToAir extends MosMessage {
	private options: ROReadyToAirOptions

	constructor(options: ROReadyToAirOptions) {
		super('upper')
		this.options = options
	}

	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roReadyToAir')
		addTextElement(root, 'roID', this.options.roId)
		addTextElement(root, 'roAir', this.options.roAir)
		return root
	}
}
