import { MosConnection } from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
import { MosDevice } from '../MosDevice'
// @ts-ignore Socket is never read
import { Socket } from 'net'
import { SocketMock } from '../__mocks__/socket'
import { IMOSConnectionStatus } from '../api'

require('iconv-lite').encodingExists('utf16-be')

jest.mock('net')

let setTimeoutOrg = setTimeout
let delay = (ms) => {
	return new Promise((resolve) => {
		setTimeoutOrg(resolve, ms)
	})
}

beforeAll(() => {
	// @ts-ignore Mock
	Socket = SocketMock
	// jest.useFakeTimers()
})
beforeEach(() => {
	SocketMock.mockClear()
})

let testconfig = new ConnectionConfig({
	mosID: 'jestMOS',
	acceptsConnections: false,
	profiles: {
		'0': true,
		'1': true
	}
})

let testoptions = {
	primary: {
		id: 'mockServer',
		host: '127.0.0.1',
		timeout: 200
	}
}
let testoptions2 = {
	primary: {
		id: 'mockServer',
		host: '127.0.0.1',
		timeout: 200
	},
	secondary: {
		id: 'mockServer',
		host: '127.0.0.2',
		timeout: 200
	}
}

// describe('MosDevice', async () => {
	// // @todo: @ojna: fix this?
	// test('Print XML', () => {
	// 	let mos = new MosDevice(testconfig, testoptions, null)
	// 	expect(SocketMock.instances).toHaveLength(1)

	// 	let sock = SocketMock.instances[0]
	// 	sock.mockAddReply("<world>") // vi simulerar ett svar från servern, triggas vid write
	// 	sock.write("test") // vi skickar till server
	// 	sock.mockReceiveMessage("<hello>") // vi tar emot från servern

	// 	expect(mos.messageXMLBlocks.end({ pretty: false })).toEqual('<test>')
	// })
// })

describe('MosDevice: Profile 0', () => {
	test('init and connectionStatusChanged', async () => {
		let mos = new MosConnection(testconfig)
		await mos.init()
		let mosDevice: MosDevice = await mos.connect(testoptions)

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(3)
		// console.log(SocketMock.instances)
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
		// jest.runOnlyPendingTimers()
		await delay(10) // to allow for async timers & events to triggered
		// console.log('-----------')

		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: true,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: false
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		connectionStatusChanged.mockClear()

		// console.log('----------- test timeout')
		// test timeout:
		connMocks[1].setReplyToHeartBeat(false)
		connMocks[2].setReplyToHeartBeat(false)

		// jest.runOnlyPendingTimers() // allow for heartbeats to be sent
		// jest.runOnlyPendingTimers() // allow for heartbeats to be received
		await delay(500) // to allow for timeout:
		// console.log('----------- after timeout')
		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: false,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: false
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		// @todo: add timeout test
		// mock cause timeout
		// expect(connectionStatusChanged).toHaveBeenCalledTimes(1)
		// expect(connectionStatusChanged.mock.calls[0][0]).toMatchObject({PrimaryConnected: false})

		// Test proper dispose:
		await mosDevice.dispose()

		expect(connMocks[1].destroy).toHaveBeenCalledTimes(1)
		expect(connMocks[2].destroy).toHaveBeenCalledTimes(1)
	})
	test('buddy failover', async () => {
		let mos = new MosConnection(testconfig)
		await mos.init()
		let mosDevice: MosDevice = await mos.connect(testoptions2)

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(5)
		// console.log(SocketMock.instances)
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
		// jest.runOnlyPendingTimers()
		await delay(10) // to allow for async timers & events to triggered
		// console.log('-----------')

		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: true,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: true
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		connectionStatusChanged.mockClear()

		// console.log('----------- test timeout')
		// test timeout:
		connMocks[1].setReplyToHeartBeat(false)
		connMocks[2].setReplyToHeartBeat(true)

		// jest.runOnlyPendingTimers() // allow for heartbeats to be sent
		// jest.runOnlyPendingTimers() // allow for heartbeats to be received
		await delay(500) // to allow for timeout:
		// console.log('----------- after timeout')
		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: false,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: true
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		// @todo: add timeout test
		// mock cause timeout
		// expect(connectionStatusChanged).toHaveBeenCalledTimes(1)
		// expect(connectionStatusChanged.mock.calls[0][0]).toMatchObject({PrimaryConnected: false})
		await mosDevice.getAllMOSObjects().catch(() => null)
		expect(false).toBe(true)

		// Test proper dispose:
		await mosDevice.dispose()

		expect(connMocks[1].destroy).toHaveBeenCalledTimes(1)
		expect(connMocks[2].destroy).toHaveBeenCalledTimes(1)
	})
})
