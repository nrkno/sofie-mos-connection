/** Parsed xml data objects */
export type AnyXMLObject = { [key: string]: AnyXMLValue }
/** Parsed xml data values */
export type AnyXMLValue = AnyXMLValueSingular | AnyXMLValueSingular[] | AnyXMLObject | AnyXMLObject[]
/** Parsed xml data values, singular */
export type AnyXMLValueSingular = string | undefined
