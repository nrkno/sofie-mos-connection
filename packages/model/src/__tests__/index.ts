import * as MOS from '../index'

describe('Index', () => {
	test('ensure that types and enums are exposed', () => {
		let a: any
		// Type checks:
		a = (_: MOS.IMOSItem) => null
		a = (_: MOS.IMOSRunningOrder) => null
		a = (_: MOS.IMOSRunningOrderBase) => null
		a = (_: MOS.IMOSRunningOrderStatus) => null
		a = (_: MOS.IMOSStoryStatus) => null
		a = (_: MOS.IMOSItemStatus) => null
		a = (_: MOS.IMOSStoryAction) => null
		a = (_: MOS.IMOSROStory) => null
		a = (_: MOS.IMOSItemAction) => null
		a = (_: MOS.IMOSItem) => null
		a = (_: MOS.IMOSROAction) => null
		a = (_: MOS.IMOSROReadyToAir) => null
		a = (_: MOS.IMOSROFullStory) => null

		// @ts-expect-error types test
		a = (_: MOS.ThisDoesNotExist) => null
		if (a) a()

		expect(MOS.getMosTypes).toBeTruthy()

		expect(MOS.IMOSObjectStatus).toBeTruthy()

		expect(MOS.IMOSScope).toBeTruthy()
		expect(MOS.IMOSScope.PLAYLIST).toBeTruthy()
	})

	test('ensure that dataTypes are exposed', () => {
		const mosTypes = MOS.getMosTypes(false)

		expect(mosTypes.mosString128).toBeTruthy()
		expect(mosTypes.mosDuration).toBeTruthy()
		expect(mosTypes.mosTime).toBeTruthy()
	})
})
