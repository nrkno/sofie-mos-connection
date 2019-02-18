import { IProfiles } from './config/connectionConfig'
import { MosTime } from './dataTypes/mosTime'
import { MosDuration } from './dataTypes/mosDuration'
import { MosString128 } from './dataTypes/mosString128'
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData'
import { IMOSListMachInfo } from './mosModel'
import { MosDevice } from './MosDevice'

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
	readonly isListening: boolean

	readonly acceptsConnections: boolean
	readonly profiles: IProfiles
	readonly isCompliant: boolean
	readonly complianceText: string

	dispose: () => Promise<void>
	/*  */
	connect: (connectionOptions: IMOSDeviceConnectionOptions) => Promise<MosDevice> // resolved when connection has been made (before .onConnection is fired)
	onConnection: (cb: (mosDevice: MosDevice) => void) => void

	on (event: 'error', listener: (error: Error) => void): this
	on (event: 'info', listener: (message: string, data?: any) => void): this
	on (event: 'rawMessage', listener: (source: string, type: string, message: string) => void): this
}

export interface IMOSDevice {
	idPrimary: string, // unique id for this device and session
	idSecondary: string | null, // unique id for this device and session (buddy)
	/* Profile 0 */
	/*  */
	getMachineInfo: () => Promise<IMOSListMachInfo>
	onGetMachineInfo: (cb: () => Promise<IMOSListMachInfo>) => void
	/* Emitted when the connection status has changed */
	onConnectionChange: (cb: (connectionStatus: IMOSConnectionStatus) => void) => void
	getConnectionStatus: () => IMOSConnectionStatus

	/* Profile 1 */
	onRequestMOSObject: (cb: (objId: string) => Promise<IMOSObject | null>) => void
	onRequestAllMOSObjects: (cb: () => Promise<Array<IMOSObject>>) => void
	getMOSObject: (objId: MosString128) => Promise<IMOSObject>
	getAllMOSObjects: () => Promise<Array<IMOSObject>>

	/* Profile 2 */
	onCreateRunningOrder: (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) => void
	onReplaceRunningOrder: (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) => void
	onDeleteRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSROAck>) => void

	onRequestRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void // get roReq, send roList
	getRunningOrder: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null> // send roReq, get roList

	onMetadataReplace: (cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>) => void

	onRunningOrderStatus: (cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>) => void // get roElementStat
	onStoryStatus: (cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>) => void // get roElementStat
	onItemStatus: (cb: (status: IMOSItemStatus) => Promise<IMOSROAck>) => void // get roElementStat

	setRunningOrderStatus: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck> // send roElementStat
	setStoryStatus: (status: IMOSStoryStatus) => Promise<IMOSROAck> // send roElementStat
	setItemStatus: (status: IMOSItemStatus) => Promise<IMOSROAck> // send roElementStat

	onReadyToAir: (cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>) => void

	onROInsertStories: (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) => void
	onROInsertItems: (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) => void
	onROReplaceStories: (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) => void
	onROReplaceItems: (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) => void
	onROMoveStories: (cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) => void
	onROMoveItems: (cb: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>) => void
	onRODeleteStories: (cb: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) => void
	onRODeleteItems: (cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>) => void
	onROSwapStories: (cb: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>) => void
	onROSwapItems: (cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>) => void
	/* Profile 3 */
	/* Profile 4 */
	getAllRunningOrders: () => Promise<Array<IMOSRunningOrderBase>> // send roReqAll
	onROStory: (cb: (story: IMOSROFullStory) => Promise<IMOSROAck>) => void // roStorySend
}
export { IMOSListMachInfo }
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
	ObjectId?: MosString128
	Channel?: MosString128
}
export interface IMOSRunningOrderBase {
	ID: MosString128 // running order id
	Slug: MosString128
	DefaultChannel?: MosString128
	EditorialStart?: MosTime
	EditorialDuration?: MosDuration
	Trigger?: MosString128 // TODO: Johan frågar vad denna gör
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
	ObjectSlug?: MosString128
	ObjectID: MosString128
	MOSID: string
	mosAbstract?: string
	Paths?: Array<IMOSObjectPath>
	Channel?: MosString128
	EditorialStart?: number
	EditorialDuration?: number
	Duration?: number
	TimeBase?: number
	UserTimingDuration?: number
	Trigger?: any // TODO: Johan frågar
	MacroIn?: MosString128
	MacroOut?: MosString128
	MosExternalMetaData?: Array<IMOSExternalMetaData>
	MosObjects?: Array<IMOSObject>
}

