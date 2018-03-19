import { MosConnection } from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
import { IMOSConnectionStatus, IMOSDevice, IMOSObject, IMOSObjectType, IMOSObjectStatus, IMOSObjectAirStatus, IMOSObjectPathType } from '../api';
import { MosTime } from '../dataTypes/mosTime';
import { MosString128 } from '../dataTypes/mosString128';
import { Socket } from 'net'

import { SocketMock } from '../__mocks__/socket'

function getMosDevice (): Promise<IMOSDevice> {
	let mos = new MosConnection(new ConnectionConfig({
		mosID: 'jestMOS',
		acceptsConnections: false,
		profiles: {
			'0': true,
			'1': true
		}
	}))

	return mos.connect({
		primary: {
			id: 'mockServer',
			host: '127.0.0.1',
			timeout: 200
		}
	})
}
let messageId = 0
function fakeIncomingMessage (message: string): Promise<void> {
	let fullMessage = '<mos>' +
		'<mosID>aircache.newscenter.com</mosID>' +
		'<ncsID>ncs.newscenter.com</ncsID>' +
		'<messageID>' + (messageId++) + '</messageID>' +
		message +
		'</mos>'

	// @todo: implement mock:
	// return socketMock.incomingMessage(fullMessage)
	return Promise.resolve()
}
function getMosObj (): IMOSObject {
	return {
		ID: new MosString128('abc123'),
		Slug: new MosString128('Just another test'),
		Type: IMOSObjectType.VIDEO,
		TimeBase: 25, // fps
		Revision: 1,
		Duration: 328, // frames,
		Status: IMOSObjectStatus.READY,
		AirStatus: IMOSObjectAirStatus.READY,
		Paths: [{
			Type: IMOSObjectPathType.PATH,
			Description: 'Media path',
			Target: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
		}],
		CreatedBy: new MosString128('R.A'),
		Created: new MosTime(536457600000),
		Description: ''
	}
}
let socketMock: SocketMock

jest.mock('net')

beforeAll(() => {
	// @todo: mock tcp connection
	// socketMock = class Socket extends EventEmitter {}
	// Socket = socketMock

	// Socket = SocketMock
	// console.log('a', Socket)

	// @ts-ignore
	// Replace Socket with the mocked varaint:
	Socket = SocketMock
	/*
	console.log('a')
	Socket.constructor = () => {
		return new SocketMock()
	}
	*/
})
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
	connMock.mockReceiveMessage('hello')

	expect(onData).toHaveBeenCalledTimes(1)

	// Send some data:
	conn.write('hello!')

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
		'1': true
	})

	// expect(mos.complianceText).toBe('MOS Compatible – Profiles 0,1')
})

test('Incoming connections', () => {
	let mos = new MosConnection(new ConnectionConfig({
		mosID: 'jestMOS',
		acceptsConnections: false,
		profiles: {
			'0': true,
			'1': true
		}
	}))

	if (mos.acceptsConnections) {
		expect(mos.isListening).resolves.toEqual([true, true]).then(result => {
			// CHECK THAT THE PORTS ARE OPEN AND CAN BE CONNCETED TO
		})
	} else {
		expect(mos.isListening).rejects.toBe('Mos connection is not listening for connections. "Config.acceptsConnections" is "false"')
	}

	// close sockets after test
	mos.isListening
		.then(() => mos.dispose())
		.catch(() => mos.dispose())
})

test('MosDevice: Profile 0', async () => {
	let mos = new MosConnection(new ConnectionConfig({
		mosID: 'jestMOS',
		acceptsConnections: false,
		profiles: {
			'0': true,
			'1': true
		}
	}))

	let mosDevice = await mos.connect({
		primary: {
			id: 'mockServer',
			host: '127.0.0.1',
			timeout: 200
		}
	})

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

test('MosDevice: Profile 1', async () => {

	let mosDevice = await getMosDevice()

	let onRequestMOSObject = jest.fn()
	let onRequestAllMOSObjects = jest.fn()

	mosDevice.onRequestMOSObject ((objId: string): Promise<IMOSObject | null> => {
		return onRequestMOSObject(objId)
	})
	mosDevice.onRequestAllMOSObjects ((): Promise<Array<IMOSObject>> => {
		return onRequestAllMOSObjects()
	})

	let mosObj = getMosObj()

	// Test onRequestMOSObject:
	onRequestMOSObject.mockClear()
	onRequestAllMOSObjects.mockClear()

	onRequestMOSObject.mockReturnValueOnce(Promise.resolve(mosObj))
	// Fake incoming message on socket:
	await fakeIncomingMessage('<mosReqObj><objID>' + mosObj.ID + '</objID></mosReqObj>')

	expect(onRequestMOSObject).toHaveBeenCalledTimes(1)
	expect(onRequestMOSObject.mock.calls[0][0]).toEqual(mosObj.ID)
	expect(onRequestAllMOSObjects).toHaveBeenCalledTimes(0)

	// Test onRequestAllMOSObjects:
	onRequestMOSObject.mockClear()
	onRequestAllMOSObjects.mockClear()
	onRequestAllMOSObjects.mockReturnValueOnce(Promise.resolve([mosObj]))
	// Fake incoming message on socket:
	await fakeIncomingMessage('<mosReqObj><objID>' + mosObj.ID + '</objID></mosReqObj>')

	expect(onRequestAllMOSObjects).toHaveBeenCalledTimes(1)
	expect(onRequestMOSObject).toHaveBeenCalledTimes(0)
	// expect(socketMock.mock.receivedMessages).toHaveBeenCalledTimes(1)
	expect(socketMock.mock.receivedMessages.calls[0][0]).toMatch(new RegExp('mosListAll.+mosObj.+<objID>' + mosObj.ID))

	// mosDevice.getMOSObject?: (objId: string) => Promise<IMOSObject>
	// mosDevice.getAllMOSObjects?: () => Promise<Array<IMOSObject>>

})


