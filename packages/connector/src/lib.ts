/** Return true if the object has a property */
export function has(obj: unknown, property: string): boolean {
	return Object.hasOwnProperty.call(obj, property)
}
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
