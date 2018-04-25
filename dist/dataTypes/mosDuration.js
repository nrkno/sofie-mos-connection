"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MosDuration {
    /** */
    constructor(str) {
        let m = str.match(/([\d]+):([\d]+):([\d]+)/);
        if (!m)
            throw Error('MosDuration: Invalid format!');
        let hh = parseInt(m[1], 10);
        let mm = parseInt(m[2], 10);
        let ss = parseInt(m[3], 10);
        if (isNaN(hh) || isNaN(mm) || isNaN(ss))
            throw Error('MosDuration: Invalid format!');
        this._duration = hh * 3600 + mm * 60 + ss;
    }
    /** */
    toString() {
        let s = this._duration;
        let hh = Math.floor(s / 3600);
        s -= s * 3600;
        let mm = Math.floor(s / 60);
        s -= s * 60;
        let ss = Math.floor(s);
        return hh + ':' + mm + ':' + ss;
    }
    /** */
    valueOf() {
        return this._duration;
    }
}
exports.MosDuration = MosDuration;
//# sourceMappingURL=mosDuration.js.map