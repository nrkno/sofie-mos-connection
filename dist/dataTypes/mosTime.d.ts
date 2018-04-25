export declare class MosTime {
    private _time;
    private _timezoneZuluIndicator;
    private _timezoneDeclaration;
    private _timeOffsetValue;
    /** */
    constructor(timestamp?: Date | number | string);
    /** */
    toString(): string;
    /** */
    getTime(): number;
    /** */
    private _parseTimeOffset(timestamp);
    /** */
    private _parseMosCustomFormat(timestamp);
}
