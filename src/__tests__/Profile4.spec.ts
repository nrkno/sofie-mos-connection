import { checkMessageSnapshot,
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
	MosConnection,
	MosDevice,
	IMOSROAck,
	IMOSROFullStory,
	MosString128} from '..'
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

describe('Profile 4', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onROStory: jest.Mock<any, any>

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		mosConnection = await getMosConnection({
			'0': true,
			'1': true,
			'2': true,
			'4': true
		}, false)
		mosDevice = await getMosDevice(mosConnection)

		let roAckReply = () => {
			let ack: IMOSROAck = {
				ID: new MosString128('runningOrderId'),
				Status: new MosString128('OK'),
				Stories: []
			}
			return Promise.resolve(ack)
		}
		// Profile 2:
		onROStory = jest.fn(roAckReply)

		mosDevice.onRunningOrderStory((story: IMOSROFullStory): Promise<IMOSROAck> => {
			return onROStory(story)
		})
		let b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
	})
	beforeEach(() => {

		onROStory.mockClear()

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
		mosDevice.checkProfileValidness()
	})
	test('onROStory', async () => {
		// Fake incoming message on socket:

		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roStorySend)
		expect(onROStory).toHaveBeenCalledTimes(1)

		let o = Object.assign({}, xmlApiData.roStorySend)
		// @ts-ignore optional property
		delete o.Body
		expect(onROStory.mock.calls[0][0]).toMatchObject(o)

		expect(fixSnapshot(onROStory.mock.calls)).toMatchSnapshot()
		xmlApiData.roStorySend.Body.forEach((testItem, key) => {
			let item: any
			try {
				item = onROStory.mock.calls[0][0].Body[key]
				if (!testItem.Content) delete testItem.Content

				expect(item).toMatchObject(testItem)
			} catch (e) {
				console.error(key)
				console.error('item', item)
				console.error('testItem', testItem)
				throw e
			}
		})
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')

	})
	test('getAllRunningOrders', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roListAll))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedListAll = await mosDevice.sendRequestAllRunningOrders()
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReqAll/)
		checkMessageSnapshot(msg)

		expect(returnedListAll).toHaveLength(2)
		expect(returnedListAll[0]).toMatchObject(xmlApiData.roListAll[0])
		expect(returnedListAll[1]).toMatchObject(xmlApiData.roListAll[1])
		expect(returnedListAll).toMatchSnapshot()
	})
})
