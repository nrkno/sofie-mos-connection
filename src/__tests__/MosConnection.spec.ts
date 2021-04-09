import { clearMocks,
	decode,
	delay,
	encode,
	getXMLReply,
	initMosConnection,
	setupMocks
} from './lib'
import {
	MosConnection,
	MosDevice,
	IMOSConnectionStatus,
	IMOSObject} from '../'
import { ConnectionConfig } from '../config/connectionConfig'
import { SocketMock } from '../__mocks__/socket'
import { ServerMock } from '../__mocks__/server'
import { xmlData, xmlApiData } from '../__mocks__/testData'

// @ts-ignore imports are unused
import { Socket } from 'net'

beforeAll(() => {
	setupMocks()
})
beforeEach(() => {
	clearMocks()
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

		await mos.dispose()
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
		await initMosConnection(mos)
		expect(mos.isListening).toBe(true)
		expect(SocketMock.instances).toHaveLength(0)

		// close sockets after test
		await mos.dispose()
	})
	test('MosDevice primary', async () => {
		let mos = new MosConnection({
			mosID: 'jestMOS',
			acceptsConnections: true,
			profiles: {
				'0': true,
				'1': true
			}
		})
		expect(mos.acceptsConnections).toBe(true)
		await initMosConnection(mos)
		expect(mos.isListening).toBe(true)

		let mosDevice = await mos.connect({
			primary: {
				id: 'primary',
				host: '192.168.0.1'
			}
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
	test('MosDevice secondary', async () => {
		let mos = new MosConnection({
			mosID: 'jestMOS',
			acceptsConnections: true,
			profiles: {
				'0': true,
				'1': true
			}
		})
		expect(mos.acceptsConnections).toBe(true)
		await initMosConnection(mos)
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
			let messageID = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
			let repl = getXMLReply(messageID, xmlData.mosObj)

			return encode(repl)
		})

		// add reply to secondary server, causes timeout on primary:
		SocketMock.instances[4].mockAddReply(mockReply)
		let returnedObj: IMOSObject = await mosDevice.sendRequestMOSObject(xmlApiData.mosObj.ID!)
		expect(returnedObj).toBeTruthy()

		// add reply to primary server, causes timeout on secondary:
		SocketMock.instances[1].mockAddReply(mockReply)
		returnedObj = await mosDevice.sendRequestMOSObject(xmlApiData.mosObj.ID!)
		expect(returnedObj).toBeTruthy()

		await mos.dispose()
	})
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
		await initMosConnection(mosConnection)

		let mosDevice = await mosConnection.connect({
			primary: {
				id: 'mockServer',
				host: '127.0.0.1',
				timeout: 200
			}
		})
		await delay(10) // to allow for async timers & events to triggered

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(4)
		let connMocks = SocketMock.instances
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

		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: true,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: false
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		connectionStatusChanged.mockClear()

		// @todo: add timeout test
		// mock cause timeout

		await mosConnection.dispose()
	})
	test('buddy failover', async () => {

		let mos = new MosConnection({
			mosID: 'jestMOS',
			acceptsConnections: false,
			profiles: {
				'0': true,
				'1': true
			}
		})
		await initMosConnection(mos)
		let mosDevice: MosDevice = await mos.connect({
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
		})

		expect(mosDevice).toBeTruthy()

		expect(SocketMock.instances).toHaveLength(7)
		let connMocks = SocketMock.instances
		expect(connMocks[1].connect).toHaveBeenCalledTimes(1)
		expect(connMocks[1].connect.mock.calls[0][0]).toEqual(10540)
		expect(connMocks[1].connect.mock.calls[0][1]).toEqual('127.0.0.1')
		expect(connMocks[2].connect).toHaveBeenCalledTimes(1)
		expect(connMocks[2].connect.mock.calls[0][0]).toEqual(10541)
		expect(connMocks[2].connect.mock.calls[0][1]).toEqual('127.0.0.1')

		let connectionStatusChanged = jest.fn()

		let errorReported = jest.fn()
		mos.on('error', errorReported)

		mosDevice.onConnectionChange((connectionStatus: IMOSConnectionStatus) => {
			connectionStatusChanged(connectionStatus)
		})

		await delay(10) // to allow for async timers & events to triggered

		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: true,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: true
			// SecondaryStatus: string // if not connected this will contain human-readable error-message
		})

		connectionStatusChanged.mockClear()

		// test timeout:
		connMocks[1].setReplyToHeartBeat(false)
		connMocks[2].setReplyToHeartBeat(true)

		await delay(600) // to allow for timeout:
		expect(mosDevice.getConnectionStatus()).toMatchObject({
			PrimaryConnected: false,
			PrimaryStatus: '', // if not connected this will contain human-readable error-message
			SecondaryConnected: true,
			SecondaryStatus: '' // if not connected this will contain human-readable error-message
		})

		expect(errorReported).toHaveBeenCalledTimes(1)
		expect(errorReported).nthCalledWith(1, 'primary: Heartbeat error on lower: Error: Command timed out')

		// Test proper dispose:
		await mosDevice.dispose()

		expect(connMocks[1].destroy).toHaveBeenCalledTimes(1)
		expect(connMocks[2].destroy).toHaveBeenCalledTimes(1)

		await mos.dispose()
	})
})
