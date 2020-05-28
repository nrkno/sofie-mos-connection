export function isEmpty (obj: any) {
	if (typeof obj === 'object') {
		for (let prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				return false
			}
		}
		return JSON.stringify(obj) === JSON.stringify({})
	} else {
		return !obj
	}
}
