import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSRunningOrder,
	IMOSROStory,
	IMOSItem,
	IMOSObjectPath,
	IMOSRunningOrderBase,
	IMOSObject,
	IMOSROFullStory,
	IMosRequestObjectList,
	IMOSAck
} from '../api'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import { MosString128 } from '../dataTypes/mosString128'
import {
	XMLRunningOrderBase,
	XMLRunningOrder,
	XMLROStories,
	XMLROStory,
	XMLMosItems,
	XMLMosItem,
	XMLObjectPaths,
	XMLMosExternalMetaData,
	XMLMosROAck
} from './profile2/xmlConversion'
import { XMLROFullStory } from './profile4/xmlConversion'
import { XMLMosIDs } from './profile0/xmlConversion'
import { XMLMosAck, XMLMosObjects, XMLMosObject, XMLMosRequestObjectList } from './profile1/xmlConversion'
import { ROAck } from './profile2/ROAck'

export namespace Parser {

	export function xml2ROBase (xml: any): IMOSRunningOrderBase {
		return XMLRunningOrderBase.fromXML(xml)
	}
	export function xml2RO (xml: any): IMOSRunningOrder {
		return XMLRunningOrder.fromXML(xml)
	}
	// export function ro2xml (ro: IMOSRunningOrder): XMLBuilder.XMLElement {
	// 	// too implement
	// 	return XMLBuilder.create('ro')
	// }
	export function xml2Stories (xml: Array<any>): Array<IMOSROStory> {
		return XMLROStories.fromXML(xml)
	}
	export function xml2FullStory (xml: any): IMOSROFullStory {
		return XMLROFullStory.fromXML(xml)
	}
	export function xml2Story (xml: any): IMOSROStory {
		return XMLROStory.fromXML(xml)
	}
	// export function story2xml (story: IMOSROStory): XMLBuilder.XMLElement {
	// 	return ROStory.toXML(story)
	// }
	export function xml2Items (xml: Array<any>): Array<IMOSItem> {
		return XMLMosItems.fromXML(xml)
	}
	export function xml2Item (xml: any): IMOSItem {
		return XMLMosItem.fromXML(xml)
	}
	export function xml2ObjPaths (xml: any): Array<IMOSObjectPath> {
		return XMLObjectPaths.fromXML(xml)
	}
	// export function objPaths2xml (paths: Array<IMOSObjectPath>): XMLBuilder.XMLElement {
	// 	return ObjectPaths.toXML(xmlItem, paths)
	// }
	// export function item2xml (item: IMOSItem): XMLBuilder.XMLElement {
	// 	MOSItem.toXML(xmlItem, item)
	// }
	export function xml2MetaData (xml: any): Array<IMOSExternalMetaData> {
		return XMLMosExternalMetaData.fromXML(xml)
	}
	export function metaData2xml (md: IMOSExternalMetaData): XMLBuilder.XMLElement {
		// let xmlMD = XMLBuilder.create('mosExternalMetadata')

		// if (md.MosScope) addTextElement(xmlMD, 'mosScope', {}, md.MosScope)
		// addTextElement(xmlMD, 'mosSchema', {}, md.MosSchema)

		// let payload = parser.toXml(md.MosPayload)  // TODO: implement this properly, convert to xml
		// let payload = js2xml({ mosExternalMetadata: md }, { compact: true })
		return XMLBuilder.create({ mosExternalMetadata: md })
		// addTextElement(xmlMD, 'mosPayload', {}, payload)
		// return xmlMD
	}
	export function xml2IDs (xml: any): Array<MosString128> {
		return XMLMosIDs.fromXML(xml)
	}
	export function xml2ROAck (xml: any): ROAck {
		return XMLMosROAck.fromXML(xml)
	}
	export function xml2Ack (xml: any): IMOSAck {
		return XMLMosAck.fromXML(xml)
	}
	export function xml2MosObjs (xml: any): Array<IMOSObject> {
		return XMLMosObjects.fromXML(xml)
	}
	export function xml2MosObj (xml: any): IMOSObject {
		return XMLMosObject.fromXML(xml)
	}
	// export function mosObj2xml (obj: IMOSObject): XMLBuilder.XMLElement {
	// 	let xml = XMLBuilder.create('mosObj')
	// 	MOSObject.toXML(xml, obj)
	// 	// Todo: metadata:
	// 	return xml
	// }
	export function xml2ReqObjList (xml: any): IMosRequestObjectList {
		return XMLMosRequestObjectList.fromXML(xml)
	}
}
