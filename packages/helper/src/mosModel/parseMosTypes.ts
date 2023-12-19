import { MosTypes, getMosTypes, MosType } from '@mos-connection/model'

export function getParseMosTypes(strict: boolean): MosParseTypes {
	const mosTypes = getMosTypes(strict)

	return {
		strict: mosTypes.strict,
		mosString128: wrapParseMethods(mosTypes.mosString128, strict),
		mosDuration: wrapParseMethods(mosTypes.mosDuration, strict),
		mosTime: wrapParseMethods(mosTypes.mosTime, strict),
	}
}
type MosParseTypes = {
	[key in keyof MosTypes]: MosTypes[key] extends MosType<infer Serialized, infer Value, infer CreateValue>
		? MosTypeParse<Serialized, Value, CreateValue>
		: MosTypes[key]
}
interface MosTypeParse<Serialized, Value, CreateValue> extends Omit<MosType<Serialized, Value, CreateValue>, 'create'> {
	/**
	 * Used to parse data that is optional.
	 * If the data is missing, undefined is returned.
	 */
	createOptional: (anyValue: CreateValue) => Serialized | undefined
	/**
	 * Used to parse data that is required.
	 * If in strict mode, the data must be present and parsable, otherwise an error is thrown.
	 * If not in strict mode, a fallback value will be used.
	 */
	createRequired: (anyValue: CreateValue) => Serialized
}

function wrapParseMethods<Serialized, Value, CreateValue>(
	mosType: MosType<Serialized, Value, CreateValue>,
	strict: boolean
): MosTypeParse<Serialized, Value, CreateValue> {
	return {
		createOptional: wrapParseMethodCreateOptional(mosType),
		createRequired: wrapParseMethodCreateRequired(mosType, strict),
		validate: mosType.validate,
		valueOf: mosType.valueOf,
		stringify: mosType.stringify,
		is: mosType.is,
	} as MosTypeParse<Serialized, Value, CreateValue>
}
function wrapParseMethodCreateOptional<Serialized, Value, CreateValue>(
	mosType: MosType<Serialized, Value, CreateValue>
): MosTypeParse<Serialized, Value, CreateValue>['createOptional'] {
	return (value: any) => {
		// handle empty string:
		if (typeof value === 'string' && !value.trim()) value = undefined
		// handle empty object (can happen when parsing an empty xml tag):
		if (typeof value === 'object' && Object.keys(value).length === 0) value = undefined

		if (value === undefined) return undefined
		return mosType.create(value)
	}
}
function wrapParseMethodCreateRequired<Serialized, Value, CreateValue>(
	mosType: MosType<Serialized, Value, CreateValue>,
	strict: boolean
): MosTypeParse<Serialized, Value, CreateValue>['createRequired'] {
	return (value: any) => {
		// handle empty string:
		if (typeof value === 'string' && !value.trim()) value = undefined
		// handle empty object (can happen when parsing an empty xml tag):
		if (typeof value === 'object' && Object.keys(value).length === 0) value = undefined

		if (value === undefined) {
			// Something might be wrong. value is undefined, but should not be (?)
			if (strict) {
				// This will throw if the mosType doesn't handle undefined:
				return mosType.create(value)
			} else {
				return mosType.fallback()
			}
		} else {
			return mosType.create(value)
		}
	}
}
