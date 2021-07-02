import { checkMessageSnapshot, clearMocks,
	decode,
	doBeforeAll,
	encode,
	getMosConnection,
	getMosDevice,
	getXMLReply,
	setupMocks
} from './lib'
import {
	IMOSListMachInfo,
	IMOSObject,
	IMOSROAck,
	IMOSROFullStory,
	IMOSRunningOrder,
	MosConnection,
	MosDevice,
	MosString128} from '..'
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

		mosConnection = await getMosConnection({
			'0': true,
			'1': true // Must support at least one other profile
		}, false)
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

		let roAckReply = () => {
			let ack: IMOSROAck = {
				ID: new MosString128('runningOrderId'),
				Status: new MosString128('OK'),
				Stories: []
			}
			return Promise.resolve(ack)
		}
		// Profile 3:
		onRunningOrderStory = jest.fn(roAckReply)

		mosDevice.onRunningOrderStory ((story: IMOSROFullStory): Promise<IMOSROAck> => {
			return onRunningOrderStory(story)
		})
		let b = doBeforeAll()
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

	function chunkSubstr (str: string, size: number) {
		const numChunks = Math.ceil(str.length / size)
		const chunks = new Array(numChunks)

		/* tslint:disable-next-line */
		for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
		  chunks[i] = str.substr(o, size)
		}

		return chunks
	  }

	test('chunks', async () => {
		// Prepare server response
		let mockReply = jest.fn((data: Buffer) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.roList)
			let chunks = chunkSubstr(repl, 500)
			expect(chunks).toHaveLength(4)
			return chunks.map(c => encode(c))
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

	test('chunk around space', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.roList)

			const splitPoint = repl.indexOf('Test MOS')
			expect(splitPoint).not.toEqual(-1)

			const chunks = [
				repl.substr(0, splitPoint + 4),
				repl.substr(splitPoint + 4)
			]
			return chunks.map(c => encode(c))
		})

		socketMockUpper.mockAddReply(mockReply)
		let returnedObj = await mosDevice.sendRequestRunningOrder (xmlApiData.roList.ID!) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()

		// This is what we split in half
		const storySlug = returnedObj.Stories[1].Slug as MosString128
		expect(storySlug).toBeTruthy()
		expect(storySlug.toString()).toEqual('Test MOS')
	})

	test('junk data before', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.roList)

			const padded = '         JUNK DATA   ' + repl
			return encode(padded)
		})

		socketMockUpper.mockAddReply(mockReply)
		let returnedObj = await mosDevice.getRunningOrder(xmlApiData.roList.ID!) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()
	})

	test('junk data packet before', async () => {
		// Prepare server response
		let mockReply = jest.fn((data) => {
			let str = decode(data)
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.roList)

			const chunks = [ '         JUNK DATA   ' , repl]
			return chunks.map(c => encode(c))
		})

		socketMockUpper.mockAddReply(mockReply)
		let returnedObj = await mosDevice.getRunningOrder(xmlApiData.roList.ID!) as IMOSRunningOrder
		await socketMockUpper.mockWaitForSentMessages()
		expect(mockReply).toHaveBeenCalledTimes(1)
		let msg = decode(mockReply.mock.calls[0][0])
		expect(msg).toMatch(/<roReq>/)
		checkMessageSnapshot(msg)
		expect(returnedObj).toMatchObject(xmlApiData.roList2)
		expect(returnedObj).toMatchSnapshot()
	})
})
