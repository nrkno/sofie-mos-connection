import { MosDevice } from '../MosDevice'
import { Socket } from 'net'
import { SocketMock } from '../__mocks__/socket'

let testdata = {
	primary: {
		id: 'test',
		host: 'test.com'
	}
}

describe('MosDevice', () => {
	test('Print XML', () => {
		let mos = new MosDevice(testdata)
		expect(mos.messageXMLBlocks.end({ pretty: true })).toEqual('<test>')
	})
})
