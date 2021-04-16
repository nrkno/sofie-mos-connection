import { MosTime } from '../mosTime'

describe('MosTime', () => {
	test('parse time correctly', () => {
		// test invalid date formats
		// @ts-ignore
		let date = new Date(undefined)
		expect(() => new MosTime(date)).toThrow(/Invalid timestamp/)

		// test input format date, number and various strings
		date = new Date(2018, 1, 24, 23, 13, 52, 0) // local, zero-indexed month
		expect(new MosTime(date).getTime()).toBe(date.getTime())
		expect(new MosTime(date.getTime()).getTime()).toBe(date.getTime())
		expect(new MosTime(date.toString()).getTime()).toBe(date.getTime()) // locale time
		expect(new MosTime(date.toUTCString()).getTime()).toBe(date.getTime()) // utc
		expect(new MosTime(date.toISOString()).getTime()).toBe(date.getTime()) // utc

		// mos-centric strings
		expect(new MosTime('2009-04-11T14:22:07Z').getTime()).toBe(new Date('2009-04-11T14:22:07Z').getTime())
		expect(new MosTime('2009-04-11T14:22:07').getTime()).toBe(new Date('2009-04-11T14:22:07Z').getTime())
		expect(new MosTime('2009-04-11T14:22:07.123').getTime()).toBe(new Date('2009-04-11T14:22:07.123Z').getTime())
		expect(new MosTime('2009-04-11T14:22:07,123').getTime()).toBe(new Date('2009-04-11T14:22:07.123Z').getTime())
		expect(new MosTime('2009-04-11T14:22:07.123-05:00').getTime()).toBe(new Date('2009-04-11T14:22:07-05:00').getTime() + 123)
		expect(new MosTime('2009-04-11T14:22:07,123-05:00').getTime()).toBe(new Date('2009-04-11T14:22:07-05:00').getTime() + 123)
		expect(new MosTime('2009-04-11T14:22:07Z').getTime()).toBe(new Date('2009-04-11T14:22:07Z').getTime())
		expect(new MosTime('2009-04-11T14:22:07Z').getTime()).toBe(new Date('2009-04-11T14:22:07Z').getTime())
		expect(new MosTime('2009-04-11T14:22:07+5:00').getTime()).toBe(new Date('2009-04-11T14:22:07+05:00').getTime())
	})
	test('format time strings correctly', () => {
		let date = new Date(Date.UTC(2018, 1, 24, 23, 13, 52, 0)) // utc, zero-indexed month
		expect(new MosTime(date).toString()).toBe('2018-02-24T23:13:52,000')
		expect(new MosTime(1519514032000).toString()).toBe('2018-02-24T23:13:52,000') // date.getTime()
		// expect(new MosTime('Sun Feb 25 2018 00:13:52 GMT+0100 (W. Europe Standard Time)').toString()).toBe('2018-02-25T00:13:52,000+01:00') // date.toString() locale time
		expect(new MosTime('Sat, 24 Feb 2018 23:13:52 GMT').toString()).toBe('2018-02-24T23:13:52,000') // date.toUTCString()
		expect(new MosTime('2018-02-24T23:13:52.000Z').toString()).toBe('2018-02-24T23:13:52,000Z') // date.toISOString()

		// mos-centric strings
		// let localHours = 14
		// localHours += new Date().getTimezoneOffset() / 60
		// expect(new MosTime('2009-04-11T14:22:07').toString()).toBe('2009-04-11T' + localHours + ':22:07,000Z')
		// expect(new MosTime('2009-04-11T14:22:07.123').toString()).toBe('2009-04-11T' + localHours + ':22:07,123Z')
		// expect(new MosTime('2009-04-11T14:22:07,123').toString()).toBe('2009-04-11T' + localHours + ':22:07,123Z')
		expect(new MosTime('2009-04-11T14:22:07Z').toString()).toBe('2009-04-11T14:22:07,000Z')
		expect(new MosTime('2009-04-11T14:22:07.123Z').toString()).toBe('2009-04-11T14:22:07,123Z')
		expect(new MosTime('2009-04-11T14:22:07,123Z').toString()).toBe('2009-04-11T14:22:07,123Z')
		expect(new MosTime('2009-04-11T14:22:07,123-05:00').toString()).toBe('2009-04-11T14:22:07,123-05:00')
		expect(new MosTime('2009-04-11T14:22:07.123-05:00').toString()).toBe('2009-04-11T14:22:07,123-05:00')
		expect(new MosTime('2009-04-11T14:22:07Z').toString()).toBe('2009-04-11T14:22:07,000Z')
		expect(new MosTime('2009-04-11T14:22:07+5:00').toString()).toBe('2009-04-11T14:22:07,000+05:00')
	})
	test('handles tricky (midnight, new year, summer time, leap year) corectly', () => {
		const SEC = 1000
		const MIN = 60 * SEC
		const HOUR = MIN * 60
		// const DAY = HOUR * 24

		// @todo: double check all expectations

		// midnight
		let date = new Date(Date.UTC(2018, 1, 24, 23, 13, 52, 0)) // utc, zero-indexed month
		date.setTime(date.getTime() + (2 * HOUR))
		expect(new MosTime(date).getTime()).toBe(new Date(Date.UTC(2018, 1, 25, 1, 13, 52)).getTime()) // locale time
		expect(new MosTime(date.toString()).getTime()).toBe(new Date(Date.UTC(2018, 1, 25, 1, 13, 52)).getTime()) // locale time
		expect(new MosTime(date.toUTCString()).getTime()).toBe(new Date(Date.UTC(2018, 1, 25, 1, 13, 52)).getTime()) // locale time
		expect(new MosTime(date.toISOString()).getTime()).toBe(new Date(Date.UTC(2018, 1, 25, 1, 13, 52)).getTime()) // locale time

		expect(new MosTime(date).toString()).toBe('2018-02-25T01:13:52,000') // locale time
		expect(new MosTime(date.toUTCString()).toString()).toBe('2018-02-25T01:13:52,000') // locale time

		// @todo: how to test with local time/offsets?

		// new year
		date = new Date(Date.UTC(2018, 11, 31, 23, 13, 52, 0)) // utc, zero-indexed month
		date.setTime(date.getTime() + (2 * HOUR))
		expect(new MosTime(date).getTime()).toBe(new Date(Date.UTC(2019, 0, 1, 1, 13, 52)).getTime()) // locale time
		expect(new MosTime(date.toString()).getTime()).toBe(new Date(Date.UTC(2019, 0, 1, 1, 13, 52)).getTime()) // locale time
		expect(new MosTime(date.toUTCString()).getTime()).toBe(new Date(Date.UTC(2019, 0, 1, 1, 13, 52)).getTime()) // locale time
		expect(new MosTime(date.toISOString()).getTime()).toBe(new Date(Date.UTC(2019, 0, 1, 1, 13, 52)).getTime()) // locale time

		expect(new MosTime(date).toString()).toBe('2019-01-01T01:13:52,000') // locale time
		expect(new MosTime(date.toUTCString()).toString()).toBe('2019-01-01T01:13:52,000') // locale time

		// @todo: daylight savings spring

		// @todo: daylight savings fall

		// @todo: leap year

	})
})
