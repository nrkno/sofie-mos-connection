import { readFileSync } from 'fs'
import { join } from 'path'
import * as XMLBuilder from 'xmlbuilder'
import { xml2js } from '../../utils/Utils'
import { IMOSItem, MosModel, stringifyMosObject } from '../..'

function parseMosPluginMessageXml(xmlString: string): any | undefined {
	const doc: any = xml2js(xmlString)

	if (doc?.mos) {
		const res: any = {}
		if (doc.mos.ncsReqAppInfo) {
			res.ncsReqAppInfo = true
		}

		if (doc.mos.ncsItem?.item) {
			res.item = MosModel.XMLMosItem.fromXML(doc.mos.ncsItem.item, true)
		}

		return res
	} else {
		return undefined
	}
}

function generateMosPluginItemXml(item: IMOSItem): string {
	const builder = XMLBuilder.create('ncsItem')
	MosModel.XMLMosItem.toXML(builder, item, true)
	return `<mos>${builder.toString()}</mos>`
}

describe('MOS XML to JavaScript object parser', () => {
	describe('mosXml2Js', () => {
		describe('Sample1', () => {
			const sample1XmlStr = readFileSync(join(__dirname, './mosSample1.xml'), 'utf-8')
			const sample1JsonStr = readFileSync(join(__dirname, './mosSample1.json'), 'utf-8')

			const jsonDoc = JSON.parse(sample1JsonStr)

			it('should match the json representation', () => {
				const actual = parseMosPluginMessageXml(sample1XmlStr)
				const actualJson = actual && stringifyMosObject(actual.item, true) // Strip out any MosString etc

				expect(actualJson).toEqual(jsonDoc)
			})

			it('converting via xml should be lossless', () => {
				const generatedXml = generateMosPluginItemXml(jsonDoc)
				const actual = parseMosPluginMessageXml(generatedXml)
				const actualJson = actual && stringifyMosObject(actual.item, true) // Strip out any MosString etc

				expect(actualJson).toEqual(jsonDoc)
			})
		})

		describe('Sample2', () => {
			const sampleXmlStr = readFileSync(join(__dirname, './mosSample2.xml'), 'utf-8')
			const sampleJsonStr = readFileSync(join(__dirname, './mosSample2.json'), 'utf-8')

			const jsonDoc = JSON.parse(sampleJsonStr)

			it('should match the json representation', () => {
				const actual = parseMosPluginMessageXml(sampleXmlStr)
				const actualJson = actual && stringifyMosObject(actual.item, true) // Strip out any MosString etc

				expect(actualJson).toEqual(jsonDoc)
			})

			it('converting via xml should be lossless', () => {
				const generatedXml = generateMosPluginItemXml(jsonDoc)
				const actual = parseMosPluginMessageXml(generatedXml)
				const actualJson = actual && stringifyMosObject(actual.item, true) // Strip out any MosString etc

				expect(actualJson).toEqual(jsonDoc)
			})
		})
	})
})
