import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { MosString128 } from '../../dataTypes/mosString128'
import { IMOSObjectStatus } from '../../api'
import { MosTime } from '../../dataTypes/mosTime'

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
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('roElementStat')
		root.attribute('element', this.options.type.toString())

		root.ele('roID', {}, this.options.roId.toString())
		if (this.options.storyId) 		root.ele('storyID', {}, this.options.storyId.toString())
		if (this.options.itemId) 		root.ele('itemID', {}, this.options.itemId.toString())
		if (this.options.objId) 		root.ele('objID', {}, this.options.objId.toString())
		if (this.options.itemChannel) 	root.ele('itemChannel', {}, this.options.itemChannel.toString())
		root.ele('status', {}, this.options.status.toString())
		root.ele('time', {}, this.time.toString())
		return root
	}
}
