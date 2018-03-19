import {ProfilesSupport} from './config/connectionConfig';

// import {IMOSListMachInfo as IMOSP0ListMachineInfo, IMOSListMachInfo} from "./mosModel/0_listMachInfo"
// import {HeartBeat} from './mosModel/0_heartBeat';

// /** */
// // export interface IMOSDeviceConnectionOptions {
// // 	primary: {
// // 		id: string, // ncsID or mosID ("WINSERVERSOMETHINGENPS")
// // 		host: string, // ip-address
// // 		ports?: {
// // 			upper?: number,
// // 			lower?: number,
// // 			query?: number
// // 		}
// // 	},
// // 	buddy?: {
// // 		id: string, // ncsID or mosID ("WINSERVERSOMETHINGENPS")
// // 		host: string, // ip-address
// // 		ports?: {
// // 			upper?: number,
// // 			lower?: number,
// // 			query?: number
// // 		}
// // 	}
// // }

// /** */
// export interface IMOSDevice {
// 	id:string, // unique id for this device and instance (randomized upon init?)
// 	connectionOptions: IMOSDeviceConnectionOptions,

// 	// events
// 	onConnectionChange:(cb:(connected:string) => void) => void
// }

// /** */
// export interface IMOSDeviceP0 extends IMOSDevice {
// 	// messages
// 	getMachineInfo:() => Promise<IMOSListMachInfo>
// 	heartBeat:() => Promise<HeartBeat>
// }

export interface IMosConnection {
	readonly isListening: Promise<boolean[]>

	readonly acceptsConnections: boolean
	readonly profiles: ProfilesSupport
	readonly isCompliant: boolean
	readonly complianceText: string


	dispose (): Promise<void>
	/*  */
	connect:(ncs:IMOSDeviceConnectionOptions) => Promise<IMOSDevice> // resolved when connection has been made (before .onConnection is fired)
	onConnection:(cb:(mosDevice:IMOSDevice) => void) => void
}

export interface IMOSDevice {
	/*  */
	getMachineInfo: () => Promise<IMOSListMachInfo> 
	/* Emitted when the connection status has changed */
	onConnectionChange: (cb:(connectionStatus:IMOSConnectionStatus) => void) => void
	
	getConnectionStatus: () => IMOSConnectionStatus
}

// /** */
// export type IPAddress = string;

// /** */
export interface IMOSConnectionStatus {
 	primaryConnected: boolean
	primaryStatus: string // if not connected this will contain human-readable error-message
 	secondaryConnected: boolean
	secondaryStatus: string // if not connected this will contain human-readable error-message
}

export interface IMOSDeviceConnectionOptions {
	primary: {
		id: string // hostname
		host: string // ip-addr
		ports?: {
			upper: number
			lower: number
			query: number
		}
	}
	secondary: {
		id: string // hostname
		host: string // ip-addr
		ports?: {
			upper: number
			lower: number
			query: number
		}
	}
}
