import { MosConnection } from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
import { IMOSConnectionStatus,
	IMOSObject,
	IMOSRunningOrder,
	IMOSROAck,
	IMOSRunningOrderBase,
	IMOSStoryStatus,
	IMOSRunningOrderStatus,
	IMOSItemStatus,
	IMOSROReadyToAir,
	IMOSStoryAction,
	IMOSROStory,
	IMOSItem,
	IMOSItemAction,
	IMOSROAction,
	IMOSROFullStory
} from '../api'
import { MosString128 } from '../dataTypes/mosString128'
// @ts-ignore Socket is never read
import { Socket, Server } from 'net'

import { SocketMock } from '../__mocks__/socket'
import { ServerMock } from '../__mocks__/server'

import { xmlData, xmlApiData } from './testData.spec'
import * as parser from 'xml2json'
import { MosDevice } from '../MosDevice'

const parseOptions: {
	object: true,
	coerce: boolean,
	trim: boolean
} = {
	object: true,
	coerce: true,
	trim: true
}

const iconv = require('iconv-lite')
iconv.encodingExists('utf16-be')

// breaks net.Server, disabled for now
// jest.mock('net')
jest.mock('net')

// const literal = <T>(o: T) => o

function getMosDevice (): Promise<MosDevice> {
	SocketMock.mockClear()
	ServerMock.mockClear()

	let mos = new MosConnection({
		mosID: 'aircache.newscenter.com',
		acceptsConnections: true,
		profiles: {
			'0': true,
			'1': true
		}
	})

	return mos.connect({
		primary: {
			id: 'ncs.newscenter.com',
			host: '127.0.0.1',
			timeout: 200
		}
	})
}
let sendMessageId = 1632
function fakeIncomingMessage (socketMockLower, message: string): Promise<number> {
	sendMessageId++
	let fullMessage = getXMLReply(sendMessageId, message)
	socketMockLower.mockReceiveMessage(encode(fullMessage))

	return Promise.resolve(sendMessageId)
}
function getXMLReply (messageId, content): string {
	return '<mos>' +
		'<mosID>aircache.newscenter.com</mosID>' +
		'<ncsID>ncs.newscenter.com</ncsID>' +
		'<messageID>' + messageId + '</messageID>' +
		content +
		'</mos>\r\n'
}
function decode (data: Buffer): string {
	return iconv.decode(data, 'utf16-be')
}
function encode (str: string) {
	return iconv.encode(str, 'utf16-be')
}
async function checkReplyToServer (socket: SocketMock, messageId: number, replyString: string) {
	// check reply to server:
	await socket.mockWaitForSentMessages()

	expect(socket.mockSentMessage).toHaveBeenCalledTimes(1)
	// @ts-ignore mock
	let reply = decode(socket.mockSentMessage.mock.calls[0][0])
	expect(reply).toContain('<messageID>' + messageId + '</messageID>')
	expect(reply).toContain(replyString)
}
function doBeforeAll () {

	expect(SocketMock.instances).toHaveLength(3)

	let socketMockLower: SocketMock | null = null
	let socketMockUpper: SocketMock | null = null
	let socketMockQuery: SocketMock | null = null

	SocketMock.instances.forEach((s) => {
		if (s.connectedPort === 10540) socketMockLower = s
		if (s.connectedPort === 10541) socketMockUpper = s
		if (s.connectedPort === 10542) socketMockQuery = s
	})
	expect(socketMockLower).toBeTruthy()
	expect(socketMockUpper).toBeTruthy()
	// expect(socketMockQuery).toBeTruthy()

	expect(ServerMock.instances).toHaveLength(3)
	// ServerMock.instances.forEach((s) => {
	// })
	let serverMockLower = ServerMock.instances[0]
	let serverMockUpper = ServerMock.instances[2]
	let serverMockQuery = ServerMock.instances[1]
	expect(serverMockLower).toBeTruthy()
	expect(serverMockUpper).toBeTruthy()
	expect(serverMockQuery).toBeTruthy()

	// Pretend a server connects to us:
	let serverSocketMockLower = serverMockLower.mockNewConnection()
	let serverSocketMockUpper = serverMockUpper.mockNewConnection()
	let serverSocketMockQuery = serverMockQuery.mockNewConnection()

	socketMockLower.name = 'lower'
	socketMockUpper.name = 'upper'
	// socketMockQuery.name = 'query'

	serverSocketMockLower.name = 'serverLower'
	serverSocketMockUpper.name = 'serverUpper'
	serverSocketMockQuery.name = 'serverQuery'

	return {
		socketMockLower,
		socketMockUpper,
		socketMockQuery,
		serverMockLower,
		serverMockUpper,
		serverMockQuery,
		serverSocketMockLower,
		serverSocketMockUpper,
		serverSocketMockQuery
	}
}

