"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const Utils_1 = require("./../utils/Utils");
class MosTime {
    /** */
    constructor(timestamp) {
        this._timezoneZuluIndicator = '';
        this._timezoneDeclaration = '';
        this._timeOffsetValue = 0;
        let time;
        if (timestamp !== undefined) {
            // create date from time-string or timestamp number
            if (typeof timestamp === 'number') {
                time = new Date(timestamp);
            }
            else if (typeof timestamp === 'string') {
                // formats:
                // YYYY-MM-DD'T'hh:mm:ss[,ddd]['Z']
                // Sun Feb 25 2018 08:59:08 GMT+0100 (CET)
                // 2018-02-25T08:00:45.528Z
                // parse out custom timezones (mos local-local centric format)
                let timezoneParseResult = this._parseTimeOffset(timestamp);
                if (timezoneParseResult !== false) {
                    this._timezoneDeclaration = timezoneParseResult.timezoneDeclaration;
                    this._timeOffsetValue = timezoneParseResult.timeOffsetValue;
                }
                // parse out custom Z indicator (mos-centric)
                let customFormatParseResult = this._parseMosCustomFormat(timestamp);
                if (customFormatParseResult !== false) {
                    this._timezoneZuluIndicator = customFormatParseResult.timezoneIndicator;
                }
                // try to parse the time directly with Date, for Date-supported formats
                time = new Date(timestamp);
                if (isNaN(time.getTime())) {
                    if (customFormatParseResult !== false) {
                        let dateStr = `${customFormatParseResult.yy}-${customFormatParseResult.mm}-${customFormatParseResult.dd}T${customFormatParseResult.hh}:${customFormatParseResult.ii}:${customFormatParseResult.ss}${(customFormatParseResult.ms ? '.' + customFormatParseResult.ms : '')}${this._timezoneZuluIndicator}${this._timezoneDeclaration}`;
                        time = new Date(dateStr);
                    }
                    else {
                        // can't match custom format
                        // will be caught as invalid timestamp further down
                    }
                }
            }
            else {
                // received Date object
                time = timestamp;
            }
        }
        else {
            // no timestamp, create Date now
            time = new Date();
        }
        if (isNaN(time.getTime())) {
            throw new Error(`Invalid timestamp: "${timestamp}"`);
        }
        // date created
        this._time = time;
    }
    /** */
    toString() {
        if (!this._timezoneDeclaration) {
            return moment.utc(this._time).format(`YYYY-MM-DDTHH:mm:ss,SSS${this._timezoneZuluIndicator.length ? '##!!##' : 'Z'}`).replace('+00:00', '').replace('##!!##', this._timezoneZuluIndicator);
        }
        else {
            return moment.utc(this.getTime()).add(this._timeOffsetValue, 'minutes').format(`YYYY-MM-DDTHH:mm:ss,SSS${this._timezoneDeclaration}`).replace('+00:00', '');
        }
    }
    /** */
    getTime() {
        return this._time.getTime();
    }
    /** */
    _parseTimeOffset(timestamp) {
        let timeOffsetValue;
        let timezoneDeclaration = '';
        const offsetregex = /([+-])([0-9]{1,2})(?:\:{0,1}([0-9]{2})){0,1}(?: {0,1}\(\S+\)){0,1}$/;
        let match = timestamp.match(offsetregex);
        if (match) {
            let positiveNegativeValue = 0;
            let hours = 0;
            let minutes = 0;
            if (match.length >= 2) {
                positiveNegativeValue = match[1] === '+' ? 1 : positiveNegativeValue;
                positiveNegativeValue = match[1] === '-' ? -1 : positiveNegativeValue;
                timezoneDeclaration = match[1];
            }
            if (match.length >= 3) {
                hours = parseInt(match[2], 10);
                timezoneDeclaration += Utils_1.pad(hours.toString(), 2);
            }
            if (match.length >= 4) {
                minutes = parseInt(match[3], 10);
                timezoneDeclaration += ':' + Utils_1.pad(minutes.toString(), 2);
            }
            timeOffsetValue = ((hours * 60) + minutes) * positiveNegativeValue;
            return {
                timeOffsetValue,
                timezoneDeclaration
            };
        }
        return false;
    }
    /** */
    _parseMosCustomFormat(timestamp) {
        const timestampRegex = /(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)([,\.](\d{3}))?(([+-Z])([:\d]+)?)?/i;
        let match = timestamp.match(timestampRegex);
        if (match) {
            let yy = Utils_1.pad(match[1], 4);
            let mm = Utils_1.pad(match[2], 2);
            let dd = Utils_1.pad(match[3], 2);
            let hh = Utils_1.pad(match[4], 2);
            let ii = Utils_1.pad(match[5], 2);
            let ss = Utils_1.pad(match[6], 2);
            let ms = match[8];
            let timezoneIndicator = match[10] ? match[10].toUpperCase() : match[10];
            timezoneIndicator = timezoneIndicator === 'Z' ? timezoneIndicator : '';
            return {
                yy,
                mm,
                dd,
                hh,
                ii,
                ss,
                ms,
                timezoneIndicator
            };
        }
        return false;
    }
}
exports.MosTime = MosTime;
//# sourceMappingURL=mosTime.js.map