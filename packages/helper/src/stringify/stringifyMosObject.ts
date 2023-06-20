import { getMosTypes, IMOSDuration, IMOSString128, IMOSTime, MosTypes, stringifyMosType } from '@mos-connection/model'

/**
 * Converts a MOS data object,
 * replacing Mos-centric types with their stringified equivalents
 */
export function stringifyMosObject<T extends { [key: string]: any }>(o: T, strict: boolean): Stringified<T> {
	const mosTypes = getMosTypes(strict)

	const stringified = stringifyMosObjectInner(o, mosTypes)
	if (stringified.modified) return stringified.value
	else return o
}
function stringifyMosObjectInner(o: any, mosTypes: MosTypes): { modified: true; value: any } | { modified: false } {
	{
		const stringified = stringifyMosType(o, mosTypes)
		if (stringified.isMosType) return { modified: true, value: stringified.stringValue }
	}

	if (Array.isArray(o)) {
		let anythingModified = false
		const stringifiedArray = o.map((value: any): any => {
			const stringified = stringifyMosObjectInner(value, mosTypes)
			if (stringified.modified) {
				anythingModified = true
				return stringified.value
			} else return value
		})
		if (anythingModified) return { modified: true, value: stringifiedArray }
		return { modified: false }
	} else if (o === null) {
		return { modified: false }
	} else if (typeof o === 'object') {
		let anythingModified = false
		const o2: any = {}
		for (const [key, value] of Object.entries<any>(o)) {
			const stringified = stringifyMosObjectInner(value, mosTypes)
			if (stringified.modified) {
				anythingModified = true
				o2[key] = stringified.value
			} else o2[key] = value
		}

		if (anythingModified) return { modified: true, value: o2 }
		return { modified: false }
	} else {
		return { modified: false }
	}
}

type DeepReplace<T, M extends [any, any]> = {
	[P in keyof T]: T[P] extends M[0] ? Replacement<M, T[P]> : T[P] extends object ? DeepReplace<T[P], M> : T[P]
}
type Replacement<M extends [any, any], T> = M extends any ? ([T] extends [M[0]] ? M[1] : never) : never

export type Stringified<Original> = DeepReplace<
	Original,
	[IMOSString128, string] | [IMOSDuration, string] | [IMOSTime, string]
>
