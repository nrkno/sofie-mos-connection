import { getHandleError } from '../lib'
import { getParseMosTypes } from '../parseMosTypes'

describe('lib', () => {
	test('getHandleError types', () => {
		const { mosString128 } = getParseMosTypes(true)
		const handleError = getHandleError('unit test')

		handleError(mosString128.createRequired, 'test', 'path')

		// @ts-expect-error number is not a valid XML type, only string
		handleError(mosString128.createRequired, 1234, 'path')
	})
})
