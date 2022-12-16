import * as MosString128 from './mosTypes/mosString128'
import * as MosDuration from './mosTypes/mosDuration'
import * as MosTime from './mosTypes/mosTime'

export { IMOSString128 } from './mosTypes/mosString128'
export { IMOSDuration } from './mosTypes/mosDuration'
export { IMOSTime } from './mosTypes/mosTime'

export function getMosTypes(strict: boolean): MosTypes {
	return {
		strict,
		mosString128: getMosType(MosString128, strict),
		mosDuration: getMosType(MosDuration, strict),
		mosTime: getMosType(MosTime, strict),
	}
}
export interface MosTypes {
	strict: boolean
	mosString128: MosType<MosString128.IMOSString128, string, MosString128.AnyValue>
	mosDuration: MosType<MosDuration.IMOSDuration, number, MosDuration.AnyValue>
	mosTime: MosType<MosTime.IMOSTime, number, MosTime.AnyValue>
}
interface MosType<Serialized, Value, CreateValue> {
	/** Creates a MosType using provided data. The MosType is then used in data sent into MOS-connection  */
	create: (anyValue: CreateValue) => Serialized
	/** (internal function) Validate the data. Throws if something is wrong with the data */
	validate: (value: Serialized) => void
	/** Returns the value of the MosType */
	valueOf(value: Serialized): Value
	/** Returns a stringified representation of the MosType */
	stringify(value: Serialized): string
	/** Returns true if the provided data is of this MosType */
	is(value: Serialized | any): value is Serialized
}

interface InternalMosType<Serialized, Value> {
	create: (anyValue: any, strict: boolean) => Serialized
	validate: (value: Serialized, strict: boolean) => void
	valueOf(value: Serialized): Value
	stringify(value: Serialized): string
	is(value: Serialized | any): value is Serialized
}
function getMosType<Serialized, Value, CreateValue>(
	mosType: InternalMosType<Serialized, Value>,
	strict: boolean
): MosType<Serialized, Value, CreateValue> {
	return {
		create: (value: CreateValue): Serialized => mosType.create(value, strict),
		validate: (value: Serialized): void => mosType.validate(value, strict),
		stringify: (value: Serialized): string => mosType.stringify(value),
		valueOf: (value: Serialized): Value => mosType.valueOf(value),
		is: (value: Serialized): value is Serialized => mosType.is(value),
	}
}

export interface IMOSExternalMetaData {
	MosScope?: IMOSScope
	MosSchema: string
	MosPayload: any
}
export enum IMOSScope {
	OBJECT = 'OBJECT',
	STORY = 'STORY',
	PLAYLIST = 'PLAYLIST',
}
