"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MosString128 {
    /** */
    constructor(str) {
        this.string = '' + str + '';
    }
    /** */
    toString() {
        return this._str;
    }
    /** */
    set string(str) {
        this._str = str;
        this._validate();
    }
    /** */
    _validate() {
        if ((this._str || '').length > 128)
            throw new Error('String length is too long!');
    }
}
exports.MosString128 = MosString128;
//# sourceMappingURL=mosString128.js.map