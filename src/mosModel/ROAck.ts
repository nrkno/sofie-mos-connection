import * as XMLBuilder from 'xmlbuilder'
import {MosString128} from './../dataTypes/mosString128'
import {MosMessage} from './MosMessage'
import {
	IMOSROAck,
	IMOSROAckStory/*,
	IMOSROAckItem,
	IMOSROAckObject*/
} from '../api'

export class ROAck extends MosMessage implements IMOSROAck {

	ID: MosString128
	Status: MosString128
	Stories: Array<IMOSROAckStory>

  /** */
	constructor (ID: MosString128, Status: string) {
		super()
		this.ID = ID
		this.Status = new MosString128(Status)
	}

  /** */
	get messageXMLBlocks(): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('roAck')

		root.ele('roID', {}, this.ID.toString())
		root.ele('roStatus', {}, this.Status.toString())

		// TODO: Loop over Stories, Items and Object

		return root
	}
}
