export function isEmpty(obj: unknown): boolean {
	if (typeof obj === 'object') {
		for (const prop in obj) {
			if (has(obj, prop)) {
				return false
			}
		}
		return JSON.stringify(obj) === JSON.stringify({})
	} else {
		return !obj
	}
}
export function numberOrUndefined(value: unknown): number | undefined {
	if (typeof value === 'object' && isEmpty(value)) {
		return undefined
	}
	if (typeof value === 'number') return value
	const num = parseFloat(`${value}`)
	if (isNaN(num)) return undefined
	return num
}

export { AnyXMLObject, AnyXMLValue, AnyXMLValueSingular } from '@mos-connection/model'

/** Return true if the object has a property */
export function has(obj: unknown, property: string): boolean {
	return Object.hasOwnProperty.call(obj, property)
}
export function getHandleError(basePath: string): <V, R>(func: (val: V) => R, value: V, path: string) => R {
	const handleError = <V, R>(func: (val: V) => R, value: V, path: string): R => {
		try {
			return func(value)
		} catch (org) {
			// is Error?
			const orgMessage = org instanceof Error ? org.message : `${org}`
			const newPath = [basePath, path].filter(Boolean).join('.')
			const error = new Error(`Error parsing "${newPath}": ${orgMessage}`)
			if (org instanceof Error) error.stack = org.stack
			throw error
		}
	}

	return handleError
}

export function ensureArray<T>(v: T | T[]): T[] {
	if (typeof v === 'object' && Array.isArray(v)) return v
	else return [v]
}
