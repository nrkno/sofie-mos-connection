import { checkAckSnapshot,
	checkMessageSnapshot,
	checkReplyToServer,
	clearMocks,
	decode,
	doBeforeAll,
	encode,
	fakeIncomingMessage,
	fixSnapshot,
	getMosConnection,
	getMosDevice,
	getXMLReply,
	setupMocks
} from './lib'
import {
	IMOSAck,
	MosConnection,
	MosDevice,
	IMOSObject,
	IMOSObjectList,
	IMOSRequestObjectList,
	IMOSROAck,
	IMOSListSearchableSchema,
	MosString128,
	IMOSAckStatus,
	IMOSObjectType,
	IMOSObjectStatus,
	IMOSObjectAirStatus} from '..'
import { SocketMock } from '../__mocks__/socket'
import { ServerMock } from '../__mocks__/server'
import { xmlData, xmlApiData } from '../__mocks__/testData'

// @ts-ignore imports are unused
import { Socket } from 'net'

beforeAll(() => {
	setupMocks()
})
beforeEach(() => {
	clearMocks()
})
describe('Profile 3', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onMosObjCreate: jest.Mock<any, any>
	let onMosItemReplace: jest.Mock<any, any>
	let onMosReqSearchableSchema: jest.Mock<any, any>
	let onMosReqObjectList: jest.Mock<any, any>
	let onRequestObjectActionNew: jest.Mock<any, any>
	let onRequestObjectActionUpdate: jest.Mock<any, any>
	let onRequestObjectActionDelete: jest.Mock<any, any>

	let roAckReply = () => {
		let ack: IMOSROAck = {
			ID: new MosString128('runningOrderId'),
			Status: new MosString128('OK'),
			Stories: []
		}
		return Promise.resolve(ack)
	}

	let mosAckReply = () => {
		let ack: IMOSAck = {
			ID: new MosString128('runningOrderId'),
			Revision: 1,
			Status: IMOSAckStatus.ACK,
			Description: new MosString128('')
		}
		return Promise.resolve(ack)
	}

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		mosConnection = await getMosConnection({
			'0': true,
			'1': true,
			'2': true,
			'3': true
		}, false)
		mosDevice = await getMosDevice(mosConnection)

		// Profile 3:

		onMosObjCreate = jest.fn(mosAckReply)
		onMosItemReplace = jest.fn(roAckReply)
		onMosReqSearchableSchema = jest.fn((username: string) => {
			let response: IMOSListSearchableSchema = {
				username,
				mosSchema: 'http://example.com/mosSearchableSchema'
			}
			return Promise.resolve(response)
		})
		onMosReqObjectList = jest.fn((options: IMOSRequestObjectList) => {
			let response: IMOSObjectList = {
				username: options.username,
				queryID: 'A392938329kdakd2039300d0s9l3l9d0bzAQ',
				listReturnStart: 0,
				listReturnEnd: 0,
				listReturnTotal: 0
			}
			return Promise.resolve(response)
		})
		onRequestObjectActionNew = jest.fn(mosAckReply)
		onRequestObjectActionUpdate = jest.fn(mosAckReply)
		onRequestObjectActionDelete = jest.fn(mosAckReply)

		mosDevice.onObjectCreate((obj: IMOSObject) => {
			return onMosObjCreate(obj)
		})
		mosDevice.onItemReplace((roID, storyID, item) => {
			return onMosItemReplace(roID, storyID, item)
		})
		mosDevice.onRequestSearchableSchema((username) => {
			return onMosReqSearchableSchema(username)
		})
		mosDevice.onRequestObjectList((options: IMOSRequestObjectList) => {
			return onMosReqObjectList(options)
		})
		mosDevice.onRequestObjectActionNew((obj) => {
			return onRequestObjectActionNew(obj)
		})
		mosDevice.onRequestObjectActionUpdate((objId, obj) => {
			return onRequestObjectActionUpdate(objId, obj)
		})
		mosDevice.onRequestObjectActionDelete((objId) => {
			return onRequestObjectActionDelete(objId)
		})
		let b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		socketMockQuery = b.socketMockQuery
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
	})
	beforeEach(() => {
		onMosObjCreate.mockClear()
		onMosItemReplace.mockClear()
		onMosReqSearchableSchema.mockClear()
		onMosReqObjectList.mockClear()
		onRequestObjectActionNew.mockClear()
		onRequestObjectActionUpdate.mockClear()
		onRequestObjectActionDelete.mockClear()

		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		serverSocketMockQuery.mockClear()
	})
	afterAll(async () => {
		await mosConnection.dispose()
	})
	test('init', async () => {
		expect(mosDevice).toBeTruthy()
		expect(socketMockLower).toBeTruthy()
		expect(socketMockUpper).toBeTruthy()
		expect(socketMockQuery).toBeTruthy()
		mosDevice.checkProfileValidness()
	})
	test('onMosObjCreate', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.mosObjCreate)
		expect(onMosObjCreate).toHaveBeenCalledTimes(1)
		expect(onMosObjCreate.mock.calls[0][0]).toMatchObject(xmlApiData.mosObjCreate)
		expect(fixSnapshot(onMosObjCreate.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<mosAck>')
	})
	test('mosObjCreate', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.mosAck))
		})
		socketMockLower.mockAddReply(mockReply)
		let returnedAck = await mosDevice.sendObjectCreate({
			ID: new MosString128('abc'),
			Slug: new MosString128('my cool Object'),
			Type: IMOSObjectType.VIDEO,
			TimeBase: 25,
			Duration: 250
		})
		await socketMockLower.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosObjCreate>/)
		checkMessageSnapshot(msg)
		expect(returnedAck).toBeTruthy()
		checkAckSnapshot(returnedAck)
	})
	test('onMosItemReplace', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockUpper, xmlData.mosItemReplace)
		expect(onMosItemReplace).toHaveBeenCalledTimes(1)
		expect(onMosItemReplace.mock.calls[0][2]).toMatchObject(xmlApiData.mosItemReplace)
		expect(fixSnapshot(onMosItemReplace.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockUpper, messageId, '<roAck>')
	})
	test('mosItemReplace', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.sendItemReplace({
			roID: new MosString128('roX'),
			storyID: new MosString128('storyY'),
			item: {
				ID: new MosString128('abc'),
				Slug: new MosString128('my cool Object'),
				// Type: IMOSObjectType.VIDEO,
				TimeBase: 25,
				Duration: 250,
				ObjectID: new MosString128('Object0'),
				MOSID: 'our.mos.id'
			}
		})
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosItemReplace>/)
		expect(msg).toMatch(/<roID>roX<\/roID>/)
		expect(msg).toMatch(/<storyID>storyY<\/storyID>/)
		checkMessageSnapshot(msg)
		expect(returnedAck).toBeTruthy()
		checkAckSnapshot(returnedAck)
	})
	test('onMosReqSearchableSchema', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockQuery, xmlData.mosReqSearchableSchema)
		expect(onMosReqSearchableSchema).toHaveBeenCalledTimes(1)
		expect(onMosReqSearchableSchema.mock.calls[0][0]).toMatch(xmlApiData.mosReqSearchableSchema)
		expect(fixSnapshot(onMosReqSearchableSchema.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockQuery, messageId, '<mosListSearchableSchema username="jbob"')
	})
	test('mosReqSearchableSchema', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.mosListSearchableSchema))
		})
		socketMockQuery.mockAddReply(mockReply)
		let returnedSchema: IMOSListSearchableSchema = await mosDevice.sendRequestSearchableSchema('myUsername')

		await socketMockQuery.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqSearchableSchema username="myUsername"/)
		checkMessageSnapshot(msg)

		expect(returnedSchema.username).toEqual('myUsername')
		expect(returnedSchema.mosSchema).toEqual('http://MOSA4.com/mos/supported_schemas/MOSAXML2.08')
		expect(returnedSchema).toMatchSnapshot()
	})
	test('onMosReqObjectList', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockQuery, xmlData.mosReqObjList)
		expect(onMosReqObjectList).toHaveBeenCalledTimes(1)
		expect(onMosReqObjectList.mock.calls[0][0]).toMatchObject(xmlApiData.mosReqObjList)
		expect(fixSnapshot(onMosReqObjectList.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockQuery, messageId, '<mosObjList')
	})
	test('mosRequestObjectList', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.mosObjList))
		})
		socketMockQuery.mockAddReply(mockReply)
		let returnedObjList: IMOSObjectList = await mosDevice.sendRequestObjectList({
			username: 'jbob',
			queryID: new MosString128('A392938329kdakd2039300d0s9l3l9d0bzAQ'),
			listReturnStart: 1,
			listReturnEnd: 20,
			generalSearch: new MosString128('boats'),
			mosSchema: '',
			searchGroups: []
		})

		await socketMockQuery.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqObjList username="jbob">/)
		checkMessageSnapshot(msg)

		expect(returnedObjList.username).toEqual('jbob')
		expect(returnedObjList.list).toHaveLength(3)
		expect(returnedObjList.list![0]).toMatchObject({
			ID: new MosString128('M000121'),
			Slug: new MosString128('Hotel Fire'),
			Group: 'Show 7',
			Type: IMOSObjectType.VIDEO,
			TimeBase: 59.94,
			Revision: 1,
			Duration: 1800,
			Status: IMOSObjectStatus.NEW,
			AirStatus: IMOSObjectAirStatus.READY
		})
		expect(returnedObjList).toMatchSnapshot()
	})
	test('onMosReqObjectActionNew', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockQuery, xmlData.mosReqObjActionNew)
		expect(onRequestObjectActionNew).toHaveBeenCalledTimes(1)
		expect(onRequestObjectActionNew.mock.calls[0][0]).toMatchObject(xmlApiData.mosObjReqObjActionNew)
		expect(fixSnapshot(onRequestObjectActionNew.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockQuery, messageId, '<mosAck>')
	})
	test('onMosReqObjectActionUpdate', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockQuery, xmlData.mosReqObjActionUpdate)
		expect(onRequestObjectActionUpdate).toHaveBeenCalledTimes(1)
		expect(onRequestObjectActionUpdate.mock.calls[0][0]).toBe(xmlApiData.mosObjReqObjActionUpdateObjId)
		expect(onRequestObjectActionUpdate.mock.calls[0][1]).toMatchObject(xmlApiData.mosObjReqObjActionUpdate)
		expect(fixSnapshot(onRequestObjectActionUpdate.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockQuery, messageId, '<mosAck>')
	})
	test('onMosReqObjectActionDelete ', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockQuery, xmlData.mosReqObjActionDelete)
		expect(onRequestObjectActionDelete).toHaveBeenCalledTimes(1)
		expect(onRequestObjectActionDelete.mock.calls[0][0]).toBe(xmlApiData.mosObjReqObjActionDeleteObjId)
		expect(fixSnapshot(onRequestObjectActionDelete.mock.calls)).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockQuery, messageId, '<mosAck>')
	})
	test('sendMosReqObjectActionNew', async () => {
		// Prepare server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.mosAck))
		})
		socketMockLower.mockAddReply(mockReply)
		await mosDevice.sendRequestObjectActionNew({
			Slug: new MosString128('abc123'),
			Type: IMOSObjectType.VIDEO,
			TimeBase: 25,
			Duration: 500
		})
		await socketMockQuery.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqObjAction operation="NEW">/)
		checkMessageSnapshot(msg)
	})
	test('sendMosReqObjectActionUpdateUpdate', async () => {
		// Prepare server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.mosAck))
		})
		socketMockLower.mockAddReply(mockReply)
		await mosDevice.sendRequestObjectActionUpdate(new MosString128('OBJID1234'),{
			Slug: new MosString128('abc123'),
			Type: IMOSObjectType.VIDEO,
			TimeBase: 25,
			Duration: 500
		})
		await socketMockQuery.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqObjAction operation="UPDATE" objID="OBJID1234">/)
		checkMessageSnapshot(msg)
	})
	test('sendMosReqObjectActionUpdateDelete', async () => {
		// Prepare server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.mosAck))
		})
		socketMockLower.mockAddReply(mockReply)
		await mosDevice.sendRequestObjectActionDelete(new MosString128('OBJID1234'))
		await socketMockQuery.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqObjAction operation="DELETE" objID="OBJID1234"\/>/)
		checkMessageSnapshot(msg)
	})
	test('sendRunningOrderStory', async () => {
		// Prepare server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockUpper.mockAddReply(mockReply)
		await mosDevice.sendRunningOrderStory(xmlApiData.sendRunningOrderStory)
		await socketMockQuery.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roStorySend>/)
		expect(msg).toMatch(/<roID>96857485<\/roID>/)
		expect(msg).toMatch(/<storyID>5983A501:0049B924:8390EF1F<\/storyID>/)
		checkMessageSnapshot(msg)
	})

})
