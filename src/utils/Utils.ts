import { xml2js as xmlParser } from 'xml-js'

/** */
export function pad (n: string, width: number, z?: string): string {
	z = z || '0'
	n = n + ''
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

export function xml2js (messageString: string): object {
	let object = xmlParser(messageString, { compact: false, trim: true, nativeType: true })
	// common tags we typically want to know the order of the contents of:
	const orderedTags = new Set([ 'mosAbstract', 'description', 'p', 'em', 'span', 'h1', 'h2', 'i', 'b' ])

	const concatChildrenAndTraverseObject = (element: {[key: string]: any }) => {
		if (element.elements) {
			if (element.elements.length === 1) {
				const childEl = element.elements[0]
				const name = childEl.name || childEl.type || 'unknownElement'
				if (childEl.type && childEl.type === 'text') {
					element.type = 'text'
					Object.defineProperty(element, 'text', Object.getOwnPropertyDescriptor(childEl, 'text')!)
					delete childEl.attributes
				} else {
					delete childEl.name
					delete childEl.type
					Object.defineProperty(
						element,
						name,
						Object.getOwnPropertyDescriptor(element.elements, 0)!
					)
				}
				delete element.elements
				concatChildrenAndTraverseObject(childEl)
				if (childEl.type === 'text' && !childEl.attributes) {
					element[name] = childEl.text
				}
			} else if (element.elements.length > 1) {
				for (const childEl of element.elements) {
					concatChildrenAndTraverseObject(childEl)
				}

				let names: Array<string> = element.elements.map((obj: { name?: string, type?: string }) => obj.name || obj.type || 'unknownElement')
				let namesSet = new Set(names)
				if ((namesSet.size === 1 && names.length !== 1) && !namesSet.has('type') && !namesSet.has('name')) {
					// make array compact:
					const array: any = []
					for (const childEl of element.elements) {
						if (childEl.type && childEl.type === 'text') {
							if (childEl.text) array.push(childEl.text)
							if (childEl.text) array.push(childEl.text)
						} else {
							if (childEl.type) delete childEl.type
							if (childEl.name) delete childEl.name
							if (Object.keys(childEl).length > 1) {
								// might contain something useful like attributes
								array.push(childEl)
							} else {
								array.push(childEl[Object.keys(childEl)[0]])
							}
						}
					}
					element[names[0]] = array
					delete element.elements
				} else if (names.length === namesSet.size && !orderedTags.has(element.name)) {
					for (const childEl of element.elements) {
						if (childEl.type && childEl.type === 'text' && !childEl.attributes) {
							if (!childEl.text) {
								element.text = childEl.text
							}
							element[childEl.name] = childEl.text
						} else {
							const name = childEl.name || childEl.type || 'unknownEl'
							if (childEl.type) delete childEl.type
							if (childEl.name) delete childEl.name
							element[name] = childEl
						}
					}
					delete element.elements
				} else if (names.length !== namesSet.size && !orderedTags.has(element.name)) {
					const holder: {[key: string]: any} = {}
					for (let childEl of element.elements) {
						const name = childEl.name
						if (childEl.type === 'text') {
							childEl = childEl.text
						}
						if (holder[name]) {
							holder[name].push(childEl)
						} else {
							holder[name] = [ childEl ]
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
	concatChildrenAndTraverseObject(object)

	return object
}
