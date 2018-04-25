import * as parser from 'xml2json'

let data = '<mos><tag>content 1</tag><otherTag>content 2</otherTag><tag>content 3</tag></mos>'
console.log(JSON.stringify(parser.toJson(data, {
	object: true,
	coerce: true,
	trim: true,
	arrayNotation: true,
	// alternateTextNode: true,
	reversible: true
}), ' ', 3))
