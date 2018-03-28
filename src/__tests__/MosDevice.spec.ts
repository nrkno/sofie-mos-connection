import { MosConnection } from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
import { MosDevice } from '../MosDevice'
import { Socket } from 'net'
import { SocketMock } from '../__mocks__/socket'

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

describe('MosDevice', () => {
	test('Print XML', () => {
		let socket = new SocketMock()
		let mos = new MosDevice(socket, testconfig, testoptions)
		socket.write('<test>', () => {
			console.log(this)
		})
		expect(mos.messageXMLBlocks.end({ pretty: true })).toEqual('<test>')
	})
})

describe('MosDevice: Profile 0', () => {
	test('init and connectionStatusChanged', async () => {
		let mos = new MosConnection(testconfig)

		let mosDevice = await mos.connect(testoptions)

		expect(mosDevice).toBeTruthy()

		/*expect(SocketMock.instances).toHaveLength(1)
		let connMock = SocketMock.instances[0]
		expect(connMock.connect).toHaveBeenCalledTimes(1)
		expect(connMock.connect.mock.calls[0][0]).toEqual('127.0.0.1')

		let connectionStatusChanged = jest.fn()

		mosDevice.onConnectionChange((connectionStatus: IMOSConnectionStatus) => {
			connectionStatusChanged(connectionStatus)
		})

		expect(connectionStatusChanged).toHaveBeenCalledTimes(1) // dunno if it really should have been called, maybe remove

		expect(mosDevice.getConnectionStatus()).toEqual(true)

		connectionStatusChanged.mockClear()*/

		// @todo: add timeout test
		// mock cause timeout
		// expect(connectionStatusChanged).toHaveBeenCalledTimes(1)
		// expect(connectionStatusChanged.mock.calls[0][0]).toMatchObject({PrimaryConnected: false})
	})
})

