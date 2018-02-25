import {IListMachInfo} from "./mosModel/0_listMachInfo"


export type IPAddress = string;

export interface IMosConnectionOptions {
	acceptConnections: boolean, // default:true
	acceptConnectionFrom: Array<IPAddress>,
	
	profiles: {
		'0': boolean,
		'1'?: boolean,
		'2'?: boolean,
		'3'?: boolean,
		'4'?: boolean,
		'5'?: boolean,
		'6'?: boolean,
		'7'?: boolean,
	}
}
export interface IMOSDeviceConnectionOptions {
	primary: {
		id: string, // ncsID ("WINSERVERSOMETHINGENPS")
		host: string, // ip-address
		ports?: {
			upper?: number, 
			lower?: number,
			query?: number
		}
	},
	secondary?: {
		id: string, // ncsID ("WINSERVERSOMETHINGENPS")
		host: string, // ip-address
		ports?: {
			upper?: number, 
			lower?: number,
			query?: number
		}
	}
}
export interface IMOSConnectionStatus {
	
	primaryConnected: boolean,
	secondaryConnected: boolean,
}

export interface IMOSDevice {
	id:string, // unique id for this device and instance (randomized upon init?)
	connectionOptions: IMOSDeviceConnectionOptions,
}
export interface IMOSDeviceP0 extends IMOSDevice {
	
	// events
	onConnectionChange:(cb:(connected:string) => void) => void

	// requests:
	getMachineInfo:() => Promise<IMOSP0MachineInfo>
}

export interface IMosConnection {
	constructor:(options:IMosConnectionOptions) => IMosConnection,

	onConnection:(cb:(mosDevice:IMOSDevice) => void) => void,
	connect:(ncs:IMOSDeviceConnectionOptions) => Promise<IMOSDevice> // resolved when connection has been made (before .onConnection is fired)
}




// ---
// alias:
export interface IMOSP0MachineInfo extends IListMachInfo {	
}
