import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSRunningOrder } from '@mos-connection/model'
import { XMLRunningOrderBase } from './xmlConversion'

export class ROListAll extends MosMessage {
	public ROs: IMOSRunningOrder[] = []

	/** */
	constructor(strict: boolean) {
		super('upper', strict)
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roListAll')

		this.ROs.forEach((RO: IMOSRunningOrder) => {
			const xmlRO = XMLBuilder.create('ro')

			XMLRunningOrderBase.toXML(xmlRO, RO, this.strict)

			root.importDocument(xmlRO)
		})

		return root
	}
}
