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
})
