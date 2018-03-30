import { MosConnection, ConnectionConfig } from '../src'

let mos = new MosConnection(new ConnectionConfig({
	mosID: 'jestMOS',
	acceptsConnections: false,
	profiles: {
		'0': true,
		'1': true
	}
}))

let mosdev = mos.connect({
	primary: {
		id: '2012R2ENPS8VM',
		host: '10.0.1.248',
		timeout: 200
	}
})
