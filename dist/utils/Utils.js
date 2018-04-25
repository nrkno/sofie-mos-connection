"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** */
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
exports.pad = pad;
//# sourceMappingURL=Utils.js.map