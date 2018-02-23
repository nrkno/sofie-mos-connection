export default class MosString128 {

  private _str: string

    /** */
  constructor (str: string) {

    this._str = str

    this.validate()
  }

  toString (): string {
    return this._str
  }
  set set (str: string) {
    this._str = str
    this.validate()
  }
  private validate () {
    if ((this._str || '').length > 128) throw new Error('String length is too long!')
  }
}
