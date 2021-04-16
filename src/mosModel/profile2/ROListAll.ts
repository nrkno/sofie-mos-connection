import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import {
	IMOSRunningOrder
} from '../../api'
import { addTextElement } from '../../utils/Utils'

export class ROListAll extends MosMessage {

	ROs: IMOSRunningOrder[]

  /** */
	constructor () {
		super('upper')
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roListAll')

		this.ROs.forEach((RO: IMOSRunningOrder) => {
			let xmlRO = XMLBuilder.create('ro')

			addTextElement(root, 'roID', RO.ID)
			addTextElement(root, 'roSlug', RO.Slug)

			root.importDocument(xmlRO)
		})

		return root
	}
}
