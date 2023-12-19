export interface IMOSString128 {
	_mosString128: string
	/** @deprecated use getMosTypes().mosString128.stringify() instead! */
	toString: never
}

export function create(anyValue: AnyValue, strict: boolean): IMOSString128 {
	let strValue: string
	if (typeof anyValue === 'object' && anyValue) {
		if ((anyValue as IMOSString128)._mosString128) {
			strValue = (anyValue as IMOSString128)._mosString128
		} else if (anyValue.text) {
			strValue = anyValue.text.toString()
		} else if (Object.keys(anyValue).length === 0) {
			// is empty?
			strValue = ''
		} else {
			strValue = JSON.stringify(anyValue)
		}
	} else if (anyValue === undefined) {
		strValue = ''
	} else {
		strValue = anyValue !== `undefined` ? String(anyValue) : ''
	}
	const mosString: IMOSString128 = { _mosString128: strValue } as IMOSString128
	validate(mosString, strict)
	return mosString
}
export type AnyValue = string | { text: string; type: string } | IMOSString128 | any

export function validate(mosString128: IMOSString128, strict: boolean): void {
	if (!strict) return
	if ((mosString128._mosString128 || '').length > 128)
		throw new Error(
			'MosString128: string length is too long (' +
				mosString128._mosString128 +
				')! (To turn ignore this error, set the strict option to false)'
		)
}
export function valueOf(mosString128: IMOSString128): string {
	if (typeof mosString128 === 'string') return mosString128 // helpful hack
	return mosString128._mosString128
}
export function stringify(mosString128: IMOSString128): string {
	if (typeof mosString128 === 'string') return mosString128 // helpful hack
	return mosString128._mosString128
}
export function is(mosString128: IMOSString128 | any): mosString128 is IMOSString128 {
	if (typeof mosString128 !== 'object') return false
	if (mosString128 === null) return false
	return (mosString128 as IMOSString128)._mosString128 !== undefined
}
export function fallback(): IMOSString128 {
	const mosString: IMOSString128 = { _mosString128: '' } as IMOSString128
	validate(mosString, true)
	return mosString
}
