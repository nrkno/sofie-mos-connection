import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSRunningOrder } from '../../api'
import { addTextElement } from '../../utils/Utils'

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

			addTextElement(root, 'roID', RO.ID)
			addTextElement(root, 'roSlug', RO.Slug)

			root.importDocument(xmlRO)
		})

		return root
	}
}
