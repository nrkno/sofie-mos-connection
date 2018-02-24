import { MosTime } from '../mosTime'
let a = new MosTime()
describe('MosTime', () => {
	test('Parses times correctly', () => {
		expect((new MosTime('2009-04-11T14:22:07')).getTime()).toBe((new Date('2009-04-11T14:22:07')).getTime())
		expect((new MosTime('2009-04-11T14:22:07,123')).getTime()).toBe((new Date('2009-04-11T14:22:07.123')).getTime())
		expect((new MosTime('2009-04-11T14:22:07,123-05:00')).getTime()).toBe((new Date('2009-04-11T14:22:07-05:00')).getTime() + 123)
		expect((new MosTime('2009-04-11T14:22:07.123-05:00')).getTime()).toBe((new Date('2009-04-11T14:22:07-05:00').getTime() + 123))
		expect((new MosTime('2009-04-11T14:22:07Z')).getTime()).toBe((new Date('2009-04-11T14:22:07Z')).getTime())
		expect((new MosTime('2009-04-11T14:22:07+5:00')).getTime()).toBe((new Date('2009-04-11T14:22:07+05:00')).getTime())
		expect((new MosTime('2009-04-11T14:22:07,123')).getTime()).toBe((new Date('2009-04-11T14:22:07+05:00')).getTime())
	})
})
