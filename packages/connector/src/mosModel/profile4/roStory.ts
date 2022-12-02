import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSROFullStory, IMOSItem } from '@mos-connection/model'
import { addTextElement } from '../../utils/Utils'
import { XMLROStoryBase, XMLObjectPaths, XMLMosExternalMetaData } from '../profile2/xmlConversion'
import { XMLMosObjects } from '../profile1/xmlConversion'

export class ROStory extends MosMessage {
	/** */
	constructor(private fullStory: IMOSROFullStory) {
		super('upper')
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const xmlStory = XMLBuilder.create('roStorySend')

		XMLROStoryBase.toXML(xmlStory, this.fullStory)
		addTextElement(xmlStory, 'roID', this.fullStory.RunningOrderId)

		const xmlStoryBody = addTextElement(xmlStory, 'storyBody')
		this.fullStory.Body.forEach((bodyItem) => {
			if (bodyItem.Type === 'storyItem') {
				const xmlItem = addTextElement(xmlStoryBody, 'storyItem')
				const item: IMOSItem = bodyItem.Content as IMOSItem

				addTextElement(xmlItem, 'itemID', item.ID)
				addTextElement(xmlItem, 'objID', item.ObjectID)
				addTextElement(xmlItem, 'mosID', item.MOSID)
				// TODO: mosAbstract?: string?
				// TODO: Channel?: MosString128?
				// TODO: MacroIn?: MosString128?
				// TODO: MacroOut?: MosString128?

				XMLObjectPaths.toXML(xmlItem, item.Paths)
				XMLMosExternalMetaData.toXML(xmlItem, item.MosExternalMetaData)

				if (item.Slug) addTextElement(xmlItem, 'itemSlug', item.Slug)
				if (item.EditorialStart) addTextElement(xmlItem, 'itemEdStart', item.EditorialStart)
				if (item.EditorialDuration) addTextElement(xmlItem, 'itemEdDur', item.EditorialDuration)
				if (item.UserTimingDuration) addTextElement(xmlItem, 'itemUserTimingDur', item.UserTimingDuration)
				if (item.Trigger) addTextElement(xmlItem, 'itemTrigger', item.Trigger)
				if (item.mosAbstract) addTextElement(xmlItem, 'mosAbstract', item.mosAbstract)
				if (item.ObjectSlug) addTextElement(xmlItem, 'objSlug', item.ObjectSlug)
				if (item.Channel) addTextElement(xmlItem, 'itemChannel', item.Channel)
				if (item.Duration) addTextElement(xmlItem, 'objDur', item.Duration)
				if (item.TimeBase) addTextElement(xmlItem, 'objTB', item.TimeBase)

				if (item.MacroIn) addTextElement(xmlItem, 'macroIn', item.MacroIn)
				if (item.MacroOut) addTextElement(xmlItem, 'macroOut', item.MacroOut)

				// Note: the <mosObj> is sent in roStorySend
				XMLMosObjects.toXML(xmlItem, item.MosObjects)
			} else {
				addTextElement(xmlStoryBody, bodyItem.Type, bodyItem.Content)
			}
		})

		return xmlStory
	}
}
