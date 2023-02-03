import * as XMLBuilder from 'xmlbuilder'
import { xmlToObject } from '../../../utils/Utils'
import { XMLMosItem } from '../'
import { getMosTypes, IMOSItem, IMOSObjectPathType, IMOSScope } from '@mos-connection/model'

describe('XMLMosItem', () => {
	test('Should handle conversion losslessly', () => {
		const mosTypes = getMosTypes(true)

		const refItem: IMOSItem = {
			ID: mosTypes.mosString128.create('ID'),
			Slug: mosTypes.mosString128.create('Slug'),
			ObjectSlug: mosTypes.mosString128.create('ObjectSlug'), // TODO: not strict?
			ObjectID: mosTypes.mosString128.create('ObjectID'),
			MOSID: 'MOSID',
			mosAbstract: 'mosAbstract',
			Paths: [
				{
					Type: IMOSObjectPathType.PATH,
					Description: 'asdfasdf',
					Target: 'asdfasdf',
				},
				{
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: 'skdjhfb',
					Target: '8372h4fv',
				},
			],
			Channel: mosTypes.mosString128.create('Channel'),
			EditorialStart: 1,
			EditorialDuration: 2,
			Duration: 3,
			TimeBase: 4,
			UserTimingDuration: 5,
			Trigger: 'Trigger',
			MacroIn: mosTypes.mosString128.create('MacroIn'),
			MacroOut: mosTypes.mosString128.create('MacroOut'),
			MosExternalMetaData: [
				{
					MosScope: IMOSScope.PLAYLIST,
					MosSchema: 'asdf123',
					MosPayload: {
						a: '1',
						b: '2',
						c: {
							d: 'three',
						},
					},
				},
				{
					MosScope: IMOSScope.OBJECT,
					MosSchema: 'asdf1234',
					MosPayload: {
						hello: {
							brave: 'new world',
						},
					},
				},
			],
			// todo: add this:
			// MosObjects: [
			// 	{
			// 		ID: mosTypes.mosString128.create('Object_ID'),
			// 		Slug: mosTypes.mosString128.create('Object_Slug'),
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
			// 		CreatedBy: mosTypes.mosString128.create('CreatedBy'),
			// 		Created: mosTypes.mosTime.create(1234567),
			// 		ChangedBy: mosTypes.mosString128.create('ChangedBy'),
			// 		Changed: mosTypes.mosTime.create(1234567),
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
		<objPath techDescription="asdfasdf">asdfasdf</objPath>
		<objMetadataPath techDescription="skdjhfb">8372h4fv</objMetadataPath>
	</objPaths>
</item>
</myItem>`

		const xmlItem = XMLBuilder.create('myItem')
		XMLMosItem.toXML(xmlItem, refItem, true)

		expect(fixWhiteSpace(xmlItem.toString())).toEqual(fixWhiteSpace(refXml))

		expect(xmlItem.children).toHaveLength(1)

		const itemObj = xmlToObject(xmlItem)

		const item2 = XMLMosItem.fromXML(itemObj.item, true)
		expect(item2).toEqual(refItem)
	})
})

function fixWhiteSpace(str: string): string {
	return str.replace(/[\r\n\t]/g, '')
}
