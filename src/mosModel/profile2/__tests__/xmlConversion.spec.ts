import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSItem,
	IMOSObjectPathType,
	IMOSScope,
	MosString128,
	Utils
} from '../../..'
import { XMLMosItem } from '../'

describe('XMLMosItem', () => {
	test('Should handle conversion losslessly', () => {

		const refItem: IMOSItem = {
			ID: new MosString128('ID'),
			Slug: new MosString128('Slug'),
			ObjectSlug: new MosString128('ObjectSlug'),
			ObjectID: new MosString128('ObjectID'),
			MOSID: 'MOSID',
			mosAbstract: 'mosAbstract',
			Paths: [
				{
					Type: IMOSObjectPathType.PATH,
					Description: 'asdfasdf',
					Target: 'asdfasdf'
				},
				{
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: 'skdjhfb',
					Target: '8372h4fv'
				}
			],
			Channel: new MosString128('Channel'),
			EditorialStart: 1,
			EditorialDuration: 2,
			Duration: 3,
			TimeBase: 4,
			UserTimingDuration: 5,
			Trigger: 'Trigger',
			MacroIn: new MosString128('MacroIn'),
			MacroOut: new MosString128('MacroOut'),
			MosExternalMetaData: [
				{
					MosScope: IMOSScope.PLAYLIST,
					MosSchema: 'asdf123',
					MosPayload: {
						a: '1',
						b: '2',
						c: {
							d: 'three'
						}
					}
				},
				{
					MosScope: IMOSScope.OBJECT,
					MosSchema: 'asdf1234',
					MosPayload: {
						hello: {
							brave: 'new world'
						}
					}
				}
			]
			// todo: add this:
			// MosObjects: [
			// 	{
			// 		ID: new MosString128('Object_ID'),
			// 		Slug: new MosString128('Object_Slug'),
			// 		MosAbstract: 'Object_MosAbstract',
			// 		Group: 'Object_Group',
			// 		Type: IMOSObjectType.OTHER,
			// 		TimeBase: 0,
			// 		Revision: 1,
			// 		Duration: 500,
			// 		Status: IMOSObjectStatus.READY,
			// 		AirStatus: IMOSObjectAirStatus.READY,
			// 		Paths: [
			// 			{
			// 				Type: IMOSObjectPathType.PATH,
			// 				Description: 'asdfasdf',
			// 				Target: 'asdfasdf',
			// 			},
			// 			{
			// 				Type: IMOSObjectPathType.METADATA_PATH,
			// 				Description: 'skdjhfb',
			// 				Target: '8372h4fv',
			// 			}
			// 		],
			// 		CreatedBy: new MosString128('CreatedBy'),
			// 		Created: new MosTime(1234567),
			// 		ChangedBy: new MosString128('ChangedBy'),
			// 		Changed: new MosTime(1234567),
			// 		// Description: any // xml json
			// 		// MosExternalMetaData: Array<IMOSExternalMetaData>
			// 		// MosItemEditorProgID: MosString128
			// 	}
			// ]
		}
		const refXml = `<myItem>
<item>
	<itemID>ID</itemID>
	<objID>ObjectID</objID>
	<mosID>MOSID</mosID>
	<itemSlug>Slug</itemSlug>
	<objSlug>ObjectSlug</objSlug>
	<objDur>3</objDur>
	<objTB>4</objTB>
	<mosAbstract>mosAbstract</mosAbstract>
	<itemChannel>Channel</itemChannel>
	<itemEdStart>1</itemEdStart>
	<itemEdDur>2</itemEdDur>
	<itemUserTimingDur>5</itemUserTimingDur>
	<itemTrigger>Trigger</itemTrigger>
	<macroIn>MacroIn</macroIn>
	<macroOut>MacroOut</macroOut>
	<mosExternalMetadata>
		<mosSchema>asdf123</mosSchema>
		<mosPayload>
			<a>1</a>
			<b>2</b>
			<c>
				<d>three</d>
			</c>
		</mosPayload>
		<mosScope>PLAYLIST</mosScope>
	</mosExternalMetadata>
	<mosExternalMetadata>
		<mosSchema>asdf1234</mosSchema>
		<mosPayload>
			<hello>
				<brave>new world</brave>
			</hello>
		</mosPayload>
		<mosScope>OBJECT</mosScope>
	</mosExternalMetadata>
	<objPaths>
		<objPath techDescription=\"asdfasdf\">asdfasdf</objPath>
		<objMetadataPath techDescription=\"skdjhfb\">8372h4fv</objMetadataPath>
	</objPaths>
</item>
</myItem>`

		const xmlItem = XMLBuilder.create('myItem')
		XMLMosItem.toXML(xmlItem, refItem)

		expect(fixWhiteSpace(xmlItem.toString())).toEqual(fixWhiteSpace(refXml))

		expect(xmlItem.children).toHaveLength(1)

		const itemObj = Utils.xmlToObject(xmlItem)

		const item2 = XMLMosItem.fromXML(itemObj.item)
		expect(item2).toEqual(refItem)
	})
})

function fixWhiteSpace (str: string): string {
	return str.replace(/[\r\n\t]/g, '')
}
