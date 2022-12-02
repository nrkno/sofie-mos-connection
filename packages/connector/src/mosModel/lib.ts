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

/** Just a generic type to use instead of "any", for xml objects */
export type AnyXML = { [key: string]: any }

/** Return true if the object has a property */
export function has(obj: unknown, property: string): boolean {
	return Object.hasOwnProperty.call(obj, property)
}
export function safeStringify(obj: unknown): string {
	if (typeof obj === 'string') {
		return obj
	}
	try {
		return JSON.stringify(obj)
	} catch (e) {
		return `--Unable to stringify: ${e}--`
	}
}
