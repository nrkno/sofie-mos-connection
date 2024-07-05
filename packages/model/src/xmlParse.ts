/*
Note: There are a few helper functions that are useful when working with the XML data.

function doSomething(value: AnyXMLValue) {


    if (MosModel.isXMLObject(value)) {
        // Now we know that value is an object
        console.log(value.property)

    } else if (MosModel.isSingular(value)) {
        // Now we know that value is a singular value (ie string or undefined)
        console.log(value)

    } else if (MosModel.isSingularArray(value)) {
        // Now we know that value is an array of singular values (ie string or undefined)
        console.log(value.join(', '))

    }


    // If there can be one or more xml tags of a type, it is useful to traverse them like this:
    for (const valueEntry of MosModel.ensureArray(value)) {
        console.log(valueEntry)
	}

    // If you KNOW that a value is supposed to be an object, you can use this:
    value = MosModel.ensureXMLObject(value, strict)
    // If strict is true, it will throw an error if the value is not an object
    // If strict is false, it will return an empty object if the value is not an object

    // If you KNOW that a value is supposed to be a singular value (ie a string), you can use this:
    value = MosModel.ensureSingular(value, strict)
    // If strict is true, it will throw an error if the value is not a singular value
    // If strict is false, it will return undefined if the value is not singular



}
}
*/

/** Parsed xml data objects */
export type AnyXMLObject = { [key: string]: AnyXMLValue }
/** Parsed xml data values */
export type AnyXMLValue = AnyXMLValueSingular | AnyXMLValueSingular[] | AnyXMLObject | AnyXMLObject[]
/** Parsed xml data values, singular */
export type AnyXMLValueSingular = string | undefined
