import * as XMLBuilder from 'xmlbuilder'

export interface IMOSExternalMetaData {
	MosScope?: IMOSScope
	MosSchema: string
	MosPayload: any
}

export enum IMOSScope {
	OBJECT = 'OBJECT',
	STORY = 'STORY',
	PLAYLIST = 'PLAYLIST'
}

export class mosExternalMetaData {

	private _scope: IMOSScope
	private _schema: string
	private _payload: any

	constructor (obj: IMOSExternalMetaData) {
		this._scope = obj.MosScope
		this._schema = obj.MosSchema
		this._payload = obj.MosPayload
	}

	get scope (): IMOSScope {
		return this._scope
	}s

	get schema (): string {
		return this._schema
	}

	get payload (): any {
		return this._payload
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('mosExternalMetadata') // config headless
		root.ele('mosScope', this._scope)
		root.ele('mosSchema', this._schema)
		root.ele('mosPayload', this._payload) // converts json to xml
		return root
	}

}
