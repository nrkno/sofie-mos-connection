import { ParseError } from '../mosModel/ParseError'

describe('ParseError', () => {
	function throwsError() {
		throw new Error('test')
	}
	function throwsParseError(path: string) {
		throw new ParseError(path, 'test')
	}
	function handleError(fcn: () => any) {
		try {
			fcn()
		} catch (e) {
			throw ParseError.handleCaughtError('outer', e)
		}
	}
	function getThrownStack(fcn: () => any) {
		try {
			fcn()
		} catch (e) {
			return (e as any).stack
		}
	}
	test('handle thrown errors', () => {
		expect(() => throwsError()).toThrowError('test')

		expect(() => throwsParseError('a')).toThrowError('a: test')

		expect(() => handleError(() => throwsParseError('a'))).toThrowError('outer.a: test')

		// Test thrown stack
		expect(getThrownStack(() => throwsError())).toMatch(/Error: test[\w\W]*at getThrownStack/gm)
		expect(getThrownStack(() => throwsParseError('a'))).toMatch(/ParseError: a: test[\w\W]*at getThrownStack/gm)
		expect(getThrownStack(() => handleError(() => throwsParseError('a')))).toMatch(
			/ParseError: outer.a: test[\w\W]*at getThrownStack/gm
		)
	})
})
