import '../__mocks__/time'
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
	IMOSROFullStory,
	IMOSSearchableSchema,
	IMosObjectList,
	IMosRequestObjectList,
	IMOSAck,
	IMOSAckStatus,
	IMOSObjectType,
	IMOSObjectStatus,
	IMOSObjectAirStatus
} from '../api'
import { MosString128 } from '../dataTypes/mosString128'
// @ts-ignore Socket is never read
import { Socket, Server } from 'net'

import { SocketMock } from '../__mocks__/socket'
import { ServerMock } from '../__mocks__/server'

import { xmlData, xmlApiData } from './testData.spec'
import { xml2js } from 'xml-js'
import { MosDevice } from '../MosDevice'
import { MOSAck } from '../mosModel'

const iconv = require('iconv-lite')
iconv.encodingExists('utf16-be')

// breaks net.Server, disabled for now
// jest.mock('net')
jest.mock('net')

let setTimeoutOrg = setTimeout
let delay = (ms: number) => {
	return new Promise((resolve) => {
		setTimeoutOrg(resolve, ms)
	})
}

// const literal = <T>(o: T) => o

async function getMosConnection (): Promise<MosConnection> {
	ServerMock.mockClear()

	let mos = new MosConnection({
		mosID: 'our.mos.id',
		acceptsConnections: true,
		profiles: {
			'0': true,
			'1': true,
			'2': true,
			'3': true
		}
	})
	await mos.init()

	expect(ServerMock.instances).toHaveLength(3)

	return Promise.resolve(mos)
}
async function getMosDevice (mos: MosConnection): Promise<MosDevice> {
	SocketMock.mockClear()

	let device = await mos.connect({
		primary: {
			id: 'their.mos.id',
			host: '127.0.0.1',
			timeout: 200
		}
	})

	// jest.advanceTimersByTime(10) // allow for heartbeats to be sent
	await delay(10) // to allow for async timers & events to triggered

	return Promise.resolve(device)
}
let sendMessageId = 1632
function fakeIncomingMessage (socketMockLower: SocketMock, message: string, ourMosId?: string, theirMosId?: string): Promise<number> {
	sendMessageId++
	let fullMessage = getXMLReply(sendMessageId, message, ourMosId, theirMosId)
	socketMockLower.mockReceiveMessage(encode(fullMessage))

	return Promise.resolve(sendMessageId)
}
function getXMLReply (messageId: string | number, content: string, ourMosId?: string, theirMosId?: string): string {
	return '<mos>' +
		'<mosID>' + (ourMosId || 'our.mos.id') + '</mosID>' +
		'<ncsID>' + (theirMosId || 'their.mos.id') + '</ncsID>' +
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
	expect(reply).toMatchSnapshot(reply)
}
function checkMessageSnapshot (msg: string) {
	expect(
		msg
		.replace(/<messageID>\d+<\/messageID>/, '<messageID>xx</messageID>')
		.replace(/<time>[^<>]+<\/time>/, '<time>xx</time>')
	).toMatchSnapshot()

}
function checkAckSnapshot (ack: MOSAck | IMOSROAck) {
	const ack2: any = {
		...ack
		// messageID: 999
	}
	if (ack2.mos) {
		ack2.mos = {
			...ack2.mos,
			messageID: 999
		}
	}
	expect(ack2).toMatchSnapshot()

}
function doBeforeAll () {
	let socketMockLower = SocketMock.instances.find(s => s.connectedPort === 10540) as SocketMock
	let socketMockUpper = SocketMock.instances.find(s => s.connectedPort === 10541) as SocketMock
	let socketMockQuery = SocketMock.instances.find(s => s.connectedPort === 10542) as SocketMock

	expect(socketMockLower).toBeTruthy()
	expect(socketMockUpper).toBeTruthy()
	expect(socketMockQuery).toBeTruthy()

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
	socketMockQuery.name = 'query'

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
	// jest.useFakeTimers()
})
beforeEach(() => {
	SocketMock.mockClear()
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
		connMock.mockReceiveMessage('<mos>\
			<mosID>me</mosID>\
			<ncsID>you</ncsID>\
			<messageID>42</messageID>\
			<hello></hello>\
		</mos>\r\n')

		expect(onData).toHaveBeenCalledTimes(1)

		// Send some data:
		conn.write('<mos>\
			<mosID>me</mosID>\
			<ncsID>you</ncsID>\
			<messageID>42</messageID>\
			<hello></hello>\
		</mos>\r\n')

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
			'1': true,
			'2': false,
			'3': false,
			'4': false,
			'5': false,
			'6': false,
			'7': false
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
		await mos.init()
		expect(mos.isListening).toBe(true)
		expect(SocketMock.instances).toHaveLength(0)

		// close sockets after test
		await mos.dispose()
	})
	test('MosDevice', async () => {
		let mos = new MosConnection({
			mosID: 'jestMOS',
			acceptsConnections: true,
			profiles: {
				'0': true,
				'1': true
			}
		})
		expect(mos.acceptsConnections).toBe(true)
		await mos.init()
		expect(mos.isListening).toBe(true)

		let mosDevice = await mos.connect({
			primary: {
				id: 'primary',
				host: '192.168.0.1'
			}
			// todo: secondary
		})
		expect(mosDevice).toBeTruthy()
		expect(mosDevice.idPrimary).toEqual('jestMOS_primary')

		expect(SocketMock.instances).toHaveLength(4)
		expect(SocketMock.instances[1].connectedHost).toEqual('192.168.0.1')
		expect(SocketMock.instances[1].connectedPort).toEqual(10540)
		expect(SocketMock.instances[2].connectedHost).toEqual('192.168.0.1')
		expect(SocketMock.instances[2].connectedPort).toEqual(10541)
		expect(SocketMock.instances[3].connectedHost).toEqual('192.168.0.1')
		expect(SocketMock.instances[3].connectedPort).toEqual(10542)

		// close sockets after test
		await mos.dispose()

		expect(SocketMock.instances).toHaveLength(4)
		expect(SocketMock.instances[1].destroy).toHaveBeenCalledTimes(1)
		expect(SocketMock.instances[2].destroy).toHaveBeenCalledTimes(1)
		expect(SocketMock.instances[3].destroy).toHaveBeenCalledTimes(1)

	})
})
test('mos device secondary', async () => {
	let mos = new MosConnection({
		mosID: 'jestMOS',
		acceptsConnections: true,
		profiles: {
			'0': true,
			'1': true
		}
	})
	expect(mos.acceptsConnections).toBe(true)
	await mos.init()
	expect(mos.isListening).toBe(true)

	let mosDevice = await mos.connect({
		primary: {
			id: 'primary',
			host: '192.168.0.1',
			timeout: 200
		},
		secondary: {
			id: 'secondary',
			host: '192.168.0.2',
			timeout: 200
		}
	})
	expect(mosDevice).toBeTruthy()
	expect(mosDevice.idPrimary).toEqual('jestMOS_primary')
	// expect(mosDevice.secondaryId).toEqual('jestMOS_secondary')

	expect(SocketMock.instances).toHaveLength(7)
	expect(SocketMock.instances[1].connectedHost).toEqual('192.168.0.1')
	expect(SocketMock.instances[1].connectedPort).toEqual(10540)
	expect(SocketMock.instances[2].connectedHost).toEqual('192.168.0.1')
	expect(SocketMock.instances[2].connectedPort).toEqual(10541)
	expect(SocketMock.instances[3].connectedHost).toEqual('192.168.0.1')
	expect(SocketMock.instances[3].connectedPort).toEqual(10542)

	expect(SocketMock.instances[4].connectedHost).toEqual('192.168.0.2')
	expect(SocketMock.instances[4].connectedPort).toEqual(10540)
	expect(SocketMock.instances[5].connectedHost).toEqual('192.168.0.2')
	expect(SocketMock.instances[5].connectedPort).toEqual(10541)
	expect(SocketMock.instances[6].connectedHost).toEqual('192.168.0.2')
	expect(SocketMock.instances[6].connectedPort).toEqual(10542)

	// Prepare mock server response:
	let mockReply = jest.fn((data) => {
		let str = decode(data)
		// console.log('mockReply', str)
		let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
		let repl = getXMLReply(messageID, xmlData.mosObj)

		// console.log('repl', repl)
		return encode(repl)
	})

	// add reply to secondary server, causes timeout on primary:
	SocketMock.instances[4].mockAddReply(mockReply)
	let returnedObj: IMOSObject = await mosDevice.getMOSObject(xmlApiData.mosObj.ID!)
	expect(returnedObj).toBeTruthy()

	// add reply to primary server, causes timeout on secondary:
	SocketMock.instances[1].mockAddReply(mockReply)
	returnedObj = await mosDevice.getMOSObject(xmlApiData.mosObj.ID!)
	expect(returnedObj).toBeTruthy()

})
describe('MosDevice: Basic functionality', () => {
	test('init and connectionStatusChanged', async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		let mosConnection = new MosConnection(new ConnectionConfig({
			mosID: 'jestMOS',
			acceptsConnections: false,
			profiles: {
				'0': true,
				'1': true
			}
		}))
		await mosConnection.init()

		let mosDevice = await mosConnection.connect({
			primary: {
				id: 'mockServer',
				host: '127.0.0.1',
				timeout: 200
			}
		})
		// jest.advanceTimersByTime(10) // allow for heartbeats to be sent
		await delay(10) // to allow for async timers & events to triggered

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(4)
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
		expect(connMocks[3].connect).toHaveBeenCalledTimes(1)
		expect(connMocks[3].connect.mock.calls[0][0]).toEqual(10542)
		expect(connMocks[3].connect.mock.calls[0][1]).toEqual('127.0.0.1')

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
describe('MosDevice: Profile 0', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMOSObject: jest.Mock<any, any>
	let onRequestAllMOSObjects: jest.Mock<any, any>

	beforeAll(async () => {

		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read
		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read

		mosConnection = await getMosConnection()
		mosDevice = await getMosDevice(mosConnection)

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
	afterAll(async () => {
		await mosDevice.dispose()
		await mosConnection.dispose()
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
		expect(serverSocketMockLower).toBeTruthy()
	})
	test('heartbeat from other party', async () => {

		expect(serverSocketMockLower).toBeTruthy()

		serverSocketMockLower.setReplyToHeartBeat(false)

		let serverReply: jest.Mock<any, any> = jest.fn(() => false)
		serverSocketMockLower.mockAddReply(serverReply)
		// Fake incoming message on socket:
		let sendMessageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.heartbeat)
		await delay(10) // to allow for async timers & events to triggered

		expect(serverReply).toHaveBeenCalledTimes(1)
		// console.log(serverReply.mock.calls[0])

		let msg = serverSocketMockLower.decode(serverReply.mock.calls[0][0])

		expect(msg).toMatch(/<heartbeat/)
		expect(msg).toMatch('<messageID>' + sendMessageId)
	})

	test('unknown party connects', async () => {

		// let unknownServerSocketMockLower = serverMockLower.mockNewConnection()

		expect(serverSocketMockLower).toBeTruthy()
		serverSocketMockLower.setReplyToHeartBeat(false)
		let serverReply: jest.Mock<any, any> = jest.fn(() => false)
		serverSocketMockLower.mockAddReply(serverReply)

		// Fake incoming message on socket:
		let sendMessageId = await fakeIncomingMessage(
			serverSocketMockLower,
			xmlData.heartbeat,
			'ourUnknownMosId'
		)
		await delay(10) // to allow for async timers & events to triggered

		expect(serverReply).toHaveBeenCalledTimes(1)
		let msg = serverSocketMockLower.decode(serverReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosAck>/)
		expect(msg).toMatch('<messageID>' + sendMessageId)
		expect(msg).toMatch('<status>NACK')

		serverReply.mockClear()
		serverSocketMockLower.mockAddReply(serverReply)

		// Fake incoming message on socket:
		sendMessageId = await fakeIncomingMessage(
			serverSocketMockLower,
			xmlData.heartbeat,
			undefined,
			'theirUnknownMosId'
		)
		await delay(10) // to allow for async timers & events to triggered

		expect(serverReply).toHaveBeenCalledTimes(1)
		msg = serverSocketMockLower.decode(serverReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosAck>/)
		expect(msg).toMatch('<messageID>' + sendMessageId)
		expect(msg).toMatch('<status>NACK')

	})
})

describe('MosDevice: Profile 1', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMOSObject: jest.Mock<any, any>
	let onRequestAllMOSObjects: jest.Mock<any, any>

	beforeAll(async () => {

		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read
		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read

		mosConnection = await getMosConnection()
		mosDevice = await getMosDevice(mosConnection)

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
	afterAll(async () => {
		await mosDevice.dispose()
		await mosConnection.dispose()
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
		expect(onRequestMOSObject.mock.calls[0][0]).toEqual(xmlApiData.mosObj.ID!.toString())
		expect(onRequestMOSObject.mock.calls).toMatchSnapshot()
		expect(onRequestAllMOSObjects).toHaveBeenCalledTimes(0)
		// console.log('b')
		// Check reply to socket server:
		await serverSocketMockLower.mockWaitForSentMessages()
		expect(serverSocketMockLower.mockSentMessage).toHaveBeenCalledTimes(1)
		// @ts-ignore mock
		let reply = decode(serverSocketMockLower.mockSentMessage['mock'].calls![0][0])
		let parsedReply: any = xml2js(reply, { compact: true, nativeType: true, trim: true })

		expect(parsedReply.mos.mosObj.objID._text + '').toEqual(xmlApiData.mosObj.ID!.toString())
		expect(parsedReply.mos.mosObj.objSlug._text + '').toEqual(xmlApiData.mosObj.Slug.toString())
		expect(parsedReply).toMatchSnapshot()
	})
	test('onRequestAllMOSObjects', async () => {
		// Fake incoming message on socket:
		await fakeIncomingMessage(serverSocketMockLower, xmlData.mosReqAll)
		expect(onRequestAllMOSObjects).toHaveBeenCalledTimes(1)
		// expect(onRequestMOSObject.mock.calls[0][0]).toEqual(xmlApiData.mosObj.ID.toString())
		expect(onRequestAllMOSObjects.mock.calls).toMatchSnapshot()
		expect(onRequestMOSObject).toHaveBeenCalledTimes(0)

		// Check reply to socket server:
		await serverSocketMockLower.mockWaitForSentMessages()
		expect(serverSocketMockLower.mockSentMessage).toHaveBeenCalledTimes(1)
		// @ts-ignore mock
		let reply = decode(serverSocketMockLower.mockSentMessage.mock.calls[0][0])
		let parsedReply: any = xml2js(reply, { compact: true, nativeType: true, trim: true })
		expect(parsedReply.mos.mosListAll.mosObj).toHaveLength(2)
		expect(parsedReply.mos.mosListAll.mosObj[0].objID._text + '').toEqual(xmlApiData.mosObj.ID!.toString())
		expect(parsedReply.mos.mosListAll.mosObj[0].objSlug._text + '').toEqual(xmlApiData.mosObj.Slug.toString())
		expect(parsedReply.mos.mosListAll.mosObj[1].objID._text + '').toEqual(xmlApiData.mosObj2.ID!.toString())
		expect(parsedReply.mos.mosListAll.mosObj[1].objSlug._text + '').toEqual(xmlApiData.mosObj2.Slug.toString())
		expect(parsedReply).toMatchSnapshot()
	})
	test('getMOSObject', async () => {

		// Prepare mock server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			// console.log('mockReply', str)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.mosObj)

			// console.log('repl', repl)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		let returnedObj: IMOSObject = await mosDevice.getMOSObject(xmlApiData.mosObj.ID!)

		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqObj>/)
		checkMessageSnapshot(msg)

		expect(returnedObj).toMatchObject(xmlApiData.roList)
		expect(returnedObj).toMatchSnapshot()
	})
	test('getAllMOSObjects', async () => {

		expect(socketMockLower).toBeTruthy()
		// Prepare mock server response:
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.mosListAll)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		let returnedObjs: Array<IMOSObject> = await mosDevice.getAllMOSObjects()

		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<mosReqAll>/)
		checkMessageSnapshot(msg)

		expect(returnedObjs).toMatchObject(xmlApiData.mosListAll)
		expect(returnedObjs).toMatchSnapshot()
	})
})

describe('MosDevice: Profile 2', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMOSObject: jest.Mock<any, any>
	let onRequestAllMOSObjects: jest.Mock<any, any>
	let onCreateRunningOrder: jest.Mock<any, any>
	let onReplaceRunningOrder: jest.Mock<any, any>
	let onDeleteRunningOrder: jest.Mock<any, any>
	let onRequestRunningOrder: jest.Mock<any, any>
	let onMetadataReplace: jest.Mock<any, any>
	let onRunningOrderStatus: jest.Mock<any, any>
	let onStoryStatus: jest.Mock<any, any>
	let onItemStatus: jest.Mock<any, any>
	let onReadyToAir: jest.Mock<any, any>
	let onROInsertStories: jest.Mock<any, any>
	let onROInsertItems: jest.Mock<any, any>
	let onROReplaceStories: jest.Mock<any, any>
	let onROReplaceItems: jest.Mock<any, any>
	let onROMoveStories: jest.Mock<any, any>
	let onROMoveItems: jest.Mock<any, any>
	let onRODeleteStories: jest.Mock<any, any>
	let onRODeleteItems: jest.Mock<any, any>
	let onROSwapStories: jest.Mock<any, any>
	let onROSwapItems: jest.Mock<any, any>

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read
		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read

		mosConnection = await getMosConnection()
		mosDevice = await getMosDevice(mosConnection)

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
		expect(onCreateRunningOrder.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onReplaceRunningOrder', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roReplace)
		expect(onReplaceRunningOrder).toHaveBeenCalledTimes(1)
		expect(onReplaceRunningOrder.mock.calls[0][0]).toMatchObject(xmlApiData.roReplace)
		expect(onReplaceRunningOrder.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onDeleteRunningOrder', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roDelete)
		expect(onDeleteRunningOrder).toHaveBeenCalledTimes(1)
		expect(onDeleteRunningOrder.mock.calls[0][0]).toEqual(xmlApiData.roDelete)
		expect(onDeleteRunningOrder.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRequestRunningOrder', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockUpper, xmlData.roReq)
		expect(onRequestRunningOrder).toHaveBeenCalledTimes(1)

		expect(onRequestRunningOrder.mock.calls[0][0]).toEqual(96857485)
		expect(onRequestRunningOrder.mock.calls).toMatchSnapshot()
		// Check reply to socket server:
		await serverSocketMockUpper.mockWaitForSentMessages()
		expect(serverSocketMockUpper.mockSentMessage).toHaveBeenCalledTimes(1)
		await checkReplyToServer(serverSocketMockUpper, messageId, '<roList>')
		// console.log(decode(serverSocketMockUpper.mockSentMessage.mock.calls[0][0]))
		// @ts-ignore mock
		let reply = decode(serverSocketMockUpper.mockSentMessage.mock.calls[0][0])
		let parsedReply: any = xml2js(reply, { compact: true, nativeType: true, trim: true })
		// console.log('parsedReply',parsedReply.mos)

		// expect(parsedReply.mos.roList).toMatchObject(roLight(xmlApiData.roCreate))
		expect(parsedReply.mos.roList.roID._text + '').toEqual(xmlApiData.roCreate.ID.toString())
		expect(parsedReply.mos.roList.roSlug._text + '').toEqual(xmlApiData.roCreate.Slug.toString())
		expect(parsedReply.mos.roList.story).toHaveLength(xmlApiData.roCreate.Stories.length)
		expect(parsedReply.mos.roList.story[0].storyID._text + '').toEqual(xmlApiData.roCreate.Stories[0].ID.toString())
		expect(parsedReply.mos.roList.story[0].item).toBeTruthy()
		expect(parsedReply.mos.roList.story[0].item.itemID._text + '').toEqual(xmlApiData.roCreate.Stories[0].Items[0].ID.toString())
		expect(parsedReply.mos.roList.story[0].item.objID._text + '').toEqual(xmlApiData.roCreate.Stories[0].Items[0].ObjectID.toString())

		expect(parsedReply).toMatchSnapshot()

	})
	test('getRunningOrder', async () => {

		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.roList)
			return encode(repl)

		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedObj = await mosDevice.sendRequestRunningOrder(xmlApiData.roList.ID!) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()
	})
	test('onMetadataReplace', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roMetadataReplace)
		expect(onMetadataReplace).toHaveBeenCalledTimes(1)
		expect(onMetadataReplace.mock.calls[0][0]).toEqual(xmlApiData.roMetadataReplace)
		expect(onMetadataReplace.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRunningOrderStatus', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementStat_ro)
		expect(onRunningOrderStatus).toHaveBeenCalledTimes(1)
		expect(onRunningOrderStatus.mock.calls[0][0]).toEqual(xmlApiData.roElementStat_ro)
		expect(onRunningOrderStatus.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onStoryStatus', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementStat_story)
		expect(onStoryStatus).toHaveBeenCalledTimes(1)
		expect(onStoryStatus.mock.calls[0][0]).toEqual(xmlApiData.roElementStat_story)
		expect(onStoryStatus.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onItemStatus', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementStat_item)
		expect(onItemStatus).toHaveBeenCalledTimes(1)
		expect(onItemStatus.mock.calls[0][0]).toEqual(xmlApiData.roElementStat_item)
		expect(onItemStatus.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	// todo
	test('setRunningOrderStatus', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.roAck)
			return encode(repl)
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.setRunningOrderStatus(xmlApiData.roElementStat_ro)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roElementStat element="RO">/)
		checkMessageSnapshot(msg)
		expect(returnedAck).toBeTruthy()
		expect(returnedAck.ID.toString()).toEqual('96857485')
		checkAckSnapshot(returnedAck)
	})
	test('setStoryStatus', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.setStoryStatus(xmlApiData.roElementStat_story)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roElementStat element="STORY">/)
		checkMessageSnapshot(msg)
		expect(returnedAck).toBeTruthy()
		expect(returnedAck.ID.toString()).toEqual('96857485')
		checkAckSnapshot(returnedAck)
	})
	test('setItemStatus', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedAck: IMOSROAck = await mosDevice.setItemStatus(xmlApiData.roElementStat_item)
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roElementStat element="ITEM">/)
		checkMessageSnapshot(msg)
		expect(returnedAck).toBeTruthy()
		expect(returnedAck.ID.toString()).toEqual('96857485')
		checkAckSnapshot(returnedAck)
	})
	test('onReadyToAir', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roReadyToAir)
		expect(onReadyToAir).toHaveBeenCalledTimes(1)
		expect(onReadyToAir.mock.calls[0][0]).toEqual(xmlApiData.roReadyToAir)
		expect(onReadyToAir.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROInsertStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_insert_story)
		expect(onROInsertStories).toHaveBeenCalledTimes(1)
		expect(onROInsertStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_insert_story_Action)
		expect(onROInsertStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_insert_story_Stories)
		expect(onROInsertStories.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROInsertItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_insert_item)
		expect(onROInsertItems).toHaveBeenCalledTimes(1)
		expect(onROInsertItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_insert_item_Action)
		expect(onROInsertItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_insert_item_Items)
		expect(onROInsertItems.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROReplaceStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_replace_story)
		expect(onROReplaceStories).toHaveBeenCalledTimes(1)
		expect(onROReplaceStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_replace_story_Action)
		expect(onROReplaceStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_replace_story_Stories)
		expect(onROReplaceStories.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROReplaceItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_replace_item)
		expect(onROReplaceItems).toHaveBeenCalledTimes(1)
		expect(onROReplaceItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_replace_item_Action)
		expect(onROReplaceItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_replace_item_Items)
		expect(onROReplaceItems.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROMoveStory', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_move_story)
		expect(onROMoveStories).toHaveBeenCalledTimes(1)
		expect(onROMoveStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_move_story_Action)
		expect(onROMoveStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_move_story_Stories)
		expect(onROMoveStories.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROMoveStories', async () => {
		// Fake incoming message on socket:
		let messageId2 = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_move_stories)
		expect(onROMoveStories).toHaveBeenCalledTimes(1)
		expect(onROMoveStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_move_stories_Action)
		expect(onROMoveStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_move_stories_Stories)
		expect(onROMoveStories.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId2, '<roAck>')
	})
	test('onROMoveItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_move_items)
		expect(onROMoveItems).toHaveBeenCalledTimes(1)
		expect(onROMoveItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_move_items_Action)
		expect(onROMoveItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_move_items_Items)
		expect(onROMoveItems.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRODeleteStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_delete_story)
		expect(onRODeleteStories).toHaveBeenCalledTimes(1)
		expect(onRODeleteStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_delete_story_Action)
		expect(onRODeleteStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_delete_story_Stories)
		expect(onRODeleteStories.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onRODeleteItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_delete_items)
		expect(onRODeleteItems).toHaveBeenCalledTimes(1)
		expect(onRODeleteItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_delete_items_Action)
		expect(onRODeleteItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_delete_items_Items)
		expect(onRODeleteItems.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROSwapStories', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_swap_stories)
		expect(onROSwapStories).toHaveBeenCalledTimes(1)
		expect(onROSwapStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_swap_stories_Action)
		expect(onROSwapStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_swap_stories_StoryId0)
		expect(onROSwapStories.mock.calls[0][2]).toEqual(xmlApiData.roElementAction_swap_stories_StoryId1)
		expect(onROSwapStories.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
	test('onROSwapItems', async () => {
		// Fake incoming message on socket:
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roElementAction_swap_items)
		expect(onROSwapItems).toHaveBeenCalledTimes(1)
		expect(onROSwapItems.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_swap_items_Action)
		expect(onROSwapItems.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_swap_items_ItemId0)
		expect(onROSwapItems.mock.calls[0][2]).toEqual(xmlApiData.roElementAction_swap_items_ItemId1)
		expect(onROSwapItems.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
	})
})

describe('MosDevice: Profile 3', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onMosObjCreate: jest.Mock<any, any>
	let onMosItemReplace: jest.Mock<any, any>
	let onMosReqSearchableSchema: jest.Mock<any, any>
	let onMosReqObjectList: jest.Mock<any, any>
	let onMosReqObjectAction: jest.Mock<any, any>

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

		socketMockLower = socketMockLower // lintfix: never read
		socketMockUpper = socketMockUpper // lintfix: never read
		socketMockQuery = socketMockQuery // lintfix: never read
		serverMockLower = serverMockLower // lintfix: never read
		serverMockUpper = serverMockUpper // lintfix: never read
		serverMockQuery = serverMockQuery // lintfix: never read

		mosConnection = await getMosConnection()
		mosDevice = await getMosDevice(mosConnection)

		onMosObjCreate = jest.fn(mosAckReply)
		onMosItemReplace = jest.fn(roAckReply)
		onMosReqSearchableSchema = jest.fn((username: string) => {
			let response: IMOSSearchableSchema = {
				username,
				mosSchema: 'http://example.com/mosSearchableSchema'
			}
			return Promise.resolve(response)
		})
		onMosReqObjectList = jest.fn((options: IMosRequestObjectList) => {
			let response: IMosObjectList = {
				username: options.username,
				queryID: 'A392938329kdakd2039300d0s9l3l9d0bzAQ',
				listReturnStart: 0,
				listReturnEnd: 0,
				listReturnTotal: 0
			}
			return Promise.resolve(response)
		})
		onMosReqObjectAction = jest.fn(mosAckReply)

		mosDevice.onMosObjCreate((obj: IMOSObject) => {
			return onMosObjCreate(obj)
		})
		mosDevice.onMosItemReplace((roID, storyID, item) => {
			return onMosItemReplace(roID, storyID, item)
		})
		mosDevice.onMosReqSearchableSchema((username) => {
			return onMosReqSearchableSchema(username)
		})
		mosDevice.onMosReqObjectList((options: IMosRequestObjectList) => {
			return onMosReqObjectList(options)
		})
		mosDevice.onMosReqObjectAction((action, obj) => {
			return onMosReqObjectAction(action, obj)
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
		onMosObjCreate.mockClear()
		onMosItemReplace.mockClear()
		onMosReqSearchableSchema.mockClear()
		onMosReqObjectList.mockClear()
		onMosReqObjectAction.mockClear()

		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		serverSocketMockQuery.mockClear()
	})
	test('init', async () => {
		expect(mosDevice).toBeTruthy()
		expect(socketMockLower).toBeTruthy()
		expect(socketMockUpper).toBeTruthy()
		expect(socketMockQuery).toBeTruthy()
	})
	test('onMosObjCreate', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.mosObjCreate)
		expect(onMosObjCreate).toHaveBeenCalledTimes(1)
		expect(onMosObjCreate.mock.calls[0][0]).toMatchObject(xmlApiData.mosObjCreate)
		expect(onMosObjCreate.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockLower, messageId, '<mosAck>')
	})
	test('mosObjCreate', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roAck))
		})
		socketMockLower.mockAddReply(mockReply)
		let returnedAck = await mosDevice.mosObjCreate({
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
		expect(onMosItemReplace.mock.calls).toMatchSnapshot()
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
		let returnedAck: IMOSROAck = await mosDevice.mosItemReplace({
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
		expect(onMosReqSearchableSchema.mock.calls).toMatchSnapshot()
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
		let returnedSchema: IMOSSearchableSchema = await mosDevice.mosRequestSearchableSchema('myUsername')

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
		expect(onMosReqObjectList.mock.calls).toMatchSnapshot()
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
		let returnedObjList: IMosObjectList = await mosDevice.mosRequestObjectList({
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
	test('onMosReqObjectAction', async () => {
		let messageId = await fakeIncomingMessage(serverSocketMockQuery, xmlData.mosReqObjAction)
		expect(onMosReqObjectAction).toHaveBeenCalledTimes(1)
		expect(onMosReqObjectAction.mock.calls[0][0]).toMatch('NEW')
		expect(onMosReqObjectAction.mock.calls[0][1]).toMatchObject(xmlApiData.mosObjReqObjAction)
		expect(onMosReqObjectAction.mock.calls).toMatchSnapshot()
		await checkReplyToServer(serverSocketMockQuery, messageId, '<mosAck>')
	})
})

describe('MosDevice: Profile 4', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverMockLower: ServerMock
	let serverMockUpper: ServerMock
	let serverMockQuery: ServerMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onROStory: jest.Mock<any, any>

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		mosConnection = await getMosConnection()
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
	test('onROStory', async () => {
		// Fake incoming message on socket:

		let messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roStorySend)
		expect(onROStory).toHaveBeenCalledTimes(1)

		let o = Object.assign({}, xmlApiData.roStorySend)
		delete o.Body
		expect(onROStory.mock.calls[0][0]).toMatchObject(o)
		expect(onROStory.mock.calls).toMatchSnapshot()
		xmlApiData.roStorySend.Body.forEach((testItem, key) => {
			let item: any
			try {
				item = onROStory.mock.calls[0][0].Body[key]
				if (!testItem.Content) delete testItem.Content

				expect(item).toMatchObject(testItem)
			} catch (e) {
				console.log(key)
				console.log('item', item)
				console.log('testItem', testItem)
				throw e
			}
		})
		await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')

		// expect(onROStory.mock.calls[0][0]).toMatchObject(xmlApiData.roStorySend)
	})
	test('getAllRunningOrders', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			return encode(getXMLReply(messageID, xmlData.roListAll))
		})
		socketMockUpper.mockAddReply(mockReply)
		let returnedListAll = await mosDevice.getAllRunningOrders()
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
