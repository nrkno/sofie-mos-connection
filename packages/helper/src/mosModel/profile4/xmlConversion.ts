import { IMOSROFullStoryBodyItem, IMOSROFullStory, getMosTypes } from '@mos-connection/model'
import { XMLROStory, XMLMosItem } from '../profile2/xmlConversion'
import { AnyXML } from '../lib'

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLROFullStory {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSROFullStory {
		if (typeof xml !== 'object') throw new Error('XML is not an object')
		const mosTypes = getMosTypes(strict)

		const story0 = XMLROStory.fromXML(xml, strict)
		const story: IMOSROFullStory = {
			ID: story0.ID,
			Slug: story0.Slug,
			Number: story0.Number,
			MosExternalMetaData: story0.MosExternalMetaData,
			RunningOrderId: mosTypes.mosString128.create(xml.roID),
			Body: fromXMLStoryBody(xml.storyBody, strict),
		}

		return story
	}
}
function fromXMLStoryBody(xml: any, strict: boolean): IMOSROFullStoryBodyItem[] {
	const body: IMOSROFullStoryBodyItem[] = []

	/*
	// Not able to implement this currently, need to change {arrayNotation: true} in xml2json option
	let elementKeys = Object.keys(xml)
	elementKeys.forEach((key: string) => {
		// let elements
		let d = xml[key]

		if (!Array.isArray(d)) d = [d]

		d.forEach((el: any) => {
			let bodyItem: IMOSROFullStoryBodyItem = {
				Type: key,
				Content: el
			}
			body.push(bodyItem)
		})
	})
	*/
	if (xml.elements && Array.isArray(xml.elements)) {
		for (const item of xml.elements) {
			const bodyItem: IMOSROFullStoryBodyItem = {
				Type: item.$name || item.$type,
				Content: item,
			}
			if (item.$name === 'storyItem') {
				bodyItem.Content = XMLMosItem.fromXML(item, strict)
			}
			body.push(bodyItem)
		}
	}
	// Temporary implementation:
	if (xml.storyItem) {
		let items: Array<any> = xml.storyItem
		if (!Array.isArray(items)) items = [items]
		items.forEach((item) => {
			const bodyItem: IMOSROFullStoryBodyItem = {
				Type: 'storyItem',
				Content: item,
			}
			body.push(bodyItem)
		})
	}
	return body
}
