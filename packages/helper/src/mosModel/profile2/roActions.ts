import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import {
	IMOSStoryAction,
	IMOSROStory,
	IMOSItemAction,
	IMOSItem,
	IMOSROAction,
	IMOSString128,
} from '@mos-connection/model'
import { XMLROStory, XMLMosItem } from './xmlConversion'
import { addTextElement } from '../../utils/Utils'

export abstract class MosSendMessage extends MosMessage {
	constructor() {
		super('upper')
	}
}
export class ROInsertStories extends MosSendMessage {
	constructor(private Action: IMOSStoryAction, private Stories: Array<IMOSROStory>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'INSERT')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Stories.forEach((story) => {
			XMLROStory.toXML(xmlSource, story)
		})
		return root
	}
}
export class ROInsertItems extends MosSendMessage {
	constructor(private Action: IMOSItemAction, private Items: Array<IMOSItem>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'INSERT')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		addTextElement(xmlTarget, 'itemID', this.Action.ItemID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Items.forEach((item) => {
			XMLMosItem.toXML(xmlSource, item)
		})
		return root
	}
}
export class ROReplaceStories extends MosSendMessage {
	constructor(private Action: IMOSStoryAction, private Stories: Array<IMOSROStory>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'REPLACE')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Stories.forEach((story) => {
			XMLROStory.toXML(xmlSource, story)
		})
		return root
	}
}
export class ROReplaceItems extends MosSendMessage {
	constructor(private Action: IMOSItemAction, private Items: Array<IMOSItem>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'REPLACE')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		addTextElement(xmlTarget, 'itemID', this.Action.ItemID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Items.forEach((item) => {
			XMLMosItem.toXML(xmlSource, item)
		})
		return root
	}
}
export class ROMoveStories extends MosSendMessage {
	constructor(private Action: IMOSStoryAction, private Stories: Array<IMOSString128>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'MOVE')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Stories.forEach((storyID) => {
			addTextElement(xmlSource, 'storyID', storyID)
		})
		return root
	}
}
export class ROMoveItems extends MosSendMessage {
	constructor(private Action: IMOSItemAction, private Items: Array<IMOSString128>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'MOVE')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		addTextElement(xmlTarget, 'itemID', this.Action.ItemID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Items.forEach((itemID) => {
			addTextElement(xmlSource, 'itemID', itemID)
		})
		return root
	}
}
export class RODeleteStories extends MosSendMessage {
	constructor(private Action: IMOSROAction, private Stories: Array<IMOSString128>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'DELETE')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Stories.forEach((storyID) => {
			addTextElement(xmlSource, 'storyID', storyID)
		})
		return root
	}
}
export class RODeleteItems extends MosSendMessage {
	constructor(private Action: IMOSStoryAction, private Items: Array<IMOSString128>) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'DELETE')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		const xmlSource = addTextElement(root, 'element_source')
		this.Items.forEach((itemID) => {
			addTextElement(xmlSource, 'itemID', itemID)
		})
		return root
	}
}
export class ROSwapStories extends MosSendMessage {
	constructor(private Action: IMOSROAction, private StoryID0: IMOSString128, private StoryID1: IMOSString128) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'SWAP')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlSource = addTextElement(root, 'element_source')
		addTextElement(xmlSource, 'storyID', this.StoryID0)
		addTextElement(xmlSource, 'storyID', this.StoryID1)
		return root
	}
}
export class ROSwapItems extends MosSendMessage {
	constructor(private Action: IMOSStoryAction, private ItemID0: IMOSString128, private ItemID1: IMOSString128) {
		super()
	}
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roElementAction')
		root.att('operation', 'SWAP')
		addTextElement(root, 'roID', this.Action.RunningOrderID)
		const xmlTarget = addTextElement(root, 'element_target')
		addTextElement(xmlTarget, 'storyID', this.Action.StoryID)
		const xmlSource = addTextElement(root, 'element_source')
		addTextElement(xmlSource, 'itemID', this.ItemID0)
		addTextElement(xmlSource, 'itemID', this.ItemID1)
		return root
	}
}
