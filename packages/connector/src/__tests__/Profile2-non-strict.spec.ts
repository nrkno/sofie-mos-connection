/* eslint-disable @typescript-eslint/unbound-method */
import {
	checkReplyToServer,
	clearMocks,
	decode,
	doBeforeAll,
	encode,
	fakeIncomingMessage,
	fixSnapshot,
	getMessageId,
	getMosConnection,
	getMosDevice,
	getXMLReply,
	mosTypes,
	setupMocks,
} from './lib'
import {
	MosConnection,
	MosDevice,
	IMOSObject,
	IMOSItem,
	IMOSItemAction,
	IMOSItemStatus,
	IMOSROAck,
	IMOSROAction,
	IMOSROReadyToAir,
	IMOSROStory,
	IMOSRunningOrder,
	IMOSRunningOrderBase,
	IMOSRunningOrderStatus,
	IMOSStoryAction,
	IMOSStoryStatus,
	IMOSListMachInfo,
	IMOSString128,
} from '..'
import { SocketMock } from '../__mocks__/socket'
import { ServerMock } from '../__mocks__/server'
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
describe('Profile 2 - non strict', () => {
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

	const mockReplyRoAck = jest.fn((data) => {
		const str = decode(data)
		const messageID = getMessageId(str)
		return encode(getXMLReply(messageID, xmlData.roAck))
	})

	beforeAll(async () => {
		SocketMock.mockClear()
		ServerMock.mockClear()

		mosConnection = await getMosConnection(
			{
				'0': true,
				'1': true,
				'2': true,
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
		onRequestMOSObject = jest.fn()
		onRequestAllMOSObjects = jest.fn()
		mosDevice.onRequestMOSObject(async (objId: string): Promise<IMOSObject | null> => {
			return onRequestMOSObject(objId)
		})
		mosDevice.onRequestAllMOSObjects(async (): Promise<Array<IMOSObject>> => {
			return onRequestAllMOSObjects()
		})

		// Profile 2:
		const roAckReply = async () => {
			const ack: IMOSROAck = {
				ID: mosTypes.mosString128.create('runningOrderId'),
				Status: mosTypes.mosString128.create('OK'),
				Stories: [],
			}
			return ack
		}
		onCreateRunningOrder = jest.fn(roAckReply)
		onReplaceRunningOrder = jest.fn(roAckReply)
		onDeleteRunningOrder = jest.fn(roAckReply)
		onRequestRunningOrder = jest.fn(async () => {
			return xmlApiData.roCreate
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

		mosDevice.onCreateRunningOrder(async (ro: IMOSRunningOrder): Promise<IMOSROAck> => {
			return onCreateRunningOrder(ro)
		})
		mosDevice.onReplaceRunningOrder(async (ro: IMOSRunningOrder): Promise<IMOSROAck> => {
			return onReplaceRunningOrder(ro)
		})
		mosDevice.onDeleteRunningOrder(async (runningOrderId: IMOSString128): Promise<IMOSROAck> => {
			return onDeleteRunningOrder(runningOrderId)
		})
		mosDevice.onRequestRunningOrder(async (runningOrderId: IMOSString128): Promise<IMOSRunningOrder | null> => {
			return onRequestRunningOrder(runningOrderId)
		})
		mosDevice.onMetadataReplace(async (metadata: IMOSRunningOrderBase): Promise<IMOSROAck> => {
			return onMetadataReplace(metadata)
		})
		mosDevice.onRunningOrderStatus(async (status: IMOSRunningOrderStatus): Promise<IMOSROAck> => {
			return onRunningOrderStatus(status)
		})
		mosDevice.onStoryStatus(async (status: IMOSStoryStatus): Promise<IMOSROAck> => {
			return onStoryStatus(status)
		})
		mosDevice.onItemStatus(async (status: IMOSItemStatus): Promise<IMOSROAck> => {
			return onItemStatus(status)
		})
		mosDevice.onReadyToAir(async (Action: IMOSROReadyToAir): Promise<IMOSROAck> => {
			return onReadyToAir(Action)
		})
		mosDevice.onROInsertStories(
			async (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
				return onROInsertStories(Action, Stories)
			}
		)
		mosDevice.onROInsertItems(async (Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> => {
			return onROInsertItems(Action, Items)
		})
		mosDevice.onROReplaceStories(
			async (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
				return onROReplaceStories(Action, Stories)
			}
		)
		mosDevice.onROReplaceItems(async (Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> => {
			return onROReplaceItems(Action, Items)
		})
		mosDevice.onROMoveStories(
			async (Action: IMOSStoryAction, Stories: Array<IMOSString128>): Promise<IMOSROAck> => {
				return onROMoveStories(Action, Stories)
			}
		)
		mosDevice.onROMoveItems(async (Action: IMOSItemAction, Items: Array<IMOSString128>): Promise<IMOSROAck> => {
			return onROMoveItems(Action, Items)
		})
		mosDevice.onRODeleteStories(async (Action: IMOSROAction, Stories: Array<IMOSString128>): Promise<IMOSROAck> => {
			return onRODeleteStories(Action, Stories)
		})
		mosDevice.onRODeleteItems(async (Action: IMOSStoryAction, Items: Array<IMOSString128>): Promise<IMOSROAck> => {
			return onRODeleteItems(Action, Items)
		})
		mosDevice.onROSwapStories(
			async (Action: IMOSROAction, StoryID0: IMOSString128, StoryID1: IMOSString128): Promise<IMOSROAck> => {
				return onROSwapStories(Action, StoryID0, StoryID1)
			}
		)
		mosDevice.onROSwapItems(
			async (Action: IMOSStoryAction, ItemID0: IMOSString128, ItemID1: IMOSString128): Promise<IMOSROAck> => {
				return onROSwapItems(Action, ItemID0, ItemID1)
			}
		)
		const b = doBeforeAll()
		socketMockLower = b.socketMockLower
		socketMockUpper = b.socketMockUpper
		serverSocketMockLower = b.serverSocketMockLower
		serverSocketMockUpper = b.serverSocketMockUpper
		serverSocketMockQuery = b.serverSocketMockQuery

		mosConnection.checkProfileValidness()
		mosDevice.checkProfileValidness()
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

		socketMockLower.mockClear()
		socketMockUpper.mockClear()
		serverSocketMockLower.mockClear()
		serverSocketMockUpper.mockClear()
		serverSocketMockQuery.mockClear()

		mockReplyRoAck.mockClear()
	})
	afterAll(async () => {
		await mosDevice.dispose()
		await mosConnection.dispose()
	})
	describe('deprecated messages', () => {
		// These methods are still supported, but will be removed in future versions of the mos protocol
		test('roStoryMove - missing second <storyID>', async () => {
			// Note: from documentation:
			// https://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS_Protocol_Version_2.8.5_Final.htm#roStoryMove
			// **Note**: If the second <storyID> tag is blank move the story to the bottom of the Running Order.

			// Fake incoming message on socket:
			const messageId = await fakeIncomingMessage(serverSocketMockLower, xmlData.roStoryMove_offspec_missing)
			expect(onROMoveStories).toHaveBeenCalledTimes(1)
			expect(onROMoveStories.mock.calls[0][0]).toEqual(xmlApiData.roElementAction_roStoryMove_blank_action)
			expect(onROMoveStories.mock.calls[0][1]).toEqual(xmlApiData.roElementAction_roStoryMove_stories)
			expect(fixSnapshot(onROMoveStories.mock.calls)).toMatchSnapshot()
			await checkReplyToServer(serverSocketMockLower, messageId, '<roAck>')
		})
	})
})
