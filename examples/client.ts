import { MosConnection, ConnectionConfig, MosString128, IMOSROAck, IMOSROReadyToAir, IMOSRunningOrder, IMOSStoryAction, IMOSROStory } from '../src'

let mos = new MosConnection(new ConnectionConfig({
	mosID: 'test2.enps.mos',
	acceptsConnections: true,
	profiles: {
		'0': true,
		'1': true
	},
	openRelay: true,
	// debug: true
}))

let mosdev = mos.connect({
	primary: {
		id: '2012R2ENPS8VM',
		host: '10.0.1.248',
		timeout: 5000
	}
}).then((dev) => {
	dev.getMachineInfo().then((lm) => {
		console.log('Machineinfo', lm)
	})

	dev.onReadyToAir((Action: IMOSROReadyToAir): Promise<IMOSROAck> => {
		console.log('dev.onReadyToAir')
		return new Promise((resolve) => {
			resolve({
				ID: Action.ID,
				Status: new MosString128('OK'),
				Stories: []
			})
		})
	})

	dev.onCreateRunningOrder((ro: IMOSRunningOrder) => {
		return new Promise((resolve, reject) => {
			console.log('onCreateRunningOrder', ro)
			resolve({
				ID: ro.ID,
				Status: new MosString128('OK'),
				Stories: []
			})
		})
	})

	dev.onDeleteRunningOrder((RunningOrderID: MosString128) => {
		return new Promise((resolve, reject) => {
			console.log('onDeleteRunningOrder', RunningOrderID)
			resolve({
				ID: RunningOrderID,
				Status: new MosString128('OK'),
				Stories: []
			})
		})
	})

	dev.onROInsertStories((Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> => {
		return new Promise((resolve, reject) => {
			console.log('onROInsertStories', {
				ID: Action.StoryID,
				Status: 'OK',
				Stories: Stories
			})
			resolve({
				ID: Action.StoryID,
				Status: new MosString128('OK'),
				Stories: []
			})
		})
	})

	dev.onROMoveStories((Action: IMOSStoryAction, Stories: Array<MosString128>): Promise<IMOSROAck> => {
		return new Promise((resolve, reject) => {
			console.log('onROMoveStories', {
				ID: Action.StoryID,
				Status: 'OK',
				Stories: Stories
			})
			resolve({
				ID: Action.StoryID,
				Status: new MosString128('OK'),
				Stories: []
			})
		})
	})

	dev.onRODeleteStories((Action: IMOSStoryAction, Stories: Array<MosString128>): Promise<IMOSROAck> => {
		return new Promise((resolve, reject) => {
			console.log('onRODeleteStories', Action, {
				ID: Action.RunningOrderID,
				Status: 'OK',
				Stories: Stories
			})
			resolve({
				ID: Action.RunningOrderID,
				Status: new MosString128('OK'),
				Stories: []
			})
		})
	})

})
