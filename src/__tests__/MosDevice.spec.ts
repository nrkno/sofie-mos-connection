import { MosConnection } from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
import { MosDevice } from '../MosDevice'
import { Socket } from 'net'
import { SocketMock } from '../__mocks__/socket'

jest.mock('net')

beforeAll(() => {
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

describe('MosDevice', async () => {
	test.only('Print XML', () => {
		let mos = new MosDevice(testconfig, testoptions)
		expect(SocketMock.instances).toHaveLength(1)

		let sock = SocketMock.instances[0]
		sock.mockAddReply("<world>") // vi simulerar ett svar från servern, triggas vid write
		sock.write("test") // vi skickar till server
		sock.mockReceiveMessage("<hello>") // vi tar emot från servern

		expect(mos.messageXMLBlocks.end({ pretty: false })).toEqual('<test>')
	})
})

describe('MosDevice: Profile 0', () => {
	test('init and connectionStatusChanged', async () => {
		let mos = new MosConnection(testconfig)

		let mosDevice = await mos.connect(testoptions)

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(1)
		let connMock = SocketMock.instances[0]
		expect(connMock.connect).toHaveBeenCalledTimes(1)
		expect(connMock.connect.mock.calls[0][0]).toEqual('127.0.0.1')

		let connectionStatusChanged = jest.fn()

		mosDevice.onConnectionChange((connectionStatus: IMOSConnectionStatus) => {
			connectionStatusChanged(connectionStatus)
		})

		expect(connectionStatusChanged).toHaveBeenCalledTimes(1) // dunno if it really should have been called, maybe remove

		expect(mosDevice.getConnectionStatus()).toEqual(true)

		connectionStatusChanged.mockClear()

		// @todo: add timeout test
		// mock cause timeout
		// expect(connectionStatusChanged).toHaveBeenCalledTimes(1)
		// expect(connectionStatusChanged.mock.calls[0][0]).toMatchObject({PrimaryConnected: false})
	})
})

