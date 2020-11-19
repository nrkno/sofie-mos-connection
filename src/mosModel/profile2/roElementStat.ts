import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { MosString128 } from '../../dataTypes/mosString128'
import { IMOSObjectStatus } from '../../api'
import { MosTime } from '../../dataTypes/mosTime'
import { addTextElement } from '../../utils/Utils'

export enum ROElementStatType {
	RO = 'RO',
	STORY = 'STORY',
	ITEM = 'ITEM'
}
export interface ROElementStatOptions {
	type: ROElementStatType
	roId: MosString128
	storyId?: MosString128
	itemId?: MosString128
	objId?: MosString128
	itemChannel?: MosString128
	status: IMOSObjectStatus
}
export interface ROElementStatOptionsStory extends ROElementStatOptions {
	type: ROElementStatType.STORY
	roId: MosString128
	storyId: MosString128
	status: IMOSObjectStatus
}
export interface ROElementStatOptionsItem extends ROElementStatOptions {
	type: ROElementStatType.ITEM
	roId: MosString128
	storyId: MosString128
	itemId: MosString128
	objId?: MosString128
	itemChannel?: MosString128
	status: IMOSObjectStatus
}
export interface ROElementStatOptionsRunningOrder extends ROElementStatOptions {
	type: ROElementStatType.ITEM
	roId: MosString128
	status: IMOSObjectStatus
}
export class ROElementStat extends MosMessage {
	private options: ROElementStatOptions
	private time: MosTime
  /** */
	constructor (options: ROElementStatOptions) {
		super()
		this.options = options
		this.time = new MosTime()
		this.port = 'upper'
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roElementStat')
		root.attribute('element', this.options.type.toString())

		addTextElement(root, 'roID', this.options.roId)
		if (this.options.storyId) 		addTextElement(root, 'storyID', this.options.storyId)
		if (this.options.itemId) 		addTextElement(root, 'itemID', this.options.itemId)
		if (this.options.objId) 		addTextElement(root, 'objID', this.options.objId)
		if (this.options.itemChannel) 	addTextElement(root, 'itemChannel', this.options.itemChannel)
		addTextElement(root, 'status', this.options.status)
		addTextElement(root, 'time', this.time)
		return root
	}
}
