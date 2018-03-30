import { MosConnection } from './MosConnection'
import { ConnectionConfig } from './config/connectionConfig'

let mos = new MosConnection(new ConnectionConfig({
	mosID: 'jestMOS',
	acceptsConnections: true,
	profiles: {
		'0': true,
		'1': true
	}
}))
