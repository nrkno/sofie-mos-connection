import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSRunningOrder } from '../../api'
import { XMLRunningOrderBase } from './xmlConversion'

export class ROListAll extends MosMessage {
	public ROs: IMOSRunningOrder[] = []

	/** */
	constructor() {
		super('upper')
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roListAll')

		this.ROs.forEach((RO: IMOSRunningOrder) => {
			const xmlRO = XMLBuilder.create('ro')

			XMLRunningOrderBase.toXML(xmlRO, RO)

			root.importDocument(xmlRO)
		})

		return root
	}
}
