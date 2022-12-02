import { MosString128 } from '../mosString128'

test('MosString128', () => {
	expect(new MosString128('test test').toString()).toEqual('test test')
	expect(new MosString128('').toString()).toEqual('')
	expect(new MosString128({}).toString()).toEqual('')
	expect(new MosString128(12).toString()).toEqual('12')
	expect(new MosString128(true).toString()).toEqual('true')
	expect(new MosString128(null).toString()).toEqual('null')

	expect(new MosString128(new MosString128('test test')).toString()).toEqual('test test')
})
