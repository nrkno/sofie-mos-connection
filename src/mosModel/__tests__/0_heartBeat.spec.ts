import {HeartBeat} from '../0_heartBeat'

describe('HeartBeat', () => {
	test('Simple test', () => {
		let h = new HeartBeat()
		console.log(h)
		expect(2).toBe(2)
	})
})
