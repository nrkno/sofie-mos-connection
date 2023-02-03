import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSROAck, IMOSROAckStory, IMOSString128 } from '@mos-connection/model'
import { addTextElementInternal } from '../../utils/Utils'

export class ROAck extends MosMessage implements IMOSROAck {
	ID: IMOSString128
	Status: IMOSString128
	Stories: Array<IMOSROAckStory>

	/** */
	constructor(roAck: IMOSROAck, strict: boolean) {
		super('upper', strict)

		this.ID = roAck.ID
		this.Status = roAck.Status
		this.Stories = roAck.Stories
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roAck')

		addTextElementInternal(root, 'roID', this.ID, undefined, this.strict)
		addTextElementInternal(root, 'roStatus', this.Status, undefined, this.strict)

		// TODO: Loop over Stories, Items and Object

		return root
	}
}