beforeAll(() => {
	// Mock tcp connection
	// @ts-ignore Replace Socket with the mocked varaint:
	Socket = SocketMock
	// @ts-ignore Replace Server with the mocked varaint:
	Server = ServerMock
})
beforeEach(() => {
	// SocketMock.mockClear()
})
describe('MosDevice: General', () => {
	test('Test the Socket mock', async () => {

		let conn = new Socket()

		let onData = jest.fn()
		let onConnect = jest.fn()
		let onClose = jest.fn()
		let onError = jest.fn()

		conn.on('data', onData)
		conn.on('connect', onConnect)
		conn.on('close', onClose)
		conn.on('error', onError)

		conn.connect('127.0.0.1')

		expect(conn.connect).toHaveBeenCalledTimes(1)

		expect(SocketMock.instances).toHaveLength(1)

		let connMock = SocketMock.instances[0]

		// Simulate us getting som data:
		connMock.mockReceiveMessage('hello')

		expect(onData).toHaveBeenCalledTimes(1)

		// Send some data:
		conn.write('hello!')

		expect(connMock.mockSentMessage).toHaveBeenCalledTimes(1)

	})
	test('basic initialization', async () => {
		let mos = new MosConnection(new ConnectionConfig({
			mosID: 'jestMOS',
			acceptsConnections: false,
			profiles: {
				'0': true,
				'1': true
			}
		}))

		expect(mos.profiles).toMatchObject({
			'0': true,
			'1': true
		})

		// expect(mos.complianceText).toBe('MOS Compatible – Profiles 0,1')
	})
	test('Incoming connections', async () => {
		let mos = new MosConnection({
			mosID: 'jestMOS',
			acceptsConnections: true,
			profiles: {
				'0': true,
				'1': true
			}
		})
		expect(mos.acceptsConnections).toBe(true)

		// SocketMock.mockAddReply('<hello>')
		await expect(mos.isListening).resolves.toEqual([true, true, true])

		// close sockets after test
		mos.dispose()
		// mos.isListening
		// 	.then(() => )
		// 	.catch(() => mos.dispose())
	})
})
describe('MosDevice: Profile 0', () => {
	test('init and connectionStatusChanged', async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		let mos = new MosConnection(new ConnectionConfig({
			mosID: 'jestMOS',
			acceptsConnections: false,
			profiles: {
				'0': true,
				'1': true
			}
		}))

		let mosDevice = await mos.connect({
			primary: {
				id: 'mockServer',
				host: '127.0.0.1',
				timeout: 200
			}
		})

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(3)
		let connMocks = SocketMock.instances
		// expect(connMocks[0].connect).toHaveBeenCalledTimes(1)
		// expect(connMocks[0].connect.mock.calls[0][0]).toEqual(10540)
		// expect(connMocks[0].connect.mock.calls[0][1]).toEqual('127.0.0.1')
		expect(connMocks[1].connect).toHaveBeenCalledTimes(1)
		expect(connMocks[1].connect.mock.calls[0][0]).toEqual(10540)
		expect(connMocks[1].connect.mock.calls[0][1]).toEqual('127.0.0.1')
		expect(connMocks[2].connect).toHaveBeenCalledTimes(1)
		expect(connMocks[2].connect.mock.calls[0][0]).toEqual(10541)
		expect(connMocks[2].connect.mock.calls[0][1]).toEqual('127.0.0.1')

		let connectionStatusChanged = jest.fn()

		mosDevice.onConnectionChange((connectionStatus: IMOSConnectionStatus) => {
			connectionStatusChanged(connectionStatus)
		})

		// expect(connectionStatusChanged).toHaveBeenCalledTimes(1) // dunno if it really should have been called, maybe remove

		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: true,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: false
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		connectionStatusChanged.mockClear()

		// @todo: add timeout test
		// mock cause timeout
		// expect(connectionStatusChanged).toHaveBeenCalledTimes(1)
		// expect(connectionStatusChanged.mock.calls[0][0]).toMatchObject({PrimaryConnected: false})
	})
})
describe('MosDevice: Profile 1', () => {
	let mosDevice: MosDevice

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMOSObject
	let onRequestAllMOSObjects

	beforeAll(async () => {

		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read
		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read

		mosDevice = await getMosDevice()

		// Profile 1:
		onRequestMOSObject = jest.fn(() => {
			return Promise.resolve(xmlApiData.mosObj)
		})
		onRequestAllMOSObjects = jest.fn(() => {
			return Promise.resolve([
				xmlApiData.mosObj,
				xmlApiData.mosObj2
			])
		})
		mosDevice.onRequestMOSObject((objId: string): Promise<IMOSObject | null> => {
			return onRequestMOSObject(objId)
		})
		mosDevice.onRequestAllMOSObjects((): Promise<Array<IMOSObject>> => {
			return onRequestAllMOSObjects()
		})
		let b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		socketMockQuery = b.socketMockQuery
		serverMockLower = b.serverMockLower
		serverMockUpper = b.serverMockUpper
		serverMockQuery = b.serverMockQuery
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
	})
	beforeEach(() => {
		// SocketMock.mockClear()
		onRequestMOSObject.mockClear()
		onRequestAllMOSObjects.mockClear()

		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		if (serverSocketMockQuery) serverSocketMockQuery.mockClear()
		socketMockLower.mockClear()
		socketMockUpper.mockClear()
		if (socketMockQuery) socketMockQuery.mockClear()
	})
	test('init', async () => {
		expect(mosDevice).toBeTruthy()
		expect(socketMockLower).toBeTruthy()
		expect(socketMockUpper).toBeTruthy()
	})
	test('onRequestMOSObject', async () => {
		// Fake incoming message on socket:
		await fakeIncomingMessage(serverSocketMockLower, xmlData.reqObj)
		expect(onRequestMOSObject).toHaveBeenCalledTimes(1)
		expect(onRequestMOSObject.mock.calls[0][0]).toEqual(xmlApiData.mosObj.ID.toString())
		expect(onRequestAllMOSObjects).toHaveBeenCalledTimes(0)

		// Check reply to socket server:
		await serverSocketMockLower.mockWaitForSentMessages()
		expect(serverSocketMockLower.mockSentMessage).toHaveBeenCalledTimes(1)
		// @ts-ignore mock
		let reply = decode(serverSocketMockLower.mockSentMessage.mock.calls[0][0])
		let parsedReply: any = parser.toJson(reply, parseOptions)

		expect(parsedReply.mos.mosObj.objID + '').toEqual(xmlApiData.mosObj.ID.toString())
		expect(parsedReply.mos.mosObj.objSlug + '').toEqual(xmlApiData.mosObj.Slug.toString())
	})
	test('onRequestAllMOSObjects', async () => {
		// Fake incoming message on socket:
		await fakeIncomingMessage(serverSocketMockLower, xmlData.mosReqAll)
		expect(onRequestAllMOSObjects).toHaveBeenCalledTimes(1)
		// expect(onRequestMOSObject.mock.calls[0][0]).toEqual(xmlApiData.mosObj.ID.toString())
		expect(onRequestMOSObject).toHaveBeenCalledTimes(0)

		// Check reply to socket server:
		await serverSocketMockLower.mockWaitForSentMessages()
		expect(serverSocketMockLower.mockSentMessage).toHaveBeenCalledTimes(1)
		// @ts-ignore mock
		let reply = decode(serverSocketMockLower.mockSentMessage.mock.calls[0][0])
		let parsedReply: any = parser.toJson(reply, parseOptions)
		expect(parsedReply.mos.mosListAll.mosObj).toHaveLength(2)
		expect(parsedReply.mos.mosListAll.mosObj[0].objID + '').toEqual(xmlApiData.mosObj.ID.toString())
		expect(parsedReply.mos.mosListAll.mosObj[0].objSlug + '').toEqual(xmlApiData.mosObj.Slug.toString())
		expect(parsedReply.mos.mosListAll.mosObj[1].objID + '').toEqual(xmlApiData.mosObj2.ID.toString())
		expect(parsedReply.mos.mosListAll.mosObj[1].objSlug + '').toEqual(xmlApiData.mosObj2.Slug.toString())

	})
	test('getMOSObject', async () => {

		// Prepare mock server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			// console.log('mockReply', str)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			let repl = getXMLReply(messageID, xmlData.mosObj)

			// console.log('repl', repl)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		let returnedObj: IMOSObject = await mosDevice.getMOSObject(xmlApiData.mosObj.ID)

		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqObj>/)

		expect(returnedObj).toMatchObject(xmlApiData.roList)
	})
	test('getAllMOSObjects', async () => {

		expect(socketMockLower).toBeTruthy()
		// Prepare mock server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			let repl = getXMLReply(messageID, xmlData.mosListAll)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		let returnedObjs: Array<IMOSObject> = await mosDevice.getAllMOSObjects()

		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqAll>/)

		expect(returnedObjs).toMatchObject(xmlApiData.mosListAll)
	})
})
describe('MosDevice: Profile 2', () => {
	let mosDevice: MosDevice
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMOSObject
	let onRequestAllMOSObjects
	let onCreateRunningOrder
	let onReplaceRunningOrder
	let onDeleteRunningOrder
	let onRequestRunningOrder
	let onMetadataReplace
	let onRunningOrderStatus
	let onStoryStatus
	let onItemStatus
	let onReadyToAir
	let onROInsertStories
	let onROInsertItems
	let onROReplaceStories
	let onROReplaceItems
	let onROMoveStories
	let onROMoveItems
	let onRODeleteStories
	let onRODeleteItems
	let onROSwapStories
	let onROSwapItems

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read
		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read

		mosDevice = await getMosDevice()

		// Profile 1:
		onRequestMOSObject = jest.fn()
		onRequestAllMOSObjects = jest.fn()

		let roAckReply = () => {
			let ack: IMOSROAck = {
				ID: new MosString128('runningOrderId'),
				Status: new MosString128('OK'),
				Stories: []
			}
			return Promise.resolve(ack)
		}
		// Profile 2:
		onCreateRunningOrder = jest.fn(roAckReply)
		onReplaceRunningOrder = jest.fn(roAckReply)
		onDeleteRunningOrder = jest.fn(roAckReply)
		onRequestRunningOrder = jest.fn(() => {
			return Promise.resolve(xmlApiData.roCreate)
		})
		onMetadataReplace = jest.fn(roAckReply)
		onRunningOrderStatus = jest.fn(roAckReply)
		onStoryStatus = jest.fn(roAckReply)
		onItemStatus = jest.fn(roAckReply)
		onReadyToAir = jest.fn(roAckReply)
		onROInsertStories = jest.fn(roAckReply)
		onROInsertItems = jest.fn(roAckReply)
		onROReplaceStories = jest.fn(roAckReply)
		onROReplaceItems = jest.fn(roAckReply)
		onROMoveStories = jest.fn(roAckReply)
		onROMoveItems = jest.fn(roAckReply)
		onRODeleteStories = jest.fn(roAckReply)
		onRODeleteItems = jest.fn(roAckReply)
		onROSwapStories = jest.fn(roAckReply)
		onROSwapItems = jest.fn(roAckReply)

		mosDevice.onRequestMOSObject((objId: string): Promise<IMOSObject | null> => {
			return onRequestMOSObject(objId)
		})
		mosDevice.onRequestAllMOSObjects((): Promise<Array<IMOSObject>> => {
			return onRequestAllMOSObjects()
		})
		mosDevice.onCreateRunningOrder((ro: IMOSRunningOrder): Promise<IMOSROAck> => {
			return onCreateRunningOrder(ro)
		})
		mosDevice.onReplaceRunningOrder((ro: IMOSRunningOrder): Promise<IMOSROAck> => {
			return onReplaceRunningOrder(ro)
		})
		mosDevice.onDeleteRunningOrder((runningOrderId: MosString128): Promise<IMOSROAck> => {
			return onDeleteRunningOrder(runningOrderId)
		})
		mosDevice.onRequestRunningOrder((runningOrderId: MosString128): Promise<IMOSRunningOrder | null> => {
			return onRequestRunningOrder(runningOrderId)
		})
		mosDevice.onMetadataReplace((metadata: IMOSRunningOrderBase): Promise<IMOSROAck> => {
			return onMetadataReplace(metadata)
		})
		mosDevice.onRunningOrderStatus((status: IMOSRunningOrderStatus): Promise<IMOSROAck> => {
			return onRunningOrderStatus(status)
		})
		mosDevice.onStoryStatus((status: IMOSStoryStatus): Promise<IMOSROAck> => {
			return onStoryStatus(status)
		})
		mosDevice.onItemStatus((status: IMOSItemStatus): Promise<IMOSROAck> => {
			return onItemStatus(status)
		})
		mosDevice.onReadyToAir((Action: IMOSROReadyToAir): Promise<IMOSROAck> => {
			return onReadyToAir(Action)
		})
		mosDevice.onROInsertStories((Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
			return onROInsertStories(Action, Stories)
		})
		mosDevice.onROInsertItems((Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> => {
			return onROInsertItems(Action, Items)
		})
		mosDevice.onROReplaceStories((Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
			return onROReplaceStories(Action, Stories)
		})
		mosDevice.onROReplaceItems((Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> => {
			return onROReplaceItems(Action, Items)
		})
		mosDevice.onROMoveStories((Action: IMOSStoryAction, Stories: Array<MosString128>): Promise<IMOSROAck> => {
			return onROMoveStories(Action, Stories)
		})
		mosDevice.onROMoveItems((Action: IMOSItemAction, Items: Array<MosString128>): Promise<IMOSROAck> => {
			return onROMoveItems(Action, Items)
		})
		mosDevice.onRODeleteStories((Action: IMOSROAction, Stories: Array<MosString128>): Promise<IMOSROAck> => {
			return onRODeleteStories(Action, Stories)
		})
		mosDevice.onRODeleteItems((Action: IMOSStoryAction, Items: Array<MosString128>): Promise<IMOSROAck> => {
			return onRODeleteItems(Action, Items)
		})
		mosDevice.onROSwapStories((Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128): Promise<IMOSROAck> => {
			return onROSwapStories(Action, StoryID0, StoryID1)
		})
		mosDevice.onROSwapItems((Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128): Promise<IMOSROAck> => {
			return onROSwapItems(Action, ItemID0, ItemID1)
		})
		let b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		socketMockQuery = b.socketMockQuery
		serverMockLower = b.serverMockLower
		serverMockUpper = b.serverMockUpper
		serverMockQuery = b.serverMockQuery
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
		// expect(SocketMock.instances[0].connect).toHaveBeenCalledTimes(1)
	})
	beforeEach(() => {
		onRequestMOSObject.mockClear()
		onRequestAllMOSObjects.mockClear()

		onCreateRunningOrder.mockClear()
		onReplaceRunningOrder.mockClear()
		onDeleteRunningOrder.mockClear()
		onRequestRunningOrder.mockClear()
		onMetadataReplace.mockClear()
		onRunningOrderStatus.mockClear()
		onStoryStatus.mockClear()
		onItemStatus.mockClear()
		onReadyToAir.mockClear()
		onROInsertStories.mockClear()
		onROInsertItems.mockClear()
		onROReplaceStories.mockClear()
		onROReplaceItems.mockClear()
		onROMoveStories.mockClear()
		onROMoveItems.mockClear()
		onRODeleteStories.mockClear()
		onRODeleteItems.mockClear()
		onROSwapStories.mockClear()
		onROSwapItems.mockClear()

		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		serverSocketMockQuery.mockClear()

	})
	test('init', async () => {
		expect(mosDevice).toBeTruthy()
		expect(socketMockLower).toBeTruthy()
		expect(socketMockUpper).toBeTruthy()
	})
	test('onCreateRunningOrder', async () => {
		// Fake incoming message on socket:

		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roCreate)
		expect(onCreateRunningOrder).toHaveBeenCalledTimes(1)
		expect(onCreateRunningOrder.mock.calls[0][0]).toMatchObject(xmlApiData.roCreate)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onReplaceRunningOrder', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roReplace)
		expect(onReplaceRunningOrder).toHaveBeenCalledTimes(1)
		expect(onReplaceRunningOrder.mock.calls[0][0]).toMatchObject(xmlApiData.roReplace)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onDeleteRunningOrder', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roDelete)
		expect(onDeleteRunningOrder).toHaveBeenCalledTimes(1)
		expect(onDeleteRunningOrder.mock.calls[0][0]).toEqual(xmlApiData.roDelete)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRequestRunningOrder', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockUpper, xmlData.roReq)
		expect(onRequestRunningOrder).toHaveBeenCalledTimes(1)

		expect(onRequestRunningOrder.mock.calls[0][0]).toEqual(96857485)
		// Check reply to socket server:
		await serverSocketMockUpper.mockWaitForSentMessages()
		expect(serverSocketMockUpper.mockSentMessage).toHaveBeenCalledTimes(1)
		await checkReplyToServer(serverSocketMockUpper, messageId, '<roList>')
		// console.log(decode(serverSocketMockUpper.mockSentMessage.mock.calls[0][0]))
		// @ts-ignore mock
		let reply = decode(serverSocketMockUpper.mockSentMessage.mock.calls[0][0])
		let parsedReply: any = parser.toJson(reply, parseOptions)
		// console.log('parsedReply',parsedReply.mos)

		// expect(parsedReply.mos.roList).toMatchObject(roLight(xmlApiData.roCreate))
		expect(parsedReply.mos.roList.roID + '').toEqual(xmlApiData.roCreate.ID.toString())
		expect(parsedReply.mos.roList.roSlug + '').toEqual(xmlApiData.roCreate.Slug.toString())
		expect(parsedReply.mos.roList.story).toHaveLength(xmlApiData.roCreate.Stories.length)
		expect(parsedReply.mos.roList.story[0].storyID + '').toEqual(xmlApiData.roCreate.Stories[0].ID.toString())
		expect(parsedReply.mos.roList.story[0].item).toBeTruthy()
		expect(parsedReply.mos.roList.story[0].item.itemID + '').toEqual(xmlApiData.roCreate.Stories[0].Items[0].ID.toString())
		expect(parsedReply.mos.roList.story[0].item.objID + '').toEqual(xmlApiData.roCreate.Stories[0].Items[0].ObjectID.toString())

	})
	test('getRunningOrder', async () => {

		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			let repl = getXMLReply(messageID, xmlData.roList)
			return encode(repl)

		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedObj: IMOSRunningOrder = await mosDevice.getRunningOrder(xmlApiData.roList.ID)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
	})
	test('onMetadataReplace', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roMetadataReplace)
		expect(onMetadataReplace).toHaveBeenCalledTimes(1)
		expect(onMetadataReplace.mock.calls[0][0]).toEqual(xmlApiData.roMetadataReplace)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRunningOrderStatus', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementStat_ro)
		expect(onRunningOrderStatus).toHaveBeenCalledTimes(1)
		expect(onRunningOrderStatus.mock.calls[0][0]).toEqual(xmlApiData.roElementStat_ro)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onStoryStatus', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementStat_story)
		expect(onStoryStatus).toHaveBeenCalledTimes(1)
		expect(onStoryStatus.mock.calls[0][0]).toEqual(xmlApiData.roElementStat_story)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onItemStatus', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementStat_item)
		expect(onItemStatus).toHaveBeenCalledTimes(1)
		expect(onItemStatus.mock.calls[0][0]).toEqual(xmlApiData.roElementStat_item)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	// todo
	test('setRunningOrderStatus', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			let repl = getXMLReply(messageID, xmlData.roAck)
			return encode(repl)
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.setRunningOrderStatus(xmlApiData.roElementStat_ro)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roElementStat element="RO">/)
		expect(returnedAck).toBeTruthy()
		expect(returnedAck.ID.toString()).toEqual('96857485')
	})
	test('setStoryStatus', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.setStoryStatus(xmlApiData.roElementStat_story)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roElementStat element="STORY">/)
		expect(returnedAck).toBeTruthy()
		expect(returnedAck.ID.toString()).toEqual('96857485')
	})
	test('setItemStatus', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.setItemStatus(xmlApiData.roElementStat_item)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roElementStat element="ITEM">/)
		expect(returnedAck).toBeTruthy()
		expect(returnedAck.ID.toString()).toEqual('96857485')
	})
	test('onReadyToAir', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roReadyToAir)
		expect(onReadyToAir).toHaveBeenCalledTimes(1)
		expect(onReadyToAir.mock.calls[0][0]).toEqual(xmlApiData.roReadyToAir)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROInsertStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_insert_story)
		expect(onROInsertStories).toHaveBeenCalledTimes(1)
		expect(onROInsertStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_insert_story_Action)
		expect(onROInsertStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_insert_story_Stories)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROInsertItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_insert_item)
		expect(onROInsertItems).toHaveBeenCalledTimes(1)
		expect(onROInsertItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_insert_item_Action)
		expect(onROInsertItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_insert_item_Items)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROReplaceStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_replace_story)
		expect(onROReplaceStories).toHaveBeenCalledTimes(1)
		expect(onROReplaceStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_replace_story_Action)
		expect(onROReplaceStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_replace_story_Stories)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROReplaceItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_replace_item)
		expect(onROReplaceItems).toHaveBeenCalledTimes(1)
		expect(onROReplaceItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_replace_item_Action)
		expect(onROReplaceItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_replace_item_Items)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROMoveStory', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_move_story)
		expect(onROMoveStories).toHaveBeenCalledTimes(1)
		expect(onROMoveStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_move_story_Action)
		expect(onROMoveStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_move_story_Stories)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROMoveStories', async () => {
		// Fake incoming message on socket:
		let messageId2 = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_move_stories)
		expect(onROMoveStories).toHaveBeenCalledTimes(1)
		expect(onROMoveStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_move_stories_Action)
		expect(onROMoveStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_move_stories_Stories)
		await checkReplyToServer(serverSocketMockLower, messageId2, '<roAck>')
	})
	test('onROMoveItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_move_items)
		expect(onROMoveItems).toHaveBeenCalledTimes(1)
		expect(onROMoveItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_move_items_Action)
		expect(onROMoveItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_move_items_Items)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRODeleteStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_delete_story)
		expect(onRODeleteStories).toHaveBeenCalledTimes(1)
		expect(onRODeleteStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_delete_story_Action)
		expect(onRODeleteStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_delete_story_Stories)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRODeleteItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_delete_items)
		expect(onRODeleteItems).toHaveBeenCalledTimes(1)
		expect(onRODeleteItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_delete_items_Action)
		expect(onRODeleteItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_delete_items_Items)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROSwapStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_swap_stories)
		expect(onROSwapStories).toHaveBeenCalledTimes(1)
		expect(onROSwapStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_swap_stories_Action)
		expect(onROSwapStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_swap_stories_StoryId0)
		expect(onROSwapStories.mock.calls[0][2]).toEqual(xmlApiData.roElementAction_swap_stories_StoryId1)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROSwapItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_swap_items)
		expect(onROSwapItems).toHaveBeenCalledTimes(1)
		expect(onROSwapItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_swap_items_Action)
		expect(onROSwapItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_swap_items_ItemId0)
		expect(onROSwapItems.mock.calls[0][2]).toEqual(xmlApiData.roElementAction_swap_items_ItemId1)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
})

