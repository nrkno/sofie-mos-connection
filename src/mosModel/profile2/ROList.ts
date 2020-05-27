import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import {
	IMOSRunningOrder,
	IMOSROStory
} from '../../api'
import { Parser } from '../Parser'
import { addTextElement } from '../../utils/Utils'

export class ROList extends MosMessage {

	// ID: MosString128
	RO: IMOSRunningOrder

  /** */
	constructor () {
		super()
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roList')

		addTextElement(root, 'roID', this.RO.ID)
		addTextElement(root, 'roSlug', this.RO.Slug)

		this.RO.Stories.forEach((story: IMOSROStory) => {
			let xmlStory = Parser.story2xml(story)
			root.importDocument(xmlStory)
		})

		return root
	}
}
