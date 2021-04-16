import { clearMocks,
	delay,
	doBeforeAll,
	fakeIncomingMessage,
	getMosConnection,
	getMosDevice,
	setupMocks
} from './lib'
import {
	MosConnection,
	MosDevice,
	IMOSObject,
	IMOSListMachInfo
} from '..'
import { SocketMock } from '../__mocks__/socket'
import { xmlData, xmlApiData } from '../__mocks__/testData'

// @ts-ignore imports are unused
import { Socket } from 'net'

beforeAll(() => {
	setupMocks()
})
beforeEach(() => {
	clearMocks()
})
describe('Profile 0', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection

	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock
	let socketMockQuery: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMachineInfo: jest.Mock<any, any>
	let onRequestMOSObject: jest.Mock<any, any>
	let onRequestAllMOSObjects: jest.Mock<any, any>

	beforeAll(async () => {

		mosConnection = await getMosConnection({
			'0': true,
			'1': true // Must support at least one other profile
		}, true)
		mosDevice = await getMosDevice(mosConnection)

		// Profile 0:
		onRequestMachineInfo = jest.fn(() => {
			return Promise.resolve(xmlApiData.machineInfo)
		})
		mosDevice.onRequestMachineInfo((): Promise<IMOSListMachInfo> => {
			return onRequestMachineInfo()
		})
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
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
	})
	afterAll(async () => {
		await mosDevice.dispose()
		await mosConnection.dispose()
	})
	beforeEach(() => {
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
	// TODO: reqMachInfo
	// TODO: listMachInfo
})