export type MosDuration = MosDuration // HH:MM:SS

export interface IMOSAck {
	ID: MosString128
	Revision: Number // max 999
	Status: IMOSAckStatus
	Description: MosString128
}

export interface IMOSROAck {
	ID: MosString128 // Running order id
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
	/** Connection options for the Primary NCS-server */
	primary: {
		/** Name (NCS ID) of the NCS-server */
		id: string
		/** Host address (IP-address) of the NCS-server  */
		host: string // ip-addr
		/** (Optional): Custom ports for communication */
		ports?: {
			upper: number
			lower: number
			query: number
		},
		/** (Optional) Timeout for commands (ms) */
		timeout?: number
	}
	/** Connection options for the Secondary (Buddy) NCS-server */
	secondary?: {
		/** Name (NCS ID) of the Buddy NCS-server */
		id: string
		/** Host address (IP-address) of the NCS-server  */
		host: string
		/** (Optional): Custom ports for communication */
		ports?: {
			upper: number
			lower: number
			query: number
		},
		/** (Optional) Timeout for commands (ms) */
		timeout?: number
	}
}

export interface IMOSObject {
	ID?: MosString128
	Slug: MosString128
	MosAbstract?: string
	Group?: string
	Type: IMOSObjectType
	TimeBase: number
	Revision?: number // max 999
	Duration: number
	Status?: IMOSObjectStatus
	AirStatus?: IMOSObjectAirStatus
	Paths: Array<IMOSObjectPath>
	CreatedBy?: MosString128
	Created?: MosTime
	ChangedBy?: MosString128 // if not present, defaults to CreatedBy
	Changed?: MosTime // if not present, defaults to Created
	Description?: any // xml json
	MosExternalMetaData?: Array<IMOSExternalMetaData>
	MosItemEditorProgID?: MosString128
}

export interface IMosObjectList {
	username: string
	queryID: string
	listReturnStart: string
	listReturnEnd: string
	listReturnTotal: string
	listReturnStatus?: string
	list?: Array<IMOSObject>
}

export interface IMosRequestObjectList {
	username: string
	queryID: string
	listReturnStart: string
	listReturnEnd: string
	generalSearch: string
	mosSchema: string
	searchGroups: Array<{
		searchFields: Array<IMosSearchField>
	}>
}

export interface IMosSearchField {
	XPath: string
	sortByOrder: number
	sortType: string
}

export interface IMOSSearchableSchema {
	username: string
	mosSchema: string
}

export enum IMOSObjectType {
	STILL = 'STILL',
	AUDIO = 'AUDIO',
	VIDEO = 'VIDEO',
	OTHER = 'OTHER' // unknown/not speficied
}

export enum IMOSObjectStatus {
	NEW = 'NEW',
	UPDATED = 'UPDATED',
	MOVED = 'MOVED',
	BUSY = 'BUSY',
	DELETED = 'DELETED',
	NCS_CTRL = 'NCS CTRL',
	MANUAL_CTRL = 'MANUAL CTRL',
	READY = 'READY',
	NOT_READY = 'NOT READY',
	PLAY = 'PLAY',
	STOP = 'STOP'
}

export enum IMOSAckStatus {
	ACK = 'ACK',
	NACK = 'NACK'
}

export enum IMOSObjectAirStatus {
	READY = 'READY',
	NOT_READY = 'NOT READY'
}

export interface IMOSObjectPath {
	Type: IMOSObjectPathType
	Description: string
	Target: string // Max 255
}

export enum IMOSObjectPathType {
	PATH = 'PATH',
	PROXY_PATH = 'PROXY PATH',
	METADATA_PATH = 'METADATA PATH'
}
export { IMOSExternalMetaData }
