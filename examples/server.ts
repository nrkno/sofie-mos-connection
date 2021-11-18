import { MosConnection, ConnectionConfig } from '../src'

const mos = new MosConnection(
	new ConnectionConfig({
		mosID: 'sofie.tv.automation',
		acceptsConnections: true,
		profiles: {
			'0': true,
			'1': true,
		},
	})
)
mos.init().catch(console.log)
