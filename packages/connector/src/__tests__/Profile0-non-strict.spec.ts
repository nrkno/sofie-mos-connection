import {
	checkMessageSnapshot,
	clearMocks,
	decode,
	doBeforeAll,
	encode,
	getMessageId,
	getMosConnection,
	getMosDevice,
	getXMLReply,
	mosTypes,
	setupMocks,
} from './lib'
import { MosConnection, MosDevice, IMOSObject, IMOSListMachInfo } from '..'
import { SocketMock } from '../__mocks__/socket'
import { xmlData, xmlApiData } from '../__mocks__/testData'

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-ignore imports are unused
import { Socket } from 'net'
/* eslint-enable @typescript-eslint/no-unused-vars */

beforeAll(() => {
	setupMocks()
})
beforeEach(() => {
	clearMocks()
})
describe('Profile 0 - non strict', () => {
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
		mosConnection = await getMosConnection(
			{
				'0': true,
				'1': true, // Must support at least one other profile
			},
			false
		)
		mosDevice = await getMosDevice(mosConnection)

		// Profile 0:
		onRequestMachineInfo = jest.fn(async () => {
			return xmlApiData.machineInfo
		})
		mosDevice.onRequestMachineInfo(async (): Promise<IMOSListMachInfo> => {
			return onRequestMachineInfo()
		})
		// Profile 1:
		onRequestMOSObject = jest.fn(async () => {
			return xmlApiData.mosObj
		})
		onRequestAllMOSObjects = jest.fn(async () => {
			return [xmlApiData.mosObj, xmlApiData.mosObj2]
		})
		mosDevice.onRequestMOSObject(async (objId: string): Promise<IMOSObject | null> => {
			return onRequestMOSObject(objId)
		})
		mosDevice.onRequestAllMOSObjects(async (): Promise<Array<IMOSObject>> => {
			return onRequestAllMOSObjects()
		})
		const b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		socketMockQuery = b.socketMockQuery
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery

		mosDevice.checkProfileValidness()
		mosConnection.checkProfileValidness()
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
	test('requestMachineInfo - missing <time>', async () => {
		// Prepare mock server response:
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const replyMessage = xmlData.machineInfo.replace(/<time>.*<\/time>/, '')
			const repl = getXMLReply(messageID, replyMessage)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		if (!xmlApiData.mosObj.ID) throw new Error('xmlApiData.mosObj.ID not set')

		const returnedMachineInfo: IMOSListMachInfo = await mosDevice.requestMachineInfo()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<reqMachInfo\/>/)
		checkMessageSnapshot(msg)

		const replyMessage = { ...xmlApiData.machineInfoReply }
		replyMessage.time = mosTypes.mosTime.fallback()

		expect(returnedMachineInfo).toMatchObject(replyMessage)
		// expect(returnedMachineInfo.opTime).toBeUndefined()
	})
	test('requestMachineInfo - empty <time>', async () => {
		// Prepare mock server response:
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const replyMessage = xmlData.machineInfo.replace(/<time>.*<\/time>/, '<time></time>')
			const repl = getXMLReply(messageID, replyMessage)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		if (!xmlApiData.mosObj.ID) throw new Error('xmlApiData.mosObj.ID not set')

		const returnedMachineInfo: IMOSListMachInfo = await mosDevice.requestMachineInfo()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<reqMachInfo\/>/)
		checkMessageSnapshot(msg)

		const replyMessage = { ...xmlApiData.machineInfoReply }
		replyMessage.time = mosTypes.mosTime.fallback()

		expect(returnedMachineInfo).toMatchObject(replyMessage)
		// expect(returnedMachineInfo.opTime).toBeUndefined()
	})
	test('requestMachineInfo - bad formatted <time>', async () => {
		// Prepare mock server response:
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const replyMessage = xmlData.machineInfo.replace(/<time>.*<\/time>/, '<time>BAD DATA</time>')
			const repl = getXMLReply(messageID, replyMessage)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		if (!xmlApiData.mosObj.ID) throw new Error('xmlApiData.mosObj.ID not set')

		let caughtError: Error | undefined = undefined
		await mosDevice.requestMachineInfo().catch((err) => {
			caughtError = err
		})
		expect(mockReply).toHaveBeenCalledTimes(1)

		expect(String(caughtError)).toMatch(/error when parsing reply.*Invalid timestamp/i)
	})
	test('requestMachineInfo - missing <opTime>', async () => {
		// Prepare mock server response:
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const replyMessage = xmlData.machineInfo.replace(/<opTime>.*<\/opTime>/, '')
			const repl = getXMLReply(getMessageId(str), replyMessage)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		if (!xmlApiData.mosObj.ID) throw new Error('xmlApiData.mosObj.ID not set')

		const returnedMachineInfo: IMOSListMachInfo = await mosDevice.requestMachineInfo()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<reqMachInfo\/>/)
		checkMessageSnapshot(msg)

		const replyMessage = { ...xmlApiData.machineInfoReply }
		replyMessage.opTime = undefined

		expect(returnedMachineInfo).toMatchObject(replyMessage)
		expect(returnedMachineInfo.opTime).toBeUndefined()
	})
	test('requestMachineInfo - empty <opTime>', async () => {
		// Prepare mock server response:
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const replyMessage = xmlData.machineInfo.replace(/<opTime>.*<\/opTime>/, '<opTime></opTime>')
			const repl = getXMLReply(getMessageId(str), replyMessage)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		if (!xmlApiData.mosObj.ID) throw new Error('xmlApiData.mosObj.ID not set')

		const returnedMachineInfo: IMOSListMachInfo = await mosDevice.requestMachineInfo()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<reqMachInfo\/>/)
		checkMessageSnapshot(msg)

		const replyMessage = { ...xmlApiData.machineInfoReply }
		replyMessage.opTime = undefined

		expect(returnedMachineInfo).toMatchObject(replyMessage)
		expect(returnedMachineInfo.opTime).toBeUndefined()
	})
	test('requestMachineInfo - bad formatted <opTime>', async () => {
		// Prepare mock server response:
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const replyMessage = xmlData.machineInfo.replace(/<opTime>.*<\/opTime>/, '<opTime>>BAD DATA</opTime>')
			const repl = getXMLReply(messageID, replyMessage)
			return encode(repl)
		})
		socketMockLower.mockAddReply(mockReply)
		if (!xmlApiData.mosObj.ID) throw new Error('xmlApiData.mosObj.ID not set')

		let caughtError: Error | undefined = undefined
		await mosDevice.requestMachineInfo().catch((err) => {
			caughtError = err
		})
		expect(mockReply).toHaveBeenCalledTimes(1)

		expect(String(caughtError)).toMatch(/error when parsing reply.*Invalid timestamp/i)
	})
})
