import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import {
	IMOSRunningOrder,
	IMOSROStory
} from '../../api'
import { addTextElement } from '../../utils/Utils'
import { XMLROStory } from './xmlConversion'

export class ROList extends MosMessage {

	// ID: MosString128
	RO: IMOSRunningOrder

  /** */
	constructor () {
		super('upper')
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roList')

		addTextElement(root, 'roID', this.RO.ID)
		addTextElement(root, 'roSlug', this.RO.Slug)

		this.RO.Stories.forEach((story: IMOSROStory) => {
			XMLROStory.toXML(root, story)
		})

		return root
	}
}
