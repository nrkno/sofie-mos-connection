import { xml2js as xmlParser } from 'xml-js'
import * as XMLBuilder from 'xmlbuilder'
import { getMosTypes, IMOSDuration, IMOSString128, IMOSTime, stringifyMosType } from '@mos-connection/model'

/** */
export function pad(n: string, width: number, z?: string): string {
	z = z || '0'
	n = n + ''
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

export function xml2js(messageString: string): { [key: string]: any } {
	/**
	 * objId should be handled as a string, not as a number
	 * so we need to force it as text in the messageString
	 * and reconvert it after it has been parsed by xmlParser
	 * all objects in this set will be forced to be strings:
	 */
	const forcedStringObject = new Set(['objId', 'objID'])
	for (const object of forcedStringObject) {
		const regex = new RegExp(`<${object}>(.*?)</${object}>`, 'g')
		messageString = messageString.replace(regex, (_match, p1) => {
			return `<${object}>_str_${p1}</${object}>`
		})
	}

	const object = xmlParser(messageString, { compact: false, trim: true, nativeType: true })
	// common tags we typically want to know the order of the contents of:
	const orderedTags = new Set(['storyBody', 'mosAbstract', 'description', 'p', 'em', 'span', 'h1', 'h2', 'i', 'b'])

	/**
	 * Doing a post-order tree traversal we try to make the objectified tree as compact as possible.
	 * Whenever we find an "orderedTag" we keep the order of it's children.
	 *
	 * ps: post-order means we make a node's children as compact as possible first, and then try to make
	 * that node compact.
	 */
	const concatChildrenAndTraverseObject = (element: { [key: string]: any }) => {
		if (element.name) {
			element.$name = element.name
			delete element.name
		}
		if (element.type) {
			element.$type = element.type
			delete element.type
		}

		if (element.elements) {
			if (element.elements.length === 1) {
				concatChildrenAndTraverseObject(element.elements[0])

				const childEl = element.elements[0]
				const name = childEl.$name || childEl.$type || 'unknownElement'

				/**
				 * forcedStringObjects has been forced to be strings, not numbers
				 * use the original value by removing _str_
				 */
				if (typeof childEl.text === 'string' && childEl.text.includes('_str_')) {
					childEl.text = childEl.text.replace(/_str_/, '')
				}

				if (childEl.$type && childEl.$type === 'text') {
					if (childEl.$name === undefined) {
						// pure text node, hoist it up:
						element.$type = 'text'
						element.text = childEl.text
					} else {
						// leave it as is
					}
				} else {
					delete childEl.$name
					delete childEl.$type
					element[name] = element.elements[0]
				}
				delete element.elements
				if (childEl.$type === 'text') {
					element[name] = childEl.text
					if (childEl.attributes) {
						for (const key in childEl.attributes) {
							element[key] = childEl.attributes[key]
						}
						delete childEl.attributes
					}
				}
			} else if (element.elements.length > 1) {
				for (const childEl of element.elements) {
					concatChildrenAndTraverseObject(childEl)
				}

				if (!orderedTags.has(element.$name)) {
					// if the element name is contained in the set of orderedTag names we don't make it any more compact
					const names: Array<string> = element.elements.map(
						(obj: { $name?: string; $type?: string }) => obj.$name || obj.$type || 'unknownElement'
					)
					const namesSet = new Set(names)
					if (namesSet.size === 1 && names.length !== 1 && !namesSet.has('type') && !namesSet.has('name')) {
						// make array compact:
						const array: any = []
						for (const childEl of element.elements) {
							/**
							 * forcedStringObjects has been forced to be strings, not numbers
							 * use the original value by removing _str_
							 */
							if (typeof childEl.text === 'string' && childEl.text.includes('_str_')) {
								childEl.text = childEl.text.replace(/_str_/, '')
							}

							if (childEl.$type && childEl.$type === 'text') {
								if (Object.keys(childEl).length > 2) {
									array.push(childEl)
								} else if (childEl.attributes) {
									childEl.attributes.text = childEl.text
									array.push(childEl.attributes)
								} else {
									array.push(childEl.text)
								}
							} else {
								if (childEl.$type) delete childEl.$type
								if (childEl.$name) delete childEl.$name
								if (Object.keys(childEl).length > 1) {
									// might contain something useful like attributes
									if (childEl.attributes) {
										for (const key in childEl.attributes) {
											childEl[key] = childEl.attributes[key]
										}
										delete childEl.attributes
									}
									array.push(childEl)
								} else {
									array.push(childEl[Object.keys(childEl)[0]])
								}
							}
						}
						element[names[0]] = array
						delete element.elements
					} else if (names.length === namesSet.size) {
						// all elements are unique
						for (const childEl of element.elements) {
							if (
								childEl.$type &&
								childEl.$type === 'text' &&
								(Object.keys(childEl).length <= 3 ||
									(!childEl.$name && Object.keys(childEl).length < 3))
							) {
								if (!childEl.text) {
									element.text = childEl.text
								}
								element[childEl.$name] = childEl.text
							} else {
								if (childEl.attributes) {
									for (const key in childEl.attributes) {
										childEl[key] = childEl.attributes[key]
									}
									delete childEl.attributes
								}
								const name = childEl.$name || childEl.$type || 'unknownEl'
								if (childEl.$type) delete childEl.$type
								if (childEl.$name) delete childEl.$name
								element[name] = childEl
							}
						}
						delete element.elements
					} else if (names.length !== namesSet.size) {
						const holder: { [key: string]: any } = {}
						for (let childEl of element.elements) {
							const name = childEl.$name
							if (childEl.$type === 'text' && Object.keys(childEl).length <= 3) {
								childEl = childEl.text
							} else if (childEl.attributes) {
								for (const key in childEl.attributes) {
									childEl[key] = childEl.attributes[key]
								}
								delete childEl.attributes
							} else {
								if (childEl.$type) delete childEl.$type
								if (childEl.$name) delete childEl.$name
							}
							if (holder[name]) {
								holder[name].push(childEl)
							} else {
								holder[name] = [childEl]
							}
						}
						for (const key in holder) {
							element[key] = holder[key].length > 1 ? holder[key] : holder[key][0]
						}
						delete element.elements
					}
				}
			}
		}
	}
	concatChildrenAndTraverseObject(object)

	return object
}
export function addTextElement(
	root: XMLBuilder.XMLElement,
	elementName: string,
	text?: string | number | null | IMOSString128 | IMOSTime | IMOSDuration,
	attributes?: { [key: string]: string },
	strict = true
): XMLBuilder.XMLElement {
	return addTextElementInternal(root, elementName, text, attributes, strict)
}
export function addTextElementInternal(
	root: XMLBuilder.XMLElement,
	elementName: string,
	text: string | number | null | IMOSString128 | IMOSTime | IMOSDuration | undefined,
	attributes: { [key: string]: string } | undefined,
	strict: boolean
): XMLBuilder.XMLElement {
	const mosTypes = getMosTypes(strict)
	let txt
	if (text === null) {
		txt = null
	} else if (text !== undefined) {
		const stringified = stringifyMosType(text, mosTypes)
		if (stringified.isMosType) txt = stringified.stringValue
		else txt = text.toString()
	} else {
		txt = undefined
	}
	const element = root.element(elementName, attributes || {}, txt)
	return element
}
/**
 * Utility-function to convert a XMLBuilder.XMLElement into the generic object which can be sent
 * into the ***.fromXML(xml:any) methods in MosModel
 */
export function xmlToObject(root: XMLBuilder.XMLElement): any {
	const obj: any = {}
	let hasAttribs = false

	if (root.attribs) {
		for (const attr of Object.values<XMLBuilder.XMLAttribute>(root.attribs)) {
			hasAttribs = true
			if (!obj.attributes) obj.attributes = {}
			obj.attributes[attr.name] = attr.value
		}
	}
	// @ts-expect-error hack
	if (root.children.length === 1 && root.children[0].name === '#text') {
		if (hasAttribs) {
			// @ts-expect-error hack
			obj.text = root.children[0].value
			return obj
		} else {
			// @ts-expect-error hack
			return root.children[0].value
		}
	}

	for (const child of root.children) {
		if ((child as any).name) {
			const ch = child as XMLBuilder.XMLElement
			if (obj[ch.name]) {
				if (!Array.isArray(obj[ch.name])) {
					obj[ch.name] = [obj[ch.name]] // make an array
				}
				obj[ch.name].push(xmlToObject(ch))
			} else {
				obj[ch.name] = xmlToObject(ch)
			}
		}
	}

	return obj
}
