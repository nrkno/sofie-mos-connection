import {
	MosConnection,
	ConnectionConfig,
	IMOSROAck,
	IMOSROAction,
	IMOSROReadyToAir,
	IMOSROStory,
	IMOSRunningOrder,
	IMOSStoryAction,
	MosString128,
	MosTime,
} from '../src'

import { MosDevice } from '../src/MosDevice'
const mos = new MosConnection(
	new ConnectionConfig({
		mosID: 'sofie.client.tv.automation',
		acceptsConnections: true,
		profiles: {
			'0': true,
			'1': true,
		},
		openRelay: true,
		debug: false,
	})
)
// mos.on('rawMessage', (_source, _type, _message) => {
// 	console.log('rawMessage', _source, _type, _message)
// })
mos.on('error', (err) => {
	console.log('MosConnection emitted error', err, err.stack)
})
mos.onConnection((mosDevice: MosDevice) => {
	console.log('new mosDevice: ', mosDevice.idPrimary, mosDevice.idSecondary)
	// console.log(dev)

	let hasSentInit = false

	mosDevice.onConnectionChange((status) => {
		console.log('connection status: ', status)
		if (!hasSentInit) {
			sendInit()
			hasSentInit = true
		}
	})

	const sendInit = () => {
		mosDevice
			.requestMachineInfo()
			.then((_lm) => {
				// console.log('Machineinfo', _lm)
			})
			.then(() => {
				return mosDevice.sendRequestAllRunningOrders()
			})
			.then((ros) => {
				console.log('allRunningOrders', ros)

				// trigger a re-send of those running orders:
				// return dev.getRunningOrder(new MosString128('696297DF-1568-4B36-B43B3B79514B40D4'))
				return Promise.all(
					ros.map((ro) => {
						return mosDevice.getRunningOrder(ro.ID)
					})
				)
			})
			.then((roLists) => {
				console.log('roLists', roLists)
			})
			.catch((e) => {
				console.log('ERROR', e)
			})
	}
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
	mosDevice.onReadyToAir(async (Action: IMOSROReadyToAir): Promise<IMOSROAck> => {
		console.log('ready to air', Action)
		return {
			ID: Action.ID,
			Status: new MosString128('OK'),
			Stories: [],
		}
	})

	mosDevice.onCreateRunningOrder(async (ro: IMOSRunningOrder) => {
		console.log('create running order', ro)
		return {
			ID: ro.ID,
			Status: new MosString128('OK'),
			Stories: [],
		}
	})

	mosDevice.onDeleteRunningOrder(async (RunningOrderID: MosString128) => {
		console.log('delete running order', RunningOrderID)
		return {
			ID: RunningOrderID,
			Status: new MosString128('OK'),
			Stories: [],
		}
	})
	mosDevice.onROInsertStories(async (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
		console.log('insert stories', Action, Stories)
		return {
			ID: Action.StoryID,
			Status: new MosString128('OK'),
			Stories: [],
		}
	})

	mosDevice.onROMoveStories(async (Action: IMOSStoryAction, Stories: Array<MosString128>): Promise<IMOSROAck> => {
		console.log('move stories', Action, Stories)
		return {
			ID: Action.StoryID,
			Status: new MosString128('OK'),
			Stories: [],
		}
	})

	mosDevice.onRODeleteStories(async (Action: IMOSROAction, Stories: Array<MosString128>): Promise<IMOSROAck> => {
		console.log('delete stories', Action, Stories)
		return {
			ID: Action.RunningOrderID,
			Status: new MosString128('OK'),
			Stories: [],
		}
	})
})

mos.init()
	.then((_listening) => {
		return mos.connect({
			primary: {
				id: 'sofie.server.tv.automation',
				host: '127.0.0.1',
				timeout: 100000,
				// To connect to a server on custom ports:
				// ports: {
				// 	lower: 11540,
				// 	upper: 11541,
				// 	query: 11542,
				// },
			},
		})
	})
	.catch((e) => {
		console.log(e)
	})
