import { MosConnection, ConnectionConfig } from '@mos-connection/connector'

const mos = new MosConnection(
	new ConnectionConfig({
		mosID: 'sofie.server.tv.automation',
		acceptsConnections: true,
		openRelay: true,
		profiles: {
			'0': true,
			'1': true,
		},
		// To start the server on custom ports:
		// ports: {
		// 	lower: 11540,
		// 	upper: 11541,
		// 	query: 11542,
		// },
		debug: false,
	})
)
mos.on('error', (err) => {
	console.log('MosConnection emitted error', err, err.stack)
})
mos.onConnection((mosDevice) => {
	console.log('A new Mosdevice connected')

	const mosTypes = mosDevice.mosTypes // Could also be retrieved with getMosTypes(strict)

	mosDevice.onRequestMachineInfo(async () => {
		return {
			manufacturer: mosTypes.mosString128.create('mommy'),
			model: mosTypes.mosString128.create('model!'),
			hwRev: mosTypes.mosString128.create('0.1'),
			swRev: mosTypes.mosString128.create('1.0'),
			DOM: mosTypes.mosTime.create('1989-07-01'),
			SN: mosTypes.mosString128.create('1234'),
			ID: mosTypes.mosString128.create('MY ID'),
			time: mosTypes.mosTime.create(Date.now()),
			// opTime?: mosTypes.mosTime.create(),
			mosRev: mosTypes.mosString128.create('A'),

			supportedProfiles: {
				deviceType: 'MOS',
				profile0: true,
			},
		}
	})
	mosDevice.onRequestAllRunningOrders(async () => {
		return []
	})
})
mos.init()
	.then(() => console.log('initialized'))
	.catch(console.log)
