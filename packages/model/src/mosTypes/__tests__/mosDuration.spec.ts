import { getMosTypes } from '../../mosTypes'

describe('MosDuration', () => {
	test('basic', () => {
		const mosTypes = getMosTypes(true)

		const mosDuration = mosTypes.mosDuration.create('1:23:45')
		expect(mosTypes.mosDuration.stringify(mosDuration)).toBe('1:23:45')
		expect(mosTypes.mosDuration.valueOf(mosDuration)).toBe(5025)
		expect(() => mosTypes.mosDuration.validate(mosDuration)).not.toThrowError()
	})
	test('is', () => {
		const mosTypes = getMosTypes(true)

		const mosDuration = mosTypes.mosDuration.create('1:23:45')
		expect(mosTypes.mosDuration.is(mosDuration)).toBe(true)
		expect(mosTypes.mosString128.is(mosDuration)).toBe(false)
		expect(mosTypes.mosTime.is(mosDuration)).toBe(false)

		expect(mosTypes.mosDuration.is({})).toBe(false)
		expect(mosTypes.mosDuration.is(null)).toBe(false)
		expect(mosTypes.mosDuration.is('abc')).toBe(false)
		expect(mosTypes.mosDuration.is(123)).toBe(false)
	})
	test('parse durations correctly', () => {
		const mosTypes = getMosTypes(true)
		function toValue(input: any) {
			return mosTypes.mosDuration.valueOf(mosTypes.mosDuration.create(input))
		}
		function toString(input: any) {
			return mosTypes.mosDuration.stringify(mosTypes.mosDuration.create(input))
		}
		expect(toValue('1:23:45')).toBe(5025)
		expect(toString(toValue('1:23:45'))).toBe('1:23:45')
		expect(toString('1:23:45')).toBe('1:23:45')
		expect(toString('1:2:3')).toBe('1:02:03')

		expect(toString('01:23:45')).toBe('1:23:45')
		expect(toString('2:05:23')).toBe('2:05:23')
		expect(toString('1:65:23')).toBe('2:05:23')
	})
})
