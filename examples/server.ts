import { MosConnection, ConnectionConfig } from '../src'

let mos = new MosConnection(new ConnectionConfig({
	mosID: 'test2.enps.mos',
	acceptsConnections: true,
	profiles: {
		'0': true,
		'1': true
	}
}))
