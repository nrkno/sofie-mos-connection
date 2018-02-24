export class MosString128 {

	private _str: string

	/** */
	constructor (str: string) {
		this.string = str
	}

	/** */
	toString (): string {
		return this._str
	}

	/** */
	set string (str: string) {
		this._str = str
		this._validate()
	}

	/** */
	private _validate () {
		if ((this._str || '').length > 128) throw new Error('String length is too long!')
	}
}
