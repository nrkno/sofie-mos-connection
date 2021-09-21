import { MosString128 } from '../../dataTypes/mosString128'

export namespace XMLMosIDs {
	export function fromXML(xml: any): MosString128[] {
		let arr: Array<MosString128> = []
		let xmlIds: Array<string> = xml
		if (!Array.isArray(xmlIds)) xmlIds = [xmlIds]
		xmlIds.forEach((id: string) => {
			arr.push(new MosString128(id))
		})

		return arr
	}
}
