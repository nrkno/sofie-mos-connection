import { MosString128 } from '../../dataTypes/mosString128'
import { AnyXML } from '../lib'

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLMosIDs {
	export function fromXML(xml: AnyXML): MosString128[] {
		const arr: Array<MosString128> = []
		let xmlIds: Array<string> = xml as any
		if (!Array.isArray(xmlIds)) xmlIds = [xmlIds]
		xmlIds.forEach((id: string) => {
			arr.push(new MosString128(id))
		})

		return arr
	}
}
