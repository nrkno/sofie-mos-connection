import {MosConnection} from '../MosConnection'
import { ConnectionConfig } from '../config/connectionConfig'
describe('MosConnection API', () => {
	let mos = new MosConnection(new ConnectionConfig({
		mosID: 'jestMOS',
		acceptsConnections: false,
		profiles: {
			'0': true,
			'1': true
		}
	}))

	test('Public methods', () => {
		expect(mos.getProfiles()).toMatchObject({
			'0': true,
			'1': true
		})

		expect(mos.getComplianceText()).toBe('MOS Compatible – Profiles 0,1')
	})

	test('Incoming connections', () => {
		mos = new MosConnection(new ConnectionConfig({
			mosID: 'jestMOS',
			acceptsConnections: true,
			profiles: {
				'0': true,
				'1': true
			}
		}))

		if (mos.acceptsConnections) {
			expect(mos.isListening).resolves.toEqual([true, true]).then(result => {
				// CHECK THAT THE PORTS ARE OPEN AND CAN BE CONNCETED TO
			})
		}else {
			expect(mos.isListening).rejects.toBe(false)
		}

		// close sockets after test
		mos.isListening.then(() => mos.dispose())
	})
})
