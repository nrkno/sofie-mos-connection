import * as XMLBuilder from 'xmlbuilder'
import { MosString128 } from '../../dataTypes/mosString128'
import { MosMessage } from '../MosMessage'
import { IMOSAck, IMOSAckStatus } from '../../api'
import { addTextElement } from '../../utils/Utils'

export class MOSAck extends MosMessage implements IMOSAck {
	ID: MosString128
	Revision: number // max 999
	Status: IMOSAckStatus
	Description: MosString128

	/** */
	constructor(ack: IMOSAck) {
		super('lower')

		this.ID = ack.ID
		this.Status = ack.Status
		this.Description = ack.Description
		this.Revision = ack.Revision
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('mosAck')

		addTextElement(root, 'objID', this.ID)
		addTextElement(root, 'objRev', this.Revision)
		addTextElement(root, 'status', (IMOSAckStatus as any)[this.Status])
		addTextElement(root, 'statusDescription', this.Description)

		return root
	}
}
