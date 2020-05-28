import * as XMLBuilder from 'xmlbuilder'
import { IMOSRunningOrder } from '../../api'
import { ROCreate } from './roCreate'

export class ROReplace extends ROCreate {

	constructor (ro: IMOSRunningOrder) {
		super(ro)
		this.port = 'upper'
	}
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('roReplace')
		this.fillXMLWithROData(root)
		return root
	}
}
