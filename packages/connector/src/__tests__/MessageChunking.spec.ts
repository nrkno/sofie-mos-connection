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
import {
	IMOSListMachInfo,
	IMOSObject,
	IMOSROAck,
	IMOSROFullStory,
	IMOSRunningOrder,
	MosConnection,
	MosDevice,
} from '..'
import { SocketMock } from '../__mocks__/socket'
import { xmlData, xmlApiData } from '../__mocks__/testData'

beforeAll(() => {
	setupMocks()
})
beforeEach(() => {
	clearMocks()
})

describe('message chunking', () => {
	let mosDevice: MosDevice
	let mosConnection: MosConnection
	let socketMockLower: SocketMock
	let socketMockUpper: SocketMock

	let serverSocketMockLower: SocketMock
	let serverSocketMockUpper: SocketMock
	let serverSocketMockQuery: SocketMock

	let onRequestMachineInfo: jest.Mock<any, any>
	let onRequestMOSObject: jest.Mock<any, any>
	let onRequestAllMOSObjects: jest.Mock<any, any>

	let onRunningOrderStory: jest.Mock<any, any>

	beforeAll(async () => {
		SocketMock.mockClear()
		// ServerMock.mockClear()

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

		const roAckReply = async () => {
			const ack: IMOSROAck = {
				ID: mosTypes.mosString128.create('runningOrderId'),
				Status: mosTypes.mosString128.create('OK'),
				Stories: [],
			}
			return ack
		}
		// Profile 3:
		onRunningOrderStory = jest.fn(roAckReply)

		mosDevice.onRunningOrderStory(async (story: IMOSROFullStory): Promise<IMOSROAck> => {
			return onRunningOrderStory(story)
		})
		const b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper

		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery
	})
	beforeEach(() => {
		onRunningOrderStory.mockClear()

		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		serverSocketMockQuery.mockClear()
	})
	test('init', async () => {
		expect(mosDevice).toBeTruthy()
		expect(socketMockLower).toBeTruthy()
		expect(socketMockUpper).toBeTruthy()
	})

	function chunkSubstr(str: string, size: number) {
		const numChunks = Math.ceil(str.length / size)
		const chunks = new Array(numChunks)

		/* tslint:disable-next-line */
		for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
			chunks[i] = str.slice(o, o + size)
		}

		return chunks
	}

	test('chunks', async () => {
		// Prepare server response
		const mockReply = jest.fn((data: Buffer) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const repl = getXMLReply(messageID, xmlData.roList)
			const chunks = chunkSubstr(repl, 500)
			expect(chunks).toHaveLength(4)
			return chunks.map((c) => encode(c))
		})

		socketMockUpper.mockAddReply(mockReply)
		if (!xmlApiData.roList.ID) throw new Error(`xmlApiData.roList.ID not set`)
		const returnedObj = (await mosDevice.sendRequestRunningOrder(xmlApiData.roList.ID)) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()
	})

	test('chunk around space', async () => {
		// Prepare server response
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const repl = getXMLReply(messageID, xmlData.roList)

			const splitPoint = repl.indexOf('Test MOS')
			expect(splitPoint).not.toEqual(-1)

			const chunks = [repl.slice(0, splitPoint + 4), repl.slice(splitPoint + 4)]
			return chunks.map((c) => encode(c))
		})

		socketMockUpper.mockAddReply(mockReply)
		if (!xmlApiData.roList.ID) throw new Error(`xmlApiData.roList.ID not set`)
		const returnedObj = (await mosDevice.sendRequestRunningOrder(xmlApiData.roList.ID)) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()

		// This is what we split in half
		const storySlug = mosTypes.mosString128.create(returnedObj.Stories[1].Slug)
		expect(storySlug).toBeTruthy()
		expect(mosTypes.mosString128.stringify(storySlug)).toEqual('Test MOS')
	})

	test('junk data before', async () => {
		// Prepare server response
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const repl = getXMLReply(messageID, xmlData.roList)

			const padded = '         JUNK DATA   ' + repl
			return encode(padded)
		})

		socketMockUpper.mockAddReply(mockReply)
		if (!xmlApiData.roList.ID) throw new Error(`xmlApiData.roList.ID not set`)
		const returnedObj = (await mosDevice.sendRequestRunningOrder(xmlApiData.roList.ID)) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()
	})

	test('junk data packet before', async () => {
		// Prepare server response
		const mockReply = jest.fn((data) => {
			const str = decode(data)
			const messageID = getMessageId(str)
			const repl = getXMLReply(messageID, xmlData.roList)

			const chunks = ['         JUNK DATA   ', repl]
			return chunks.map((c) => encode(c))
		})

		socketMockUpper.mockAddReply(mockReply)
		if (!xmlApiData.roList.ID) throw new Error(`xmlApiData.roList.ID not set`)
		const returnedObj = (await mosDevice.sendRequestRunningOrder(xmlApiData.roList.ID)) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		const msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()
	})
})
