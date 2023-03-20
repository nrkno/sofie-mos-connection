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

		// Loop over Stories, Items and Object
		for (let storyIndex = 0; storyIndex < this.Stories.length; storyIndex++) {
			const storyData = this.Stories[storyIndex]
			const storyItems = storyData.Items
			for (let itemIndex = 0; itemIndex < storyItems.length; itemIndex++) {
				const itemData = storyItems[itemIndex]
				addTextElementInternal(root, 'storyID', storyData.ID, undefined, this.strict)
				addTextElementInternal(root, 'itemID', itemData.ID, undefined, this.strict)
				addTextElementInternal(root, 'objID', itemData.Objects[0].ID, undefined, this.strict)
				if (itemData.Channel._mosString128 !== 'undefined') {
					addTextElementInternal(root, 'itemChannel', itemData.Channel, undefined, this.strict)
				}
				addTextElementInternal(root, 'status', itemData.Objects[0].Status, undefined, this.strict)
			}
		}
		return root
	}
}
