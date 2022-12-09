export * from './MosConnection'
export * from './api'
export * from '@mos-connection/helper'
export * from '@mos-connection/model'
export { ConnectionConfig } from './config/connectionConfig'

export { MosDevice } from './MosDevice'

// Backwards comppatibility
import { xml2js, pad, addTextElement, xmlToObject } from '@mos-connection/helper'
export const Utils = {
	pad,
	xml2js,
	addTextElement,
	xmlToObject,
}
