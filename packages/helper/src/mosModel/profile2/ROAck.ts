import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSROAck, IMOSROAckStory, IMOSString128 } from '@mos-connection/model'
import { addTextElement } from '../../utils/Utils'

export class ROAck extends MosMessage implements IMOSROAck {
	ID: IMOSString128
	Status: IMOSString128
	Stories: Array<IMOSROAckStory>

	/** */
	constructor(roAck: IMOSROAck) {
		super('upper')

		this.ID = roAck.ID
		this.Status = roAck.Status
		this.Stories = roAck.Stories
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roAck')

		addTextElement(root, 'roID', this.ID)
		addTextElement(root, 'roStatus', this.Status)

		// TODO: Loop over Stories, Items and Object

		return root
	}
}
