export * from './MosMessage'
export { AnyXMLObject, AnyXMLValue, AnyXMLValueSingular } from '@mos-connection/model'
export * from './profile0'
export * from './profile1'
export * from './profile2'
export * from './profile3'
export * from './profile4'
export * from './parseMosTypes'
export { literal, omitUndefined, flattenXMLText } from './lib'
export * from '../utils/ensureMethods'
export * from './ParseError'

import { AnyXMLObject } from '@mos-connection/model'
/** @deprecated use AnyXMLObject instead  */
export type AnyXML = AnyXMLObject // for backwards compatibility
