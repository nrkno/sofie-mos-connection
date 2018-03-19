import {ProfilesSupport} from './config/connectionConfig';

// import {IListMachInfo as IMOSP0ListMachineInfo, IListMachInfo} from "./mosModel/0_listMachInfo"
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
// 	getMachineInfo:() => Promise<IListMachInfo>
// 	heartBeat:() => Promise<HeartBeat>
// }

export interface IMosConnection {
	readonly isListening: Promise<boolean[]>

	readonly acceptsConnections: boolean
	readonly profiles: ProfilesSupport
	readonly isCompliant: boolean
	readonly complianceText: string

	dispose (): Promise<void>
	// onConnection:(cb:(mosDevice:IMOSDevice) => void) => void,
	// connect:(ncs:IMOSDeviceConnectionOptions) => Promise<IMOSDevice> // resolved when connection has been made (before .onConnection is fired)
}

// /** */
// export type IPAddress = string;

// /** */
// export interface IMOSConnectionStatus {
// 	primaryConnected: boolean,
// 	secondaryConnected: boolean,
// }
