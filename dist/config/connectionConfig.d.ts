/** */
export interface IConnectionConfig {
    mosID: string;
    acceptsConnections: boolean;
    accepsConnectionsFrom?: string[];
    profiles: IProfiles;
    debug?: boolean;
    openRelay?: boolean;
}
/** */
export interface IProfiles {
    [key: string]: boolean | undefined;
    '0': boolean;
    '1'?: boolean;
    '2'?: boolean;
    '3'?: boolean;
    '4'?: boolean;
    '5'?: boolean;
    '6'?: boolean;
    '7'?: boolean;
}
export declare class ConnectionConfig implements IConnectionConfig {
    mosID: string;
    acceptsConnections: boolean;
    accepsConnectionsFrom: string[];
    debug?: boolean;
    openRelay?: boolean;
    private _profiles;
    constructor(init: IConnectionConfig);
    /** */
    /** */
    profiles: IProfiles;
}
