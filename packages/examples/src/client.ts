import {
	MosConnection,
	ConnectionConfig,
	IMOSROAck,
	IMOSROAction,
	IMOSROReadyToAir,
	IMOSROStory,
	IMOSRunningOrder,
	IMOSStoryAction,
	MosDevice,
	IMOSString128,
} from '@mos-connection/connector'

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

	const mosTypes = mosDevice.mosTypes // Could also be retrieved with getMosTypes(strict)

	let hasSentInit = false

	mosDevice.onConnectionChange((status) => {
		console.log('connection status: ', status)
		if (!hasSentInit) {
			sendInit().catch(console.error)
			hasSentInit = true
		}
	})

	const sendInit = async () => {
		const machineInfo = await mosDevice.requestMachineInfo()
		console.log('Machineinfo', machineInfo)

		const ros = await mosDevice.sendRequestAllRunningOrders()
		console.log('allRunningOrders', ros)

		// trigger a re-send of those running orders:
		// return dev.getRunningOrder(mosTypes.mosString128.create('696297DF-1568-4B36-B43B3B79514B40D4'))

		const roLists = await Promise.all(
			ros.map(async (ro) => {
				return mosDevice.sendRequestRunningOrder(ro.ID)
			})
		)
		console.log('roLists', roLists)
	}
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
	mosDevice.onReadyToAir(async (Action: IMOSROReadyToAir): Promise<IMOSROAck> => {
		console.log('ready to air', Action)
		return {
			ID: Action.ID,
			Status: mosTypes.mosString128.create('OK'),
			Stories: [],
		}
	})

	mosDevice.onCreateRunningOrder(async (ro: IMOSRunningOrder) => {
		console.log('create running order', ro)
		return {
			ID: ro.ID,
			Status: mosTypes.mosString128.create('OK'),
			Stories: [],
		}
	})

	mosDevice.onDeleteRunningOrder(async (RunningOrderID: IMOSString128) => {
		console.log('delete running order', RunningOrderID)
		return {
			ID: RunningOrderID,
			Status: mosTypes.mosString128.create('OK'),
			Stories: [],
		}
	})
	mosDevice.onROInsertStories(async (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
		console.log('insert stories', Action, Stories)
		return {
			ID: Action.StoryID,
			Status: mosTypes.mosString128.create('OK'),
			Stories: [],
		}
	})

	mosDevice.onROMoveStories(async (Action: IMOSStoryAction, Stories: Array<IMOSString128>): Promise<IMOSROAck> => {
		console.log('move stories', Action, Stories)
		return {
			ID: Action.StoryID,
			Status: mosTypes.mosString128.create('OK'),
			Stories: [],
		}
	})

	mosDevice.onRODeleteStories(async (Action: IMOSROAction, Stories: Array<IMOSString128>): Promise<IMOSROAck> => {
		console.log('delete stories', Action, Stories)
		return {
			ID: Action.RunningOrderID,
			Status: mosTypes.mosString128.create('OK'),
			Stories: [],
		}
	})
})

mos.init()
	.then(async (_listening) => {
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
