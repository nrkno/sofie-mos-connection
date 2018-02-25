// import {MosConnection} from '../MosConnection'
// import { ConnectionConfig } from '../config/connectionConfig'
import {MosConnection} from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
describe('MosConnection API', () => {
	let mos = new MosConnection(new ConnectionConfig({
		mosID: 'jestMOS',
		acceptsConnections: true,
		profiles: {
			'0': true,
			'1': true
		}
	}))

	test('Public methods', async () => {
		expect(mos.getProfiles()).toMatchObject({
			'0': true,
			'1': true
		})
	})
})

// test('Mos profile 0', async () => {

// 	// Test test:
// 	const mos = new MosConnection( new ConnectionConfig({
// 		mosID: 'testMos',
// 		acceptsConnections: true, // default:true
// 		accepsConnectionsFrom: ['127.0.0.1'],
// 		profiles: {
// 			'0': true,
// 			'1': true
// 		}
// 	}))

// 	expect(mos).toBeInstanceOf(MosConnection)

// 	let onConnection = jest.fn(() => {
// 		// a new connection has been made
// 	})

// 	mos.onConnection(onConnection)

// 	// Connect to ENPS:
// 	await mos.connect({
// 		ncs: {
// 			ncsID: 'MYTESTSERVER',
// 			host: '127.0.0.1'
// 		}
// 		/*ncsBuddy?: {
// 			ncsID: string;
// 			host: string;
// 		},*/
// 	})

// 	expect(onConnection).toHaveBeenCalled()

// 	return 0
// })
