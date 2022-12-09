import * as MOS from '../index'

describe('Index', () => {


    test('ensure that types and enums are exposed', () => {
        let a: any
        // Type checks:
        a = (_: MOS.IMOSItem) =>  { /* nothing */ }
        a = (_: MOS.IMOSRunningOrder) =>  { /* nothing */ }
        a = (_: MOS.IMOSRunningOrderBase) =>  { /* nothing */ }
        a = (_: MOS.IMOSRunningOrderStatus) =>  { /* nothing */ }
        a = (_: MOS.IMOSStoryStatus) =>  { /* nothing */ }
        a = (_: MOS.IMOSItemStatus) =>  { /* nothing */ }
        a = (_: MOS.IMOSStoryAction) =>  { /* nothing */ }
        a = (_: MOS.IMOSROStory) =>  { /* nothing */ }
        a = (_: MOS.IMOSItemAction) =>  { /* nothing */ }
        a = (_: MOS.IMOSItem) =>  { /* nothing */ }
        a = (_: MOS.IMOSROAction) =>  { /* nothing */ }
        a = (_: MOS.IMOSROReadyToAir) =>  { /* nothing */ }
        a = (_: MOS.IMOSROFullStory) =>  { /* nothing */ }

        // @ts-expect-error types test
        a = (_: MOS.ThisDoesNotExist) => { /* nothing */ }
        if (a) a()


        expect(MOS.MosTime).toBeTruthy()
        expect(MOS.MosDuration).toBeTruthy()
        expect(MOS.MosString128).toBeTruthy()

        expect(MOS.IMOSObjectStatus).toBeTruthy()

        expect(MOS.IMOSScope).toBeTruthy()
        expect(MOS.IMOSScope.PLAYLIST).toBeTruthy()
    })
    test('ensure that helpers are exposed', () => {
        expect(MOS.Utils).toBeTruthy() // For backwards compatibility
        expect(typeof MOS.Utils.xml2js).toBe('function') // For backwards compatibility
        expect(MOS.MosModel.XMLMosItem.fromXML).toBeTruthy() // For backwards compatibility
        expect(MOS.MosModel.XMLMosItem.toXML).toBeTruthy() // For backwards compatibility

    })
})
