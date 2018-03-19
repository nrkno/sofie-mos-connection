import {ProfilesSupport} from './config/connectionConfig';
import {MosTime} from './dataTypes/mosTime'
import {MosString128} from './dataTypes/mosString128'
import {IMOSListMachInfo} from "./mosModel/0_listMachInfo"

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
	/* Profile 0 */
	/*  */
	getMachineInfo?: () => Promise<IMOSListMachInfo> 
	/* Emitted when the connection status has changed */
	onConnectionChange?: (cb:(connectionStatus:IMOSConnectionStatus) => void) => void

	getConnectionStatus?: () => IMOSConnectionStatus

	/* Profile 1 */
	onRequestMOSObject?: (cb:(objId: string) => Promise<IMOSObject | null>) => void
	onRequestAllMOSObjects?: (cb:() => Promise<Array<IMOSObject>>) => void
	getMOSObject?: (objId: string) => Promise<IMOSObject>
	getAllMOSObjects?: () => Promise<Array<IMOSObject>>

	/* Profile 2 */
	onCreateRunningOrder?: (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) => void
	onReplaceRunningOrder?: (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) => void
	onDeleteRunningOrder?: (cb: (runningOrderId: MosString128) => Promise<IMOSROAck>) => void

	onRequestRunningOrder?: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void // get roReq, send roList
	getRunningOrder?: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null> // send roReq, get roList

	onMetadataReplace?: (cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>) => void

	onRunningOrderStatus?: (cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>) => void // get roElementStat
	onStoryStatus?: (cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>) => void // get roElementStat
	onItemStatus?: (cb: (status: IMOSItemStatus) => Promise<IMOSROAck>) => void // get roElementStat

	setRunningOrderStatus?: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck> // send roElementStat
	setStoryStatus?: (status: IMOSStoryStatus) => Promise<IMOSROAck> // send roElementStat
	setItemStatus?: (status: IMOSItemStatus) => Promise<IMOSROAck> // send roElementStat

	onReadyToAir?: (cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>) => void
	onROInsertStories?: (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => IMOSROAck) => void
	onROInsertItems?: (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => IMOSROAck) => void
	onROReplaceStories?: (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => IMOSROAck) => void
	onROReplaceItems?: (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => IMOSROAck) => void
	onROMoveStories?: (cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => IMOSROAck) => void
	onROMoveItems?: (cb: (Action: IMOSItemAction, Items: Array<MosString128>) => IMOSROAck) => void
	onRODeleteStories?: (cb: (Action: IMOSROAction, Stories: Array<MosString128>) => IMOSROAck) => void
	onRODeleteItems?: (cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => IMOSROAck) => void
	onROSwapStories?: (cb: (Action: IMORSROAction, StoryID0: MosString128, StoryID1: MosString128) => IMOSROAck) => void
	onROSwapItems?: (cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => IMOSROAck) => void
	/* Profile 3 */
	/* Profile 4 */
	// roStorySend:
	onStory?: (cb: (story: IMOSROFullStory) => Promise<any>) => void
}
export interface IMOSROAction {
	RunningOrderID: MosString128
}
export interface IMOSStoryAction extends IMOSROAction {
	StoryID: MosString128
}
export interface IMOSItemAction extends IMOSStoryAction {
	ItemID: MosString128
}
export interface IMOSROReadyToAir {
	ID: MosString128
	Status: IMOSObjectAirStatus
}
export interface IMOSRunningOrderStatus {
	ID: MosString128
	Status: IMOSObjectStatus
	Time: MosTime
}
export interface IMOSStoryStatus {
	RunningOrderId: MosString128
	ID: MosString128
	Status: IMOSObjectStatus
	Time: MosTime
}
export interface IMOSItemStatus {
	RunningOrderId: MosString128
	StoryId: MosString128
	ID: MosString128
	Status: IMOSObjectStatus
	Time: MosTime
}
export interface IMOSRunningOrderBase {
	ID: MosString128
	Slug: MosString128
	DefaultChannel?: MosString128
	EditorialStart?: MosTime
	EditorialDuration?: MosDuration
	Trigger?: any // TODO: Johan frågar vad denna gör
	MacroIn?: MosString128
	MacroOut?: MosString128
	MosExternalMetaData?: Array<IMOSExternalMetaData>
}
export interface IMOSRunningOrder extends IMOSRunningOrderBase {
	Stories: Array<IMOSROStory>
}
export interface IMOSStory {
	ID: MosString128
	Slug?: MosString128
	Number?: MosString128
	MosExternalMetaData?: Array<IMOSExternalMetaData>
}
export interface IMOSROStory extends IMOSStory {
	Items: Array<IMOSItem>
}
export interface IMOSROFullStory extends IMOSStory {
	RunningOrderId: MosString128
	Body: Array<IMOSROFullStoryBodyItem>
}
export interface IMOSROFullStoryBodyItem {
	Type: string // enum, whatever?
	Content: any | IMOSItem // maybe not, maybe something else? IMOSItemObject??
}
export interface IMOSItem {
	ID: MosString128
	Slug?: MosString128
	ObjectID: MosString128
	MOSID: string
	mosAbstract?: string
	Paths?: Array<IMOSObjectPath>
	Channel?: MosString128
	EditorialStart?: MosTime
	EditorialDuration?: MosDuration
	UserTimingDuration: number
	Trigger: any // TODO: Johan frågar
	MacroIn?: MosString128
	MacroOut?: MosString128
	MosExternalMetaData?: Array<IMOSExternalMetaData>
}

