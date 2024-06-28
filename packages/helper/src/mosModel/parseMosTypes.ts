import { MosTypes, getMosTypes, MosType } from '@mos-connection/model'
import { AnyXMLValue, AnyXMLValueSingular } from './lib'

export function getParseMosTypes(strict: boolean): MosParseTypes {
	const mosTypes = getMosTypes(strict)

	const specialMosTypes = getSpecialMosTypes(strict)
	return {
		strict: mosTypes.strict,
		mosString128: wrapParseMethods(mosTypes.mosString128, strict),
		mosDuration: wrapParseMethods(mosTypes.mosDuration, strict),
		mosTime: wrapParseMethods(mosTypes.mosTime, strict),

		string: wrapParseMethods(specialMosTypes.string, strict),
		stringEnum: wrapParseMethods(specialMosTypes.stringEnum, strict),
	}
}
type MosParseTypes = {
	[key in keyof MosTypes]: MosTypes[key] extends MosType<infer Serialized, infer Value, infer CreateValue>
		? MosTypeParse<Serialized, Value, CreateValue>
		: MosTypes[key]
} & {
	string: MosTypeParse<string, string, AnyXMLValue>
	stringEnum: MosTypeParse<any, string, { enum: { [key: string]: string }; value: AnyXMLValue }>
}
interface MosTypeParse<Serialized, Value, CreateValue> extends Omit<MosType<Serialized, Value, CreateValue>, 'create'> {
	/**
	 * Used to parse data that is optional.
	 * If the data is missing, undefined is returned.
	 */
	createOptional: (anyValue: CreateValue | AnyXMLValue) => Serialized | undefined
	/**
	 * Used to parse data that is required.
	 * If in strict mode, the data must be present and parsable, otherwise an error is thrown.
	 * If not in strict mode, a fallback value will be used.
	 */
	createRequired: (anyValue: CreateValue | AnyXMLValue) => Serialized
}

function wrapParseMethods<Serialized, Value, CreateValue>(
	mosType: MosType<Serialized, Value, CreateValue>,
	strict: boolean
): MosTypeParse<Serialized, Value, CreateValue> {
	return {
		createOptional: wrapParseMethodCreateOptional(mosType, strict),
		createRequired: wrapParseMethodCreateRequired(mosType, strict),
		validate: mosType.validate,
		valueOf: mosType.valueOf,
		stringify: mosType.stringify,
		is: mosType.is,
	} as MosTypeParse<Serialized, Value, CreateValue>
}
function wrapParseMethodCreateOptional<Serialized, Value, CreateValue>(
	mosType: MosType<Serialized, Value, CreateValue>,
	strict: boolean
): MosTypeParse<Serialized, Value, CreateValue>['createOptional'] {
	return parseOptional(mosType.create, strict)
}
function wrapParseMethodCreateRequired<Serialized, Value, CreateValue>(
	mosType: MosType<Serialized, Value, CreateValue>,
	strict: boolean
): MosTypeParse<Serialized, Value, CreateValue>['createRequired'] {
	return parseRequired(mosType.create, mosType.fallback, strict)
}

export function parseOptional<V, R>(
	parser: (value: V) => R,
	strict: boolean
): (value: V | AnyXMLValue) => R | undefined {
	return (value: any) => {
		// handle empty string:
		if (typeof value === 'string' && !value.trim()) value = undefined
		// handle empty object (can happen when parsing an empty xml tag):
		if (typeof value === 'object' && Object.keys(value).length === 0) value = undefined

		value = ensureSingular(value, strict)

		if (value === undefined) return undefined
		return parser(value)
	}
}
export function parseRequired<V, R>(
	parser: (value: V) => R,
	fallback: () => R,
	strict: boolean
): (value: V | AnyXMLValue) => R {
	return (value: any) => {
		// handle empty string:
		if (typeof value === 'string' && !value.trim()) value = undefined
		// handle empty object (can happen when parsing an empty xml tag):
		if (typeof value === 'object' && Object.keys(value).length === 0) value = undefined

		value = ensureSingular(value, strict)

		if (value === undefined) {
			// Something might be wrong. value is undefined, but should not be (?)
			if (strict) {
				// This will throw if the mosType doesn't handle undefined:
				return parser(value)
			} else {
				return fallback()
			}
		} else {
			return parser(value)
		}
	}
}

function ensureSingular(value: AnyXMLValue, strict: boolean): AnyXMLValueSingular {
	if (typeof value === 'object') {
		if (Array.isArray(value)) {
			if (value.length === 0) return undefined
			if (value.length > 1) {
				if (strict)
					throw new Error(`Expected only one value, got ${value.length} values: ${JSON.stringify(value)}`)
				else return undefined
			}

			return ensureSingular(value[0], strict)
		} else {
			if (strict) throw new Error(`Expected only one value, got object: ${JSON.stringify(value)}`)
			else return undefined
		}
	} else {
		return value
	}
}

function getSpecialMosTypes(strict: boolean) {
	const string: MosType<string, string, AnyXMLValue> = {
		create: (anyValue: AnyXMLValue) => {
			if (typeof anyValue !== 'string') throw new Error(`Expected a string, got: "${anyValue}"`)
			return anyValue
		},
		validate: (_value: string) => true,
		valueOf: (value: string) => value,
		stringify: (value: string) => value,
		is: (value: string | any): value is string => typeof value !== 'string',
		fallback: () => '',
	}
	const stringEnum: MosType<string, string, { enum: { [key: string]: string }; value: AnyXMLValue }> = {
		create: (createValue) => {
			if (!createValue.enum) throw new Error(`Expected an object with an "enum" key, got: "${createValue}"`)

			const key = `${createValue.value}`
			if (!key) throw new Error(`Expected a value, got: "${createValue.value}"`)

			if (createValue.enum[key] === undefined) {
				if (strict) {
					throw new Error(`Unknown value, got: "${key}", possible values: ${Object.keys(createValue.enum)}`)
				} else return ''
			}

			return key
		},
		validate: (_value: string) => true,
		valueOf: (value: string) => value,
		stringify: (value: string) => value,
		is: (value: string | any): value is string => typeof value !== 'string',
		fallback: () => '',
	}

	return {
		string,
		stringEnum,
	}
}
