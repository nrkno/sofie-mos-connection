import { getMosTypes, IMOSString128 } from '@mos-connection/model'
import { AnyXML } from '../lib'

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLMosIDs {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSString128[] {
		const mosTypes = getMosTypes(strict)

		const arr: Array<IMOSString128> = []
		let xmlIds: Array<string> = xml as any
		if (!Array.isArray(xmlIds)) xmlIds = [xmlIds]
		xmlIds.forEach((id: string) => {
			arr.push(mosTypes.mosString128.create(id))
		})

		return arr
	}
}