export type MosDuration = string // HH:MM:SS

export interface IMOSROAck {
	ID: MosString128
	Status: MosString128 // OK or error desc
	Stories: Array<IMOSROAckStory>
}

export interface IMOSROAckStory {
	ID: MosString128 // storyID
	Items: Array<IMOSROAckItem>
}

export interface IMOSROAckItem {
	ID: MosString128
	Channel: MosString128
	Objects: Array<IMOSROAckObject>
}

export interface IMOSROAckObject {
	Status: IMOSObjectStatus
}

// /** */
// export type IPAddress = string;

// /** */
export interface IMOSConnectionStatus {
 	PrimaryConnected: boolean
	PrimaryStatus: string // if not connected this will contain human-readable error-message
 	SecondaryConnected: boolean
	SecondaryStatus: string // if not connected this will contain human-readable error-message
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

export interface IMOSObject {
	ID: MosString128
	Slug: MosString128
	MosAbstract?: string
	Group?: string
	Type: IMOSObjectType
	TimeBase: number
	Revision: number // max 999
	Duration: number
	Status: IMOSObjectStatus
	AirStatus: IMOSObjectAirStatus
	Paths: Array<IMOSObjectPath>
	CreatedBy: MosString128
	Created: MosTime
	ChangedBy: MosString128
	Changed: MosTime
	Description: string
	mosExternalMetaData?: Array<IMOSExternalMetaData>
}

export interface IMOSExternalMetaData {
	MosScope?: string
	MosSchema: string
	MosPayload: any
}

export enum IMOSObjectType {
	STILL = "STILL",
	AUDIO = "AUDIO",
	VIDEO = "VIDEO"
}

export enum IMOSObjectStatus {
	NEW = "NEW",
	UPDATED = "UPDATED",
	MOVED = "MOVED",
	BUSY = "BUSY",
	DELETED = "DELETED",
	NCS_CTRL = "NCS CTRL",
	MANUAL_CTRL = "MANUAL CTRL",
	READY = "READY",
	NOT_READY = "NOT READY",
	PLAY = "PLAY",
	STOP = "STOP"
}

export enum IMOSObjectAirStatus {
	READY = "READY",
	NOT_READY = "NOT READY"
}

export interface IMOSObjectPath {
	Type: IMOSObjectPathType
	Description: string
	Target: string // Max 255
}

export enum IMOSObjectPathType {
	PATH = "PATH",
	PROXY_PATH = "PROXY PATH",
	METADATA_PATH = "METADATA PATH"
}
