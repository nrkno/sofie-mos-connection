export class MosString128 {

	private _str: string

	/** */
	constructor (str: any) {
		if (typeof str === 'object' && str.text) {
			this.string = str.text
		} else {
			this.string = '' + str + ''
		}
	}
	/** */
	toString (): string {
		return this._str
	}

	/** */
	set string (str: string | { text: string, type: string }) {
		if (typeof str === 'object' && str.type === 'text') {
			this._str = str.text
		} else {
			this._str = '' + str + ''
		}
		this._validate()
	}

	/** */
	private _validate () {
		if ((this._str || '').length > 128) throw new Error('String length is too long!')
	}
}
