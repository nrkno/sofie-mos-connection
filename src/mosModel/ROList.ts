import * as XMLBuilder from 'xmlbuilder'
import { MosString128 } from './../dataTypes/mosString128'
import { MosMessage } from './MosMessage'
import {
	IMOSAck,
	IMOSROAckStory,
	IMOSRunningOrder,
	IMOSStory,
	IMOSROStory,
	IMOSItem,
	IMOSObjectPath,
	IMOSObjectPathType
} from '../api'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData';
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
