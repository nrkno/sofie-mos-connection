
import {MosConnection} from "../MosConnection"


test('Mos profile 0', async () => {

	// Test test:
	const mos = new MosConnection({
		acceptConnections: true, // default:true
		acceptConnectionFrom: ['127.0.0.1'],
		
		profiles: {
			'0': true,
		}
	});

	expect(mos).toBeInstanceOf(MosConnection);

	var onConnection = jest.fn(() => {
		// a new connection has been made
	});

	mos.onConnection(onConnection);


	// Connect to ENPS:
	await mos.connect({
		ncs: {
			ncsID: "MYTESTSERVER",
			host: "127.0.0.1"
		},
		/*ncsBuddy?: {
			ncsID: string;
			host: string;
		},*/
	})

	expect(onConnection).toHaveBeenCalled();

	return 0;
})