describe('MosDevice: Profile 4', () => {
	let mosDevice: MosDevice
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onROStory

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		mosDevice = await getMosDevice()

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

		mosDevice.onROStory((story: IMOSROFullStory): Promise<IMOSROAck> => {
			return onROStory(story)
		})
		let b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		socketMockQuery = b.socketMockQuery
		serverMockLower = b.serverMockLower
		serverMockUpper = b.serverMockUpper
		serverMockQuery = b.serverMockQuery
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
		// expect(SocketMock.instances[0].connect).toHaveBeenCalledTimes(1)
	})
	beforeEach(() => {

		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read
		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read

		onROStory.mockClear()

		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		serverSocketMockQuery.mockClear()

	})
	test('init', async () => {
		expect(mosDevice).toBeTruthy()
		expect(socketMockLower).toBeTruthy()
		expect(socketMockUpper).toBeTruthy()
	})
	/*test('onROStory', async () => {
		// Fake incoming message on socket:

		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roStorySend)
		expect(onROStory).toHaveBeenCalledTimes(1)
		expect(onROStory.mock.calls[0][0]).toMatchObject(xmlApiData.roStorySend)
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	*/
	test('getAllRunningOrders', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)[1]
			return encode(getXMLReply(messageID, xmlData.roListAll))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedListAll = await mosDevice.getAllRunningOrders()
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReqAll/)

		expect(returnedListAll).toHaveLength(2)
		expect(returnedListAll[0]).toMatchObject(xmlApiData.roListAll[0])
		expect(returnedListAll[1]).toMatchObject(xmlApiData.roListAll[1])
	})
})
