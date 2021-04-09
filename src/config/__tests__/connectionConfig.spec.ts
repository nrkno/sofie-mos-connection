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
		expect(config.debug).toBeFalsy()
		expect(config.openRelay).toBeFalsy()
		expect(config.offspecFailover).toBeFalsy()
	})

	test('invalid ConnectionConfig', () => {

		expect(() => {
			// @ts-ignore
			return new ConnectionConfig(undefined)
		}).toThrowError(/object.*missing/)

		expect(() => {
			// @ts-ignore
			return new ConnectionConfig(1)
		}).toThrowError(/not an object/)

		expect(() => {
			// @ts-ignore
			return new ConnectionConfig({
				mosID: 'test',
				acceptsConnections: true
			})
		}).toThrowError(/profiles.*missing/)

		expect(() => {
			// @ts-ignore
			return new ConnectionConfig({
				mosID: 'test',
				profiles: {
					'0': true,
					'1': true
				}
			})
		}).toThrowError(/acceptsConnections.*missing/)

		expect(() => {
			// @ts-ignore
			return new ConnectionConfig({
				acceptsConnections: true,
				profiles: {
					'0': true,
					'1': true
				}
			})
		}).toThrowError(/mosID.*missing/)

		expect(() => {

			return new ConnectionConfig({
				mosID: 'test',
				acceptsConnections: true,
				// @ts-ignore
				profiles: {
					'1': true
				}
			})
		}).toThrowError(/profile.*0.*mandatory/i)

		expect(() => {
			return new ConnectionConfig({
				mosID: 'test',
				acceptsConnections: true,
				profiles: {
					'0': true
				}
			})
		}).toThrowError(/must support at least one profile/i)
	})
})
