export default class MosTime {

  private _time: Date

    /** */
  constructor (timestamp?: Date|number|string) {
    let time: Date
    if (timestamp) {
      // create date from time-string or timestamp number
      if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        time = new Date(timestamp.toString())
        if (isNaN(time.getTime())) {
          throw new Error('Invalid timestamp')
        }
      }else {
        // received Date object
        // @todo: check if it is a valid Date object, or trust TS?
        time = timestamp
      }

    }else {
      // no timestamp, create Date now
      time = new Date()
    }

    if (isNaN(time.getTime())) {
      throw new Error('Invalid timestamp')
    }

    this._time = time
  }

  toString (): string {
    let ISOstring: string = this._time.toISOString()

    // remove last character (timezone identificator), to be MOS time format compliant
    return ISOstring.slice(0, -1)
  }
}
