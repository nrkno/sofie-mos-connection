import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from './MosMessage'
import {
	IMOSRunningOrder,
	IMOSROStory
} from '../api'
import { Parser } from './Parser'

export class ROList extends MosMessage {

	// ID: MosString128
	RO: IMOSRunningOrder

  /** */
	constructor () {
		super()
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('roList')

		root.ele('roID', {}, this.RO.ID)
		root.ele('roSlug', {}, this.RO.Slug)

		this.RO.Stories.forEach((story: IMOSROStory) => {
			let xmlStory = Parser.story2xml(story)
			root.importDocument(xmlStory)
		})

		return root
	}
}
