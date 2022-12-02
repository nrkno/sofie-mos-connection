import * as moment from 'moment'
import { IMOSTime } from '@mos-connection/model'
import { pad } from './../utils/Utils'

export class MosTime implements IMOSTime {
	static _defaultTimezone = 'Z'
	private _time: Date
	private _timezone = ''
	private _timezoneZuluIndicator = ''
	private _timezoneDeclaration = ''

	/** */
	constructor(timestamp?: Date | number | string) {
		let time: Date
		if (timestamp !== undefined) {
			// create date from time-string or timestamp number
			if (typeof timestamp === 'number') {
				time = new Date(timestamp)
			} else if (typeof timestamp === 'string') {
				// formats:
				// YYYY-MM-DD'T'hh:mm:ss[,ddd]['Z']
				// Sun Feb 25 2018 08:59:08 GMT+0100 (CET)
				// 2018-02-25T08:00:45.528Z

				// parse out custom Z indicator (mos-centric)
				const customFormatParseResult = this._parseMosCustomFormat(timestamp)
				// parse out custom timezones (mos local-local centric format)
				const timezoneParseResult = this._parseTimeOffset(timestamp)

				if (customFormatParseResult !== false) {
					this._timezone = customFormatParseResult.timezoneIndicator
					this._timezoneZuluIndicator = customFormatParseResult.timezoneIndicator

					const r = customFormatParseResult
					const dateStr = `${r.yy}-${r.mm}-${r.dd}T${r.hh}:${r.ii}:${r.ss}${r.ms ? '.' + r.ms : ''}${
						this._timezoneZuluIndicator
					}${this._timezoneDeclaration}`
					time = new Date(dateStr)
				} else if (timezoneParseResult !== false) {
					this._timezoneDeclaration = timezoneParseResult.timezoneDeclaration

					time = new Date(timestamp)
				} else {
					// try to parse the time directly with Date, for Date-supported formats
					time = new Date(timestamp)
					// if (isNaN(time.getTime())) {
					// 	// can't match custom format
					// 	// will be caught as invalid timestamp further down
					// }
				}
			} else {
				// received Date object
				time = timestamp
			}
		} else {
			// no timestamp, create Date now
			time = new Date()
		}

		if (isNaN(time.getTime())) {
			throw new Error(`Invalid timestamp: "${timestamp}"`)
		}

		// date created
		this._time = time
	}

	/** */
	toString(): string {
		const t = moment.utc(this._time).utcOffset(this._timezone)

		return t.format('YYYY-MM-DDTHH:mm:ss,SSS##!!##').replace('##!!##', this._timezone)
	}

	/** */
	getTime(): number {
		return this._time.getTime()
	}
	setTime(timestamp: number): number {
		return this._time.setTime(timestamp)
	}

	/** */
	private _parseTimeOffset(timestamp: string): false | { timeOffsetValue: number; timezoneDeclaration: string } {
		let timeOffsetValue: number
		let timezoneDeclaration = ''
		const offsetregex = /([+-])([0-9]{1,2})(?::{0,1}([0-9]{2})){0,1}(?: {0,1}\(\S+\)){0,1}$/
		const match = timestamp.match(offsetregex)
		if (match) {
			let positiveNegativeValue = 0
			let hours = 0
			let minutes = 0
			if (match.length >= 2) {
				positiveNegativeValue = match[1] === '+' ? 1 : positiveNegativeValue
				positiveNegativeValue = match[1] === '-' ? -1 : positiveNegativeValue
				timezoneDeclaration = match[1]
			}
			if (match.length >= 3) {
				hours = parseInt(match[2], 10)
				timezoneDeclaration += pad(hours.toString(), 2)
			}
			if (match.length >= 4) {
				minutes = parseInt(match[3], 10)
				timezoneDeclaration += ':' + pad(minutes.toString(), 2)
			}
			timeOffsetValue = (hours * 60 + minutes) * positiveNegativeValue
			return {
				timeOffsetValue,
				timezoneDeclaration,
			}
		}
		return false
	}

	/** */
	private _parseMosCustomFormat(timestamp: string):
		| false
		| {
				yy: string
				mm: string
				dd: string
				hh: string
				ii: string
				ss: string
				ms: string
				timezoneIndicator: string
		  } {
		const timestampRegex = /(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)([,.](\d{3}))?(([+-Z])([:\d]+)?)?/i
		const match = timestamp.match(timestampRegex)
		if (match) {
			const yy = pad(match[1], 4)
			const mm = pad(match[2], 2)
			const dd = pad(match[3], 2)
			const hh = pad(match[4], 2)
			const ii = pad(match[5], 2)
			const ss = pad(match[6], 2)
			const ms = match[8]
			let timezoneIndicator = match[9] || MosTime._defaultTimezone

			const m = timezoneIndicator.match(/([+-])(\d+):(\d+)/) // +5:00,  -05:00
			if (m) {
				const tzSign = m[1]
				let tzHours = m[2]
				let tzMinutes = m[3]
				if (tzHours.length === 1) tzHours = '0' + tzHours
				if (tzMinutes.length === 1) tzMinutes = '0' + tzMinutes
				timezoneIndicator = tzSign + tzHours + ':' + tzMinutes
			}

			return {
				yy,
				mm,
				dd,
				hh,
				ii,
				ss,
				ms,
				timezoneIndicator,
			}
		}

		return false
	}
}
