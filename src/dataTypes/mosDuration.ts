export class MosDuration {
	private _duration: number // seconds

	/** */
	constructor(str: string) {
		const m = str.match(/([\d]+):([\d]+):([\d]+)/)
		if (!m) throw Error('MosDuration: Invalid format!')

		const hh: number = parseInt(m[1], 10)
		const mm: number = parseInt(m[2], 10)
		const ss: number = parseInt(m[3], 10)

		if (isNaN(hh) || isNaN(mm) || isNaN(ss)) throw Error('MosDuration: Invalid format!')

		this._duration = hh * 3600 + mm * 60 + ss
	}
	/** */
	toString(): string {
		let s = this._duration

		const hh = Math.floor(s / 3600)
		s -= hh * 3600

		const mm = Math.floor(s / 60)
		s -= mm * 60

		const ss = Math.floor(s)

		return hh + ':' + mm + ':' + ss
	}

	/** */
	valueOf(): number {
		return this._duration
	}
}
