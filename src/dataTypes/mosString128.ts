export class MosString128 {

	private _str: string

	/** */
	constructor (str: any) {
		if (typeof str === 'object') {
			if (str.text) {
				this.string = str.text
			} else if (Object.keys(str).length === 0) { // is empty?
				this.string = ''
			} else {
				this.string = JSON.stringify(str)
			}
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
		if ((this._str || '').length > 128) throw new Error('MosString128 length is too long (' + this._str + ')!')
	}
}
