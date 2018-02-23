function pad (n: string, width: number, z?: string): string {
  z = z || '0'
  n = n + ''
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

export default class MosTime {

  private _time: Date

  /** */
  constructor (timestamp?: Date|number|string) {
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

        let m = timestamp.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)([,\.](\d{3}))?(([+-Z])([:\d]+)?)?/)

        if (!m) throw new Error('Invalid timestamp')

        let yy = pad(m[1], 4)
        let mm = pad(m[2], 2)
        let dd = pad(m[3], 2)

        let hh = pad(m[4], 2)
        let ii = pad(m[5], 2)
        let ss = pad(m[6], 2)

        let ms = m[8]
        let tzSign = m[10]
        let tzTime = m[11]

        let dateStr = yy + '-' + mm + '-' + dd + 'T' + hh + ':' + ii + ':' + ss +
        (ms ? '.' + ms : '' ) +
        (tzSign === 'Z' ? tzSign : tzTime + pad(tzTime,5))

        time = new Date(dateStr)
        if (isNaN(time.getTime())) {
          throw new Error('Invalid timestamp')
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
  toString (): string {
    let ISOstring: string = this._time.toISOString()

    // remove last character (timezone identificator), to be MOS time format compliant
    return ISOstring.slice(0, -1)
  }
  getTime (): number {
    return this._time.getTime()
  }
}
