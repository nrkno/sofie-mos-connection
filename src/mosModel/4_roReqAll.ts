import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from './MosMessage'
import { MosString128 } from '../dataTypes/mosString128'

export class ROReqAll extends MosMessage {

	private roId: MosString128
  /** */
	constructor () {
		super()
		this.port = 'upper'
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('roReqAll')
		return root
	}
}
