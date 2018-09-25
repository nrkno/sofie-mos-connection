import { ConnectionConfig } from '../connectionConfig'

describe('ConnectionConfig', () => {
	test('new ConnectionConfig', () => {

		const config = new ConnectionConfig({
			mosID: 'test',
			acceptsConnections: true,
			accepsConnectionsFrom: [],
			profiles: {
				'0': true,
				'1': true
			}
			// debug: false,
			// openRelay: true,
			// offspecFailover: false
		})

		expect(config.mosID).toEqual('test')
		expect(config.acceptsConnections).toEqual(true)
		expect(config.accepsConnectionsFrom).toEqual([])
		expect(config.debug).toEqual(false)
		expect(config.openRelay).toEqual(false)
		expect(config.offspecFailover).toEqual(false)
	})
})
