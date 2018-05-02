import { MosConnection } from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
import { MosDevice } from '../MosDevice'
// @ts-ignore Socket is never read
import { Socket } from 'net'
import { SocketMock } from '../__mocks__/socket'
import { IMOSConnectionStatus } from '../api'

require('iconv-lite').encodingExists('utf16-be')

jest.mock('net')

beforeAll(() => {
	// @ts-ignore Mock
	Socket = SocketMock
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

		let mosDevice = await mos.connect(testoptions)

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
