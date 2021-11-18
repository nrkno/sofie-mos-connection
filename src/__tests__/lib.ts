import { IMOSAck, MosConnection, MosDevice, IMOSROAck, IProfiles, MosTime } from '../'

import { SocketMock } from '../__mocks__/socket'
import { IServerMock, ServerMock } from '../__mocks__/server'
// @ts-ignore imports are unused
import { Socket, Server } from 'net'

import * as iconv from 'iconv-lite'
iconv.encodingExists('utf16-be')

// breaks net.Server, disabled for now
jest.mock('net')

export function setupMocks(): void {
	// Mock tcp connection
	/* eslint-disable @typescript-eslint/no-unused-vars */
	// @ts-ignore Replace Socket with the mocked varaint:
	Socket = SocketMock
	// @ts-ignore Replace Server with the mocked varaint:
	Server = ServerMock

	/* eslint-enable @typescript-eslint/no-unused-vars */
}

export function clearMocks(): void {
	SocketMock.mockClear()
}

export function getMessageId(str: string): string {
	const m = str.match(/<messageID>([^<]+)<\/messageID>/)
	const messageID = m ? m[1] : undefined
	if (!messageID) throw new Error(`No messageID in "${str}"`)

	return messageID
}

const setTimeoutOrg = setTimeout
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeoutOrg(resolve, ms)
	})
}
export async function initMosConnection(mos: MosConnection): Promise<void> {
	mos.on('error', (err) => {
		if (!(err + '').match(/heartbeat/i)) {
			console.error(err)
		}
	})
	await mos.init()
}

export async function getMosConnection(profiles: IProfiles, strict: boolean): Promise<MosConnection> {
	ServerMock.mockClear()

	const mos = new MosConnection({
		mosID: 'our.mos.id',
		acceptsConnections: true,
		profiles: profiles,
		strict: strict,
		debug: false,
	})
	await initMosConnection(mos)

	expect(ServerMock.instances).toHaveLength(3)

	return Promise.resolve(mos)
}
export async function getMosDevice(mos: MosConnection): Promise<MosDevice> {
	SocketMock.mockClear()

	const device = await mos.connect({
		primary: {
			id: 'their.mos.id',
			host: '127.0.0.1',
			timeout: 200,
		},
	})

	await delay(10) // to allow for async timers & events to triggered

	return Promise.resolve(device)
}
let fakeIncomingMessageMessageId = 1632
export function fakeIncomingMessage(
	socketMockLower: SocketMock,
	message: string,
	ourMosId?: string,
	theirMosId?: string
): Promise<number> {
	fakeIncomingMessageMessageId++
	const fullMessage = getXMLReply(fakeIncomingMessageMessageId, message, ourMosId, theirMosId)
	socketMockLower.mockReceiveMessage(encode(fullMessage))

	return Promise.resolve(fakeIncomingMessageMessageId)
}
export function getXMLReply(
	messageId: string | number,
	content: string,
	ourMosId?: string,
	theirMosId?: string
): string {
	return (
		'<mos>' +
		'<mosID>' +
		(ourMosId || 'our.mos.id') +
		'</mosID>' +
		'<ncsID>' +
		(theirMosId || 'their.mos.id') +
		'</ncsID>' +
		'<messageID>' +
		messageId +
		'</messageID>' +
		content +
		'</mos>\r\n'
	)
}
export function decode(data: Buffer): string {
	return iconv.decode(data, 'utf16-be')
}
export function encode(str: string): Buffer {
	return iconv.encode(str, 'utf16-be')
}
export async function checkReplyToServer(socket: SocketMock, messageId: number, replyString: string): Promise<void> {
	// check reply to server:
	await socket.mockWaitForSentMessages()

	expect(socket.mockSentMessage).toHaveBeenCalledTimes(1)
	// @ts-ignore mock
	const reply = decode(socket.mockSentMessage.mock.calls[0][0])
	expect(reply).toContain('<messageID>' + messageId + '</messageID>')
	expect(reply).toContain(replyString)
	expect(reply).toMatchSnapshot(reply)
}
export function checkMessageSnapshot(msg: string): void {
	expect(
		msg
			.replace(/<messageID>\d+<\/messageID>/, '<messageID>xx</messageID>')
			.replace(/<time>[^<>]+<\/time>/, '<time>xx</time>')
	).toMatchSnapshot()
}
export function checkAckSnapshot(ack: IMOSAck | IMOSROAck): void {
	const ack2: any = {
		...ack,
	}
	if (ack2.mos) {
		ack2.mos = {
			...ack2.mos,
			messageID: 999,
		}
	}
	expect(ack2).toMatchSnapshot()
}
export function doBeforeAll(): {
	socketMockLower: SocketMock
	socketMockUpper: SocketMock
	socketMockQuery: SocketMock
	serverMockLower: IServerMock
	serverMockUpper: IServerMock
	serverMockQuery: IServerMock
	serverSocketMockLower: SocketMock
	serverSocketMockUpper: SocketMock
	serverSocketMockQuery: SocketMock
} {
	const socketMockLower = SocketMock.instances.find((s) => s.connectedPort === 10540) as SocketMock
	const socketMockUpper = SocketMock.instances.find((s) => s.connectedPort === 10541) as SocketMock
	const socketMockQuery = SocketMock.instances.find((s) => s.connectedPort === 10542) as SocketMock

	expect(socketMockLower).toBeTruthy()
	expect(socketMockUpper).toBeTruthy()
	expect(socketMockQuery).toBeTruthy()

	expect(ServerMock.instances).toHaveLength(3)

	const serverMockLower = ServerMock.instances[0]
	const serverMockUpper = ServerMock.instances[2]
	const serverMockQuery = ServerMock.instances[1]
	expect(serverMockLower).toBeTruthy()
	expect(serverMockUpper).toBeTruthy()
	expect(serverMockQuery).toBeTruthy()

	// Pretend a server connects to us:
	const serverSocketMockLower = serverMockLower.mockNewConnection()
	const serverSocketMockUpper = serverMockUpper.mockNewConnection()
	const serverSocketMockQuery = serverMockQuery.mockNewConnection()

	socketMockLower.name = 'lower'
	socketMockUpper.name = 'upper'
	socketMockQuery.name = 'query'

	serverSocketMockLower.name = 'serverLower'
	serverSocketMockUpper.name = 'serverUpper'
	serverSocketMockQuery.name = 'serverQuery'

	return {
		socketMockLower,
		socketMockUpper,
		socketMockQuery,
		serverMockLower,
		serverMockUpper,
		serverMockQuery,
		serverSocketMockLower,
		serverSocketMockUpper,
		serverSocketMockQuery,
	}
}

export function fixSnapshot(data: unknown): any {
	return fixSnapshotInner(data)[1]
}
function fixSnapshotInner(data: any): [boolean, any] {
	let changed = false

	if (!data) {
		return [false, data]
	} else if (Array.isArray(data)) {
		for (const key in data) {
			const f = fixSnapshotInner(data[key])
			if (f[0]) {
				changed = true
				data[key] = f[1]
			}
		}
	} else if (typeof data === 'object') {
		if (data instanceof MosTime) {
			if (data.getTime() > 1609459200000) {
				// 2021-01-01 00:00:00+00:00
				// data.setTime(1609459200000)
				return [true, new MosTime(1609459200000)]
			}
			// changed = true
		} else {
			for (const [key, value] of Object.entries(data)) {
				const f = fixSnapshotInner(value)
				if (f[0]) {
					changed = true
					data[key] = f[1]
				}
			}
		}
	} else {
		// nothing
	}
	return [changed, data]
}
