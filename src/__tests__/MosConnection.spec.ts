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

		expect(mos.getComplianceText()).toBe('MOS Compatible – Profiles 0,1')
	})
})
