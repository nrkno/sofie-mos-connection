import { AnyXMLValue } from '@mos-connection/model'

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

export { AnyXMLObject, AnyXMLValue, AnyXMLValueSingular } from '@mos-connection/model'

/** Return true if the object has a property */
export function has(obj: unknown, property: string): boolean {
	return Object.hasOwnProperty.call(obj, property)
}

/**
 * Asserts that a string type is of a certain literal.
 * Example usage: const str = assertStringLiteral('foo', ['foo', 'bar']) // str is of type 'foo' | 'bar'
 */
export function assertStringLiteral<T extends string>(value: string, options: T[]): value is T {
	return options.includes(value as T)
}

/** Type assertion */
export function literal<T>(o: T): T {
	return o
}

/**
 * Removes undefined properties from an object
 */
export function omitUndefined(obj: { [key: string]: any }): void {
	if (obj && typeof obj === 'object') {
		for (const [key, value] of Object.entries<any>(obj)) {
			if (value === undefined) delete (obj as any)[key]
		}
	}
}
export function flattenXMLText(xml: AnyXMLValue, strict: boolean): string {
	const strings: string[] = []

	if (typeof xml === 'object' && has(xml, 'elements')) flattenXMLTextInner(strings, (xml as any).elements, strict)
	else flattenXMLTextInner(strings, xml, strict)

	let str = ''
	let insertWhitespace = false
	for (const s of strings) {
		if (s === '\n') {
			if (insertWhitespace) {
				str += '\n'
				insertWhitespace = false
			}
		} else {
			const trimmed = s.trim()
			if (trimmed) {
				if (insertWhitespace) str += ' ' + trimmed
				else str += trimmed
				insertWhitespace = true
			}
		}
	}
	return str
}
function flattenXMLTextInner(strings: string[], xml: AnyXMLValue, strict: boolean): void {
	if (xml === null) {
		return
	} else if (typeof xml === 'object') {
		if (Array.isArray(xml)) {
			for (const element of xml) {
				flattenXMLTextInner(strings, element, strict)
			}
			return
		} else if (xml.$type === 'text' && typeof xml.text === 'string') {
			strings.push(xml.text)
			return
		} else if (xml.$type === 'element') {
			if (xml.$name === 'p') strings.push('\n')
			if (xml.$name === 'tab') strings.push(' ')

			for (const [key, value] of Object.entries<any>(xml)) {
				if (key === '$type') continue
				if (key === '$name') continue

				flattenXMLTextInner(strings, value, strict)
			}

			return
		} else if (typeof xml.text === 'string') {
			strings.push(xml.text)
			return
		}
	} else if (typeof xml === 'string') {
		strings.push(xml)
		return
	} else if (xml === undefined) {
		return
	}
	// else
	if (strict) throw new Error(`flattenXMLText, unhandled value: ${JSON.stringify(xml)}`)
}
