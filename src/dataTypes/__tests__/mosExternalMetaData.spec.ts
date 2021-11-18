import { MosExternalMetaData, IMOSScope } from '../mosExternalMetaData'

const testdata = {
	MosScope: IMOSScope.STORY,
	MosSchema: 'http://ncsA4.com/mos/supported_schemas/NCSAXML2.08',
	MosPayload: 'hello world',
}

describe('mosExternalMetaData', () => {
	test('Load data correctly', () => {
		const md = new MosExternalMetaData(testdata)

		expect(md.scope).toBe('STORY')
		expect(md.schema).toBe('http://ncsA4.com/mos/supported_schemas/NCSAXML2.08')
		expect(md.payload).toEqual('hello world')
	})

	test('Convert to XML', () => {
		const md = new MosExternalMetaData(testdata)

		expect(md.messageXMLBlocks.end()).toEqual(
			'<?xml version="1.0"?><mosExternalMetadata><mosScope>STORY</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload>hello world</mosPayload></mosExternalMetadata>'
		)
	})
})
