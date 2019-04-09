import { Parser } from '../Parser'
import { IMOSObjectPathType } from '../../api'
import { xml2js } from '../../utils/Utils'

describe('Parser', () => {
	test('xml2ObjPaths: several objPaths', () => {

		const parsed: any = xml2js(`
			<item>
				<itemID>V_700</itemID>
				<itemSlug>AVID MEDIA CENTRAL</itemSlug>
				<objID>3afb7390-7f0c-4d52-ab74-159fad1df7ba</objID>
				<mosID>mam</mosID>
				<mosAbstract></mosAbstract>
				<objPaths>
					<objPath techDescription="VIDEO">http://media.example.com.br:9000/mamfolders/Original/3afb7390-7f0c-4d52-ab74-159fad1df7ba.mp4</objPath>
					<objProxyPath techDescription="JPG">http://media.example.com.br:9000/mamfolders/Proxy/3afb7390-7f0c-4d52-ab74-159fad1df7ba_0.jpg</objProxyPath>
					<objProxyPath techDescription="VIDEO">http://media.example.com.br:9000/mamfolders/Proxy/3afb7390-7f0c-4d52-ab74-159fad1df7ba_1.mp4</objProxyPath>
				</objPaths>
				<itemChannel></itemChannel>
				<itemEdStart></itemEdStart>
				<itemEdDur>49550</itemEdDur>
				<itemUserTimingDur></itemUserTimingDur>
				<itemTrigger>MANUAL</itemTrigger>
				<macroIn></macroIn>
				<macroOut></macroOut>
			</item>
		`)
		expect(parsed.item).toBeTruthy()
		expect(parsed.item.objPaths).toBeTruthy()
		expect(Parser.xml2ObjPaths(parsed.item.objPaths)).toEqual([
			{
				Type: IMOSObjectPathType.PATH,
				Description: 'VIDEO',
				Target: 'http://media.example.com.br:9000/mamfolders/Original/3afb7390-7f0c-4d52-ab74-159fad1df7ba.mp4'
			},
			{
				Type: IMOSObjectPathType.PROXY_PATH,
				Description: 'JPG',
				Target: 'http://media.example.com.br:9000/mamfolders/Proxy/3afb7390-7f0c-4d52-ab74-159fad1df7ba_0.jpg'
			},
			{
				Type: IMOSObjectPathType.PROXY_PATH,
				Description: 'VIDEO',
				Target: 'http://media.example.com.br:9000/mamfolders/Proxy/3afb7390-7f0c-4d52-ab74-159fad1df7ba_1.mp4'
			}
		])
	})
	test('xml2ObjPaths: only one objPath', () => {

		const parsed: any = xml2js(`
			<item>
				<itemID>V_700</itemID>
				<itemSlug>AVID MEDIA CENTRAL</itemSlug>
				<objID>3afb7390-7f0c-4d52-ab74-159fad1df7ba</objID>
				<mosID>mam</mosID>
				<mosAbstract></mosAbstract>
				<objPaths>
					<objPath techDescription="">D:\\Videos\\1080p\\Wonderful Universe - Part 2 FULL HD.mp4</objPath>
				</objPaths>
				<itemChannel></itemChannel>
				<itemEdStart></itemEdStart>
				<itemEdDur>49550</itemEdDur>
				<itemUserTimingDur></itemUserTimingDur>
				<itemTrigger>MANUAL</itemTrigger>
				<macroIn></macroIn>
				<macroOut></macroOut>
			</item>
		`)
		expect(parsed.item).toBeTruthy()
		expect(parsed.item.objPaths).toBeTruthy()
		expect(Parser.xml2ObjPaths(parsed.item.objPaths)).toEqual([
			{
				Type: IMOSObjectPathType.PATH,
				Description: '',
				Target: 'D:\\Videos\\1080p\\Wonderful Universe - Part 2 FULL HD.mp4'
			}
		])
	})
	test('xml2MetaData: handle time formats with various decimal separators', () => {

		const parsed: any = xml2js(`
		<mosExternalMetadata>
		<mosScope>PLAYLIST</mosScope>
		<mosSchema>http://ROENPS01:10505/schema/enps.dtd</mosSchema>
		<mosPayload>
			<Approved>0</Approved>
			<Creator>LINUXENPS</Creator>
			<Estimated>20</Estimated>
			<MediaTime>44.6</MediaTime>
			<MediaTime2>44,6</MediaTime2>
			<ModBy>TEDIAL.ROLXTEDPRDMAM01.DKRO.NRK.MOS</ModBy>
			<ModTime>20190401T161849Z</ModTime>
			<MOSItemDurations>27,56


	</MOSItemDurations>
			<MOSItemEdDurations/>
			<MOSObjSlugs>TEASER-OLD-IRISH-010419-RO
	M: Old Irish Pub kan bli stoppet
	10 Tema|Vanlig (00:00, Auto/OnNext): Pub-kjede hisset på seg politikere
	Story status</MOSObjSlugs>
			<MOSSlugs>TEASER-OLD-IRISH;TEASER-OLD-IRISH-010419-RO-1
	M: Old Irish Pub kan bli stoppet (01-04-19 17:59)
	TEASER-OLD-IRISH;TEASER-OLD-IRISH-010419-RO-4
	SAK 2-17</MOSSlugs>
			<MOSStatus>READY


	</MOSStatus>
			<Owner>LINUXENPS</Owner>
			<SourceMediaTime>0</SourceMediaTime>
			<SourceTextTime>0</SourceTextTime>
			<StoryLogPreview>Den danske pub-kjeda The Old Irish Pub har brutt fleire regelverk allerede før åpninga i Stavanger.  Det faller ikkje i god jord hos politikarane, som nå vil stoppa nyetableringa. </StoryLogPreview>
			<TextTime>12</TextTime>
			<Fylke>Rogaland</Fylke>
			<Innslagstittel>Old Irish Pub kan bli stoppet</Innslagstittel>
			<Kommune>Stavanger</Kommune>
			<mosartTransition>effect 2</mosartTransition>
			<mosartType>STK</mosartType>
			<OpprLand>Norge</OpprLand>
			<ReadTime>12.3</ReadTime>
			<ReadTime2>12,3</ReadTime2>
			<Rettigheter>Grønt</Rettigheter>
			<Rettighetseier>NRK</Rettighetseier>
			<Sted>Stavanger</Sted>
			<Tags>nattklubb, de røde sjøhus, skjenkebevilgning</Tags>
			<AUDIOGAIN/>
			<ENPSItemType>3</ENPSItemType>
		</mosPayload>
	</mosExternalMetadata>
		`)
		expect(parsed).toBeTruthy()
		expect(Parser.xml2MetaData(parsed.mosExternalMetadata)[0].MosPayload.MediaTime).toBe(44.6)
		expect(Parser.xml2MetaData(parsed.mosExternalMetadata)[0].MosPayload.MediaTime2).toBe(44.6)
		expect(Parser.xml2MetaData(parsed.mosExternalMetadata)[0].MosPayload.ReadTime).toBe(12.3)
		expect(Parser.xml2MetaData(parsed.mosExternalMetadata)[0].MosPayload.ReadTime2).toBe(12.3)
	})
})
