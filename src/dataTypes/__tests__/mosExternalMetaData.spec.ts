import { MosExternalMetaData, IMOSScope } from '../mosExternalMetaData'

let testdata = {
	MosScope: IMOSScope.STORY,
	MosSchema: 'http://ncsA4.com/mos/supported_schemas/NCSAXML2.08',
	MosPayload: 'hello world'
}

describe('mosExternalMetaData', () => {
	test('Load data correctly', () => {
		let md = new MosExternalMetaData(testdata)

		expect(md.scope).toBe('STORY')
		expect(md.schema).toBe('http://ncsA4.com/mos/supported_schemas/NCSAXML2.08')
		expect(md.payload).toEqual('hello world')
	})

	test('Convert to XML', () => {
		let md = new MosExternalMetaData(testdata)

		expect(md.messageXMLBlocks.end()).toEqual('<?xml version=\"1.0\"?><mosExternalMetadata><mosScope>STORY</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload>hello world</mosPayload></mosExternalMetadata>')
	})

	test('Detect and parse Nora content JSON payload', () => {
		const contentPayload = {"uuid":"b665e0f0-9b44-496a-8753-676d81f33ab7","metadata":{"modul":"no"}}
	
		const actual = new MosExternalMetaData({
			MosScope: IMOSScope.PLAYLIST,
			MosSchema: 'https://nora.nrk.no/mos/content',
			MosPayload: encodeURI(JSON.stringify(contentPayload))
		})

		expect(actual.payload).toEqual(contentPayload)
	})

	test('Detect and parse Nora timing JSON payload', () => {
		const timingPayload = {"timeIn":0,"duration":5000,"in":"auto","out":"auto"}
	
		const actual = new MosExternalMetaData({
			MosScope: IMOSScope.PLAYLIST,
			MosSchema: 'https://nora.nrk.no/mos/timing',
			MosPayload: encodeURI(JSON.stringify(timingPayload))
		})

		expect(actual.payload).toEqual(timingPayload)
	})

	test('Should not decode URI encoded data that is not a JSON object', () => {
		const content = encodeURI('This is not a JSON object')

		const actual = new MosExternalMetaData({
			MosScope: IMOSScope.PLAYLIST,
			MosSchema: 'https://nora.nrk.no/mos/content',
			MosPayload: content
		})

		expect(actual.payload).toEqual(content)
	})

	test('Should not decode URI encoded data that is not a valid JSON object', () => {
		const content = encodeURI('{"lol:"This is not a JSON object"')

		const actual = new MosExternalMetaData({
			MosScope: IMOSScope.PLAYLIST,
			MosSchema: 'https://nora.nrk.no/mos/content',
			MosPayload: content
		})

		expect(actual.payload).toEqual(content)
	})
})
