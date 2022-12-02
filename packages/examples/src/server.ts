import { MosConnection, ConnectionConfig, MosString128, MosTime } from '@mos-connection/connector'

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

	mosDevice.onRequestMachineInfo(async () => {
		return {
			manufacturer: new MosString128('mommy'),
			model: new MosString128('model!'),
			hwRev: new MosString128('0.1'),
			swRev: new MosString128('1.0'),
			DOM: new MosTime('1989-07-01'),
			SN: new MosString128('1234'),
			ID: new MosString128('MY ID'),
			time: new MosTime(Date.now()),
			// opTime?: new MosTime(),
			mosRev: new MosString128('A'),

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
