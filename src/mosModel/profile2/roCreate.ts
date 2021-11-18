import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { IMOSRunningOrder } from '../../api'
import { XMLROStory, XMLRunningOrderBase } from './xmlConversion'

export class ROCreate extends MosMessage {
	/** */
	constructor(private ro: IMOSRunningOrder) {
		super('upper')
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('roCreate')

		this.fillXMLWithROData(root)

		return root
	}
	protected fillXMLWithROData(root: XMLBuilder.XMLElement): void {
		XMLRunningOrderBase.toXML(root, this.ro)

		this.ro.Stories.forEach((story) => {
			XMLROStory.toXML(root, story)
		})
	}
}
