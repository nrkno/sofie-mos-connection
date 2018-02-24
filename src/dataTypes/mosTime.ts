import {pad} from './../utils/Utils'

export class MosTime {

	private static timestampRegex = /(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)([,\.](\d{3}))?(([+-Z])([:\d]+)?)?/i

	private _time: Date

	constructor (timestamp?: Date | number | string) {
		let time: Date
		if (timestamp !== undefined) {
			// create date from time-string or timestamp number
			if (typeof timestamp === 'number') {
				time = new Date(timestamp)
				if (isNaN(time.getTime())) {
					throw new Error('Invalid timestamp')
				}
			} else if (typeof timestamp === 'string') {
				// "YYYY-MM-DD'T'hh:mm:ss[,ddd]['Z']""

				let match = timestamp.match(MosTime.timestampRegex)

				if (!match) throw new Error('Invalid timestamp')

				let yy = pad(match[1], 4)
				let mm = pad(match[2], 2)
				let dd = pad(match[3], 2)

				let hh = pad(match[4], 2)
				let ii = pad(match[5], 2)
				let ss = pad(match[6], 2)

				let ms = match[8]
				let tzSign = match[10]
				let tzTime = match[11]

				let dateStr = `${yy}-${mm}-${dd}T${hh}:${ii}:${ss}${(ms ? '.' + ms : '')}${tzSign === 'Z' ? tzSign : tzTime ? tzSign + pad(tzTime, 5) : ''}`

				time = new Date(dateStr)
				if (isNaN(time.getTime())) {
					throw new Error(`Invalid timestamp: "${timestamp}"`)
				}
			} else {
				// received Date object
				// @todo: check if it is a valid Date object, or trust TS?
				time = timestamp
			}

		} else {
			// no timestamp, create Date now
			time = new Date()
		}

		if (isNaN(time.getTime())) {
			throw new Error('Invalid timestamp')
		}

		this._time = time
	}

	/** */
	toString (): string {
		let ISOstring = this._time.toISOString()

	// remove last character (timezone identificator), to be MOS time format compliant
		return ISOstring.slice(0, -5)
	}

	/** */
	getTime (): number {
		return this._time.getTime()
	}
}
