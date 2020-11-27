import { Socket } from 'net'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { MosString128 } from './dataTypes/mosString128'
import { MosTime } from './dataTypes/mosTime'
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData'
// import { MosDuration } from './dataTypes/mosDuration'
import {
	IMOSObject,
	IMOSDevice,
	IMOSRunningOrder,
	IMOSRunningOrderBase,
	IMOSRunningOrderStatus,
	IMOSStoryStatus,
	IMOSItemStatus,
	IMOSROReadyToAir,
	IMOSStoryAction,
	IMOSItem,
	IMOSROAction,
	IMOSROStory,
	IMOSItemAction,
	IMOSROFullStory,
	IMOSROAck,
	IMOSConnectionStatus,
	IMOSAckStatus,
	IMOSObjectStatus,
	IMosObjectList,
	IMosRequestObjectList,
	IMOSSearchableSchema,
	IMOSAck
} from './api'
import { IConnectionConfig } from './config/connectionConfig'
import { Parser } from './mosModel/Parser'
import {
	IMOSListMachInfo,
	IMOSDefaultActiveX,
	ListMachineInfo,
	ROAck,
	ReqMachInfo,
	MOSAck,
	ROList,
	HeartBeat,
	ROReq,
	ROElementStat,
	ROElementStatType,
	MosObj,
	MosListAll,
	ReqMosObj,
	ReqMosObjAll,
	ROReqAll,
	MosObjList,
	MosListSearchableSchema,
	MosObjCreate,
	MosItemReplaceOptions,
	MosItemReplace,
	MosReqSearchableSchema,
	MosReqObjList,
	ROElementStatOptionsStory,
	ROElementStatOptionsRunningOrder
} from './mosModel'
import { MosMessage } from './mosModel/MosMessage'
import { ROListAll } from './mosModel/profile2/ROListAll'
import { ROCreate } from './mosModel/profile2/roCreate'
import { ROReplace } from './mosModel/profile2/roReplace'
import { RODelete } from './mosModel/profile2/roDelete'
import { ROInsertStories, ROInsertItems, ROReplaceStories, ROMoveStories, ROMoveItems, RODeleteStories, RODeleteItems, ROSwapStories, ROSwapItems, ROReplaceItems } from './mosModel/profile2/roActions'
import { ROStory } from './mosModel/profile4/roStory'
import { ROMetadataReplace } from './mosModel/profile2/roMetadataReplace'

export class MosDevice implements IMOSDevice {

	// private _host: string
	socket: Socket
	manufacturer: MosString128
	model: MosString128
	hwRev: MosString128
	swRev: MosString128
	DOM: MosTime
	SN: MosString128
	ID: MosString128
	time: MosTime
	opTime: MosTime
	mosRev: MosString128
	defaultActiveX: Array<IMOSDefaultActiveX>
	mosExternalMetaData: Array<IMOSExternalMetaData>

	private _idPrimary: string
	private _idSecondary: string | null
	private _debug: boolean = false

	private supportedProfiles: {
		deviceType: 'NCS' | 'MOS',
		profile0: boolean,
		profile1: boolean,
		profile2: boolean,
		profile3: boolean,
		profile4: boolean,
		profile5: boolean,
		profile6: boolean,
		profile7: boolean
	} = {
		deviceType: 'MOS',
		profile0: false,
		profile1: false,
		profile2: false,
		profile3: false,
		profile4: false,
		profile5: false,
		profile6: false,
		profile7: false
	} // Use same names as IProfiles?

	/** If set, will do more checks that mos-protocol is properly implemented */
	private _strict: boolean | undefined
	private _disposed: boolean = false

	// private _profiles: ProfilesSupport
	private _primaryConnection: NCSServerConnection | null = null
	private _secondaryConnection: NCSServerConnection | null = null
	private _currentConnection: NCSServerConnection | null = null

	// Profile 0
	private _callbackOnGetMachineInfo?: () => Promise<IMOSListMachInfo>
	private _callbackOnConnectionChange?: (connectionStatus: IMOSConnectionStatus) => void

	// Profile 1
	private _callbackOnRequestMOSOBject?: (objId: string) => Promise<IMOSObject | null>
	private _callbackOnRequestAllMOSObjects?: () => Promise<Array<IMOSObject>>

	// Profile 2
	private _callbackOnCreateRunningOrder?: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnReplaceRunningOrder?: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnDeleteRunningOrder?: (runningOrderId: MosString128) => Promise< IMOSROAck>
	private _callbackOnRequestRunningOrder?: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>
	private _callbackOnMetadataReplace?: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>
	private _callbackOnRunningOrderStatus?: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>
	private _callbackOnStoryStatus?: (status: IMOSStoryStatus) => Promise<IMOSROAck>
	private _callbackOnItemStatus?: (status: IMOSItemStatus) => Promise<IMOSROAck>
	private _callbackOnReadyToAir?: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>
	private _callbackOnROInsertStories?: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROInsertItems?: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROReplaceStories?: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROReplaceItems?: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROMoveStories?: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnROMoveItems?: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteStories?: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteItems?: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnROSwapStories?: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>
	private _callbackOnROSwapItems?: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>

	// Profile 3
	private _callbackOnMosItemReplace?: (roId: MosString128, storyID: MosString128, item: IMOSItem) => Promise<IMOSROAck>
	private _callbackOnMosObjCreate?: (obj: IMOSObject) => Promise<IMOSAck>
	private _callbackOnMosObjAction?: (action: string, obj: IMOSObject) => Promise<IMOSAck>
	private _callbackOnMosReqObjList?: (objList: IMosRequestObjectList) => Promise<IMosObjectList>
	private _callbackOnMosReqSearchableSchema?: (username: string) => Promise<IMOSSearchableSchema>

	// Profile 4
	private _callbackOnROReqAll?: () => Promise<IMOSRunningOrder[]>
	private _callbackOnROStory?: (story: IMOSROFullStory) => Promise<IMOSROAck>

	constructor (
		idPrimary: string,
		idSecondary: string | null,
		connectionConfig: IConnectionConfig,
		primaryConnection: NCSServerConnection | null,
		secondaryConnection: NCSServerConnection | null,
		offSpecFailover?: boolean,
		strict?: boolean
	) {
		// this._id = new MosString128(connectionConfig.mosID).toString()
		this._idPrimary = idPrimary
		this._idSecondary = idSecondary
		this.socket = new Socket()
		// Add params to this in MosConnection/MosDevice
		this.manufacturer = new MosString128('RadioVision, Ltd.')
		this.model = new MosString128('TCS6000')
		this.hwRev = new MosString128('0.1') // empty string returnes <hwRev/>
		this.swRev = new MosString128('0.1')
		this.DOM = new MosTime()
		this.SN = new MosString128('927748927')
		this.ID = new MosString128(connectionConfig ? connectionConfig.mosID : '')
		this.time = new MosTime()
		this.opTime = new MosTime()
		this.mosRev = new MosString128('2.8.5')

		this._strict = strict

		if (connectionConfig) {
			if (connectionConfig.profiles['0']) this.supportedProfiles.profile0 = true
			if (connectionConfig.profiles['1']) this.supportedProfiles.profile1 = true
			if (connectionConfig.profiles['2']) this.supportedProfiles.profile2 = true
			if (connectionConfig.profiles['3']) this.supportedProfiles.profile3 = true
			if (connectionConfig.profiles['4']) this.supportedProfiles.profile4 = true
			if (connectionConfig.profiles['5']) this.supportedProfiles.profile5 = true
			if (connectionConfig.profiles['6']) this.supportedProfiles.profile6 = true
			if (connectionConfig.profiles['7']) this.supportedProfiles.profile7 = true
			if (connectionConfig.isNCS) this.supportedProfiles.deviceType = 'NCS'
			if (connectionConfig.debug) this._debug = connectionConfig.debug
		}
		if (primaryConnection) {
			this._primaryConnection = primaryConnection
			this._primaryConnection.onConnectionChange(() => {
				this._emitConnectionChange()
				if (offSpecFailover && this._currentConnection !== this._primaryConnection && this._primaryConnection!.connected) {
					this.switchConnections().catch(() => null) // and hope no current message goes lost
				}
			})
		}
		if (secondaryConnection) {
			this._secondaryConnection = secondaryConnection
			this._secondaryConnection.onConnectionChange(() => this._emitConnectionChange())
		}
		this._currentConnection = this._primaryConnection || this._primaryConnection || null
		if (this._strict) {
			setTimeout(() => {
				if (this._disposed) return
				try {
					this._checkProfileValidness()
				} catch (e) {
					console.error(e)
				}
			}, 1000)
		}
	}
	/** True if MOS-device has connection to server (can send messages) */
	get hasConnection (): boolean {
		return !!this._currentConnection
	}
	/** Primary ID (probably the NCS-ID) */
	get idPrimary (): string {
		return this._idPrimary
	}
	/** Secondary ID (probably the MOS-ID) */
	get idSecondary (): string | null {
		return this._idSecondary
	}
	/** Host name (IP-address) of the primary server */
	get primaryHost (): string | null {
		return (this._primaryConnection ? this._primaryConnection.host : null)
	}
	/** Name (ID) of the primary server */
	get primaryId (): string | null {
		return (this._primaryConnection ? this._primaryConnection.id : null)
	}
	/** Host name (IP-address) of the secondary (buddy) server */
	get secondaryHost (): string | null {
		return (this._secondaryConnection ? this._secondaryConnection.host : null)
	}
	/** Name (ID) of the secondary (buddy) server */
	get secondaryId (): string | null {
		return (this._secondaryConnection ? this._secondaryConnection.id : null)
	}

	connect (): void {
		if (this._primaryConnection) this._primaryConnection.connect()
		if (this._secondaryConnection) this._secondaryConnection.connect()
	}
	dispose (): Promise<void> {
		let ps: Array<Promise<any>> = []
		if (this._primaryConnection) ps.push(this._primaryConnection.dispose())
		if (this._secondaryConnection) ps.push(this._secondaryConnection.dispose())
		return Promise.all(ps)
		.then(() => {
			return
		})
	}

	routeData (data: any): Promise<any> {
		if (data && data.hasOwnProperty('mos')) data = data['mos']
		return new Promise((resolve, reject) => {
			if (this._debug) console.log('parsedData', data)
			// if (this._debug) console.log('parsedTest', keys)
			if (this._debug) console.log('keys', Object.keys(data))

			// Route and format data:
			// Profile 0:
			if (data.heartbeat) {
				// send immediate reply:
				let ack = new HeartBeat()
				resolve(ack)

			} else if (data.reqMachInfo && typeof this._callbackOnGetMachineInfo === 'function') {
				this._callbackOnGetMachineInfo().then((m: IMOSListMachInfo) => {
					let resp = new ListMachineInfo(m)
					resolve(resp)
				}).catch(reject)
			// Profile 1:
			} else if (data.mosReqObj && typeof this._callbackOnRequestMOSOBject === 'function') {
				this._callbackOnRequestMOSOBject(data.mosReqObj.objID).then((mosObj: IMOSObject) => {
					let resp = new MosObj(mosObj)
					resolve(resp)
				}).catch(reject)
			} else if (data.mosReqAll && typeof this._callbackOnRequestAllMOSObjects === 'function') {
				const pause = data.mosReqAll.pause || 0
				this._callbackOnRequestAllMOSObjects()
				.then(mosObjects => {
					const mosAck = new MOSAck()
					resolve(mosAck)

					// spec: Pause, when greater than zero, indicates the number of seconds to pause
					// between individual mosObj messages.
					// Pause of zero indicates that all objects will be sent using the mosListAll message..
					if (pause > 0) {
						if (mosObjects.length) {
							const firstObject = mosObjects.shift() as IMOSObject
							let resp = new MosObj(firstObject)
							resolve(resp)
							const sendNextObject = () => {
								if (this._disposed) return
								const nextObject = mosObjects.shift()
								if (nextObject) {
									this.sendMOSObject(nextObject)
									.then(() => {
										setTimeout(sendNextObject, pause * 1000)
									})
									.catch(e => {
										console.error('Error in async mosObj response to mosReqAll', e)
									})
								}
							}
							setTimeout(sendNextObject, pause * 1000)
						}
					} else {
						this.sendAllMOSObjects(mosObjects)
						.catch(e => {
							console.error('Error in async mosListAll response to mosReqAll', e)
						})
					}
				}).catch(reject)
			// Profile 2:
			} else if (data.roCreate && typeof this._callbackOnCreateRunningOrder === 'function') {
				let ro = Parser.xml2RO(data.roCreate)
				/*
				let stories: Array<IMOSROStory> = Parser.xml2Stories(data.roCreate.story)
				let ro: IMOSRunningOrder = {
					ID: new MosString128(data.roCreate.roID),
					Slug: new MosString128(data.roCreate.roSlug),
					Stories: stories
				}

				if (data.roCreate.hasOwnProperty('roEdStart')) ro.EditorialStart = new MosTime(data.roCreate.roEdStart)
				if (data.roCreate.hasOwnProperty('roEdDur')) ro.EditorialDuration = new MosDuration(data.roCreate.roEdDur)
				if (data.roCreate.hasOwnProperty('mosExternalMetadata')) {
					// TODO: Handle an array of mosExternalMetadata
					let meta: IMOSExternalMetaData = {
						MosSchema: data.roCreate.mosExternalMetadata.mosSchema,
						MosPayload: data.roCreate.mosExternalMetadata.mosPayload
					}
					if (data.roCreate.mosExternalMetadata.hasOwnProperty('mosScope')) meta.MosScope = data.roCreate.mosExternalMetadata.mosScope
					ro.MosExternalMetaData = [meta]
				}
				*/

				this._callbackOnCreateRunningOrder(ro).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (data.roReplace && typeof this._callbackOnReplaceRunningOrder === 'function') {
				let ro: IMOSRunningOrder = Parser.xml2RO(data.roReplace)

				this._callbackOnReplaceRunningOrder(ro).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (data.roDelete && typeof this._callbackOnDeleteRunningOrder === 'function') {
				// TODO: Change runningOrderId to RunningOrderID in interface?
				this._callbackOnDeleteRunningOrder(data.roDelete.roID).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roReq && typeof this._callbackOnRequestRunningOrder === 'function') {
				this._callbackOnRequestRunningOrder(data.roReq.roID).then((ro: IMOSRunningOrder | null) => {
					if (ro) {
						let resp = new ROList()
						resp.RO = ro
						resolve(resp)
					} else {
						// RO not found
						let ack = new ROAck()
						ack.ID = data.roReq.roID
						ack.Status = new MosString128(IMOSAckStatus.NACK)
						// ack.Stories = resp.Stories
						resolve(ack)
					}
				}).catch(reject)

			} else if (data.roMetadataReplace && typeof this._callbackOnMetadataReplace === 'function') {
				let ro: IMOSRunningOrderBase = Parser.xml2ROBase(data.roMetadataReplace)
				this._callbackOnMetadataReplace(ro).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (data.roElementStat && data.roElementStat.element === 'RO' && typeof this._callbackOnRunningOrderStatus === 'function') {
				let status: IMOSRunningOrderStatus = {
					ID: new MosString128(data.roElementStat.roID),
					Status: data.roElementStat.status,
					Time: new MosTime(data.roElementStat.time)
				}

				this._callbackOnRunningOrderStatus(status).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (data.roElementStat && data.roElementStat.element === 'STORY' && typeof this._callbackOnStoryStatus === 'function') {
				let status: IMOSStoryStatus = {
					RunningOrderId: new MosString128(data.roElementStat.roID),
					ID: new MosString128(data.roElementStat.storyID),
					Status: data.roElementStat.status as IMOSObjectStatus,
					Time: new MosTime(data.roElementStat.time)
				}

				this._callbackOnStoryStatus(status).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (
				data.roElementStat &&
				data.roElementStat.element === 'ITEM' &&
				typeof this._callbackOnItemStatus === 'function'
			) {
				let status: IMOSItemStatus = {
					RunningOrderId: new MosString128(data.roElementStat.roID),
					StoryId: new MosString128(data.roElementStat.storyID),
					ID: new MosString128(data.roElementStat.itemID),
					Status: data.roElementStat.status as IMOSObjectStatus,
					Time: new MosTime(data.roElementStat.time)
				}
				if (data.roElementStat.hasOwnProperty('objID')) status.ObjectId = new MosString128(data.roElementStat.objID)
				if (data.roElementStat.hasOwnProperty('itemChannel')) status.Channel = new MosString128(data.roElementStat.itemChannel)

				this._callbackOnItemStatus(status).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (data.roReadyToAir && typeof this._callbackOnReadyToAir === 'function') {
				this._callbackOnReadyToAir({
					ID: new MosString128(data.roReadyToAir.roID),
					Status: data.roReadyToAir.roAir
				}).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (
				data.roElementAction &&
				data.roElementAction.operation === 'INSERT' &&
				(data.roElementAction.element_source || {}).story &&
				typeof this._callbackOnROInsertStories === 'function'
			) {
				let action: IMOSStoryAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID)
				}
				let stories: Array<IMOSROStory> = Parser.xml2Stories([data.roElementAction.element_source.story])
				this._callbackOnROInsertStories(action, stories)
				.then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (
				data.roElementAction &&
				data.roElementAction.operation === 'INSERT' &&
				(data.roElementAction.element_source || {}).item &&
				typeof this._callbackOnROInsertItems === 'function'
			) {
				let action: IMOSItemAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
					ItemID:  new MosString128((data.roElementAction.element_target || {}).itemID)
				}
				let items: Array<IMOSItem> = Parser.xml2Items(data.roElementAction.element_source.item)
				this._callbackOnROInsertItems(action, items)
				.then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					// ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (
				data.roElementAction &&
				data.roElementAction.operation === 'REPLACE' &&
				(data.roElementAction.element_source || {}).story &&
				typeof this._callbackOnROReplaceStories === 'function'
			) {
				let action: IMOSStoryAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID)
				}
				let stories: Array<IMOSROStory> = Parser.xml2Stories([data.roElementAction.element_source.story])
				this._callbackOnROReplaceStories(action, stories).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (
				data.roElementAction &&
				data.roElementAction.operation === 'REPLACE' &&
				(data.roElementAction.element_source || {}).item &&
				typeof this._callbackOnROReplaceItems === 'function'
			) {
				let action: IMOSItemAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
					ItemID:  new MosString128((data.roElementAction.element_target || {}).itemID)
				}
				let items: Array<IMOSItem> = Parser.xml2Items(data.roElementAction.element_source.item)
				this._callbackOnROReplaceItems(action, items)
				.then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					// ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roElementAction &&
				data.roElementAction.operation === 'MOVE' &&
				(data.roElementAction.element_source || {}).storyID &&
				typeof this._callbackOnROMoveStories === 'function'
			) {
				let action: IMOSStoryAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID)
				}
				let storyIDs: Array<MosString128> = Parser.xml2IDs(data.roElementAction.element_source.storyID)
				this._callbackOnROMoveStories(action, storyIDs).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roElementAction &&
				data.roElementAction.operation === 'MOVE' &&
				(data.roElementAction.element_source || {}).itemID &&
				typeof this._callbackOnROMoveItems === 'function'
			) {
				let action: IMOSItemAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
					ItemID:  new MosString128((data.roElementAction.element_target || {}).itemID)
				}
				let itemIDs: Array<MosString128> = Parser.xml2IDs(data.roElementAction.element_source.itemID)
				this._callbackOnROMoveItems(action, itemIDs).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roElementAction &&
				data.roElementAction.operation === 'DELETE' &&
				data.roElementAction.element_source.storyID &&
				typeof this._callbackOnRODeleteStories === 'function'
			) {
				let stories: Array<MosString128> = Parser.xml2IDs(data.roElementAction.element_source.storyID)

				this._callbackOnRODeleteStories({
					RunningOrderID: new MosString128(data.roElementAction.roID)
				}, stories).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roElementAction &&
				data.roElementAction.operation === 'DELETE' &&
				data.roElementAction.element_source.itemID &&
				typeof this._callbackOnRODeleteItems === 'function'
			) {
				let action: IMOSStoryAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID)
				}
				let items: Array<MosString128> = Parser.xml2IDs(data.roElementAction.element_source.itemID)

				this._callbackOnRODeleteItems(action, items).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roElementAction &&
				data.roElementAction.operation === 'SWAP' &&
				data.roElementAction.element_source.storyID &&
				data.roElementAction.element_source.storyID.length === 2 &&
				typeof this._callbackOnROSwapStories === 'function'
			) {
				let stories: Array<MosString128> = Parser.xml2IDs(data.roElementAction.element_source.storyID)

				this._callbackOnROSwapStories({
					RunningOrderID: new MosString128(data.roElementAction.roID)
				}, stories[0], stories[1]).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			} else if (data.roElementAction &&
				data.roElementAction.operation === 'SWAP' &&
				data.roElementAction.element_source.itemID &&
				data.roElementAction.element_source.itemID.length === 2 &&
				typeof this._callbackOnROSwapItems === 'function'
			) {
				let items: Array<MosString128> = Parser.xml2IDs(data.roElementAction.element_source.itemID)

				this._callbackOnROSwapItems({
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID)
				}, items[0], items[1]).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			// Profile 3
			} else if (data.mosItemReplace && typeof this._callbackOnMosItemReplace === 'function') {
				this._callbackOnMosItemReplace(
					data.mosItemReplace.ID,
					data.mosItemReplace.itemID,
					Parser.xml2Item(data.mosItemReplace.item))
				.then(resp => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			} else if (data.mosObjCreate && typeof this._callbackOnMosObjCreate === 'function') {
				this._callbackOnMosObjCreate(
					Parser.xml2MosObj(data.mosObjCreate))
				.then(resp => {
					let ack = new MOSAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Description = resp.Description
					resolve(ack)
				}).catch(reject)

			} else if (data.mosReqObjAction && typeof this._callbackOnMosObjAction === 'function') {
				this._callbackOnMosObjAction(
					data.mosReqObjAction.operation,
					Parser.xml2MosObj(data.mosReqObjAction)
				).then(resp => {
					let ack = new MOSAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Description = resp.Description
					resolve(ack)
				}).catch(reject)

			} else if (data.mosReqObjList && typeof this._callbackOnMosReqObjList === 'function') {
				this._callbackOnMosReqObjList(Parser.xml2ReqObjList(data.mosReqObjList))
				.then(resp => {
					const reply = new MosObjList(resp)
					resolve(reply)
				})
				.catch(reject)
			} else if (data.mosReqSearchableSchema && typeof this._callbackOnMosReqSearchableSchema === 'function') {
				this._callbackOnMosReqSearchableSchema(data.mosReqSearchableSchema.username)
				.then(resp => {
					const reply = new MosListSearchableSchema(resp)
					resolve(reply)
				})
				.catch(reject)

			// Profile 4
			} else if (data.roReqAll && typeof this._callbackOnROReqAll === 'function') {
				this._callbackOnROReqAll().then((list: IMOSRunningOrder[]) => {
					let roListAll = new ROListAll()
					roListAll.ROs = list
					resolve(roListAll)
				}).catch(reject)

			} else if (data.roStorySend && typeof this._callbackOnROStory === 'function') {
				let story: IMOSROFullStory = Parser.xml2FullStory(data.roStorySend)
				this._callbackOnROStory(story).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			// TODO: Use MosMessage instead of string
			// TODO: Use reject if function dont exists? Put Nack in ondata
			} else {
				if (this._debug) console.log(data)
				let msg = new MOSAck()
				msg.ID = new MosString128(0) // Depends on type of message, needs logic
				msg.Revision = 0
				msg.Description = new MosString128('Unsupported function')
				msg.Status = IMOSAckStatus.NACK
				resolve(msg)
				// resolve('<mos><mosID>test2.enps.mos</mosID><ncsID>2012R2ENPS8VM</ncsID><messageID>99</messageID><roAck><roID>2012R2ENPS8VM;P_ENPSMOS\W\F_HOLD ROs;DEC46951-28F9-4A11-8B0655D96B347E52</roID><roStatus>Unknown object M000133</roStatus><storyID>5983A501:0049B924:8390EF2B</storyID><itemID>0</itemID><objID>M000224</objID><status>LOADED</status><storyID>3854737F:0003A34D:983A0B28</storyID><itemID>0</itemID><objID>M000133</objID><itemChannel>A</itemChannel><status>UNKNOWN</status></roAck></mos>')
			}

		})
	}

	/* Profile 0 */
	async getMachineInfo (): Promise<IMOSListMachInfo> {
		this._checkCurrentConnection()
		let message = new ReqMachInfo()

		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)

		let listMachInfo = data.mos.listMachInfo
		let list: IMOSListMachInfo = {
			manufacturer: listMachInfo.manufacturer,
			model: listMachInfo.model,
			hwRev: listMachInfo.hwRev,
			swRev: listMachInfo.swRev,
			DOM: listMachInfo.DOM,
			SN: listMachInfo.SN,
			ID: listMachInfo.ID,
			time: listMachInfo.time,
			opTime: listMachInfo.opTime,
			mosRev: listMachInfo.mosRev,
			supportedProfiles: this.supportedProfiles,		// TODO: No data from ENPS, needs test!
			defaultActiveX: this.defaultActiveX,			// TODO: No data from ENPS, needs test!
			mosExternalMetaData: this.mosExternalMetaData	// TODO: No data from ENPS, needs test!
		}
		return list
	}

	onGetMachineInfo (cb: () => Promise<IMOSListMachInfo>) {
		this._callbackOnGetMachineInfo = cb
	}

	onConnectionChange (cb: (connectionStatus: IMOSConnectionStatus) => void) {
		this._callbackOnConnectionChange = cb
	}

	getConnectionStatus (): IMOSConnectionStatus {
		// TODO: Implement this
		return {
			PrimaryConnected: (this._primaryConnection ? this._primaryConnection.connected : false),
			PrimaryStatus: '',
			SecondaryConnected: (this._secondaryConnection ? this._secondaryConnection.connected : false),
			SecondaryStatus: ''
		}
	}

	/* Profile 1 */
	async sendMOSObject (obj: IMOSObject): Promise<IMOSAck> {
		let message = new MosObj(obj)

		const reply = await this.executeCommand(message)

		let ack: IMOSAck = Parser.xml2Ack(reply.mos.mosAck)
		return ack
	}

	onRequestMOSObject (cb: (objId: string) => Promise<IMOSObject | null>) {
		this._callbackOnRequestMOSOBject = cb
	}

	async getMOSObject (objID: MosString128): Promise <IMOSObject> {
		let message = new ReqMosObj(objID)

		const reply = await this.executeCommand(message)
		if (reply.mos.roAck) {
			throw new Error(Parser.xml2ROAck(reply.mos.roAck).toString())
		} else if (reply.mos.mosObj) {
			let obj: IMOSObject = Parser.xml2MosObj(reply.mos.mosObj)
			return obj
		} else {
			throw new Error('Unknown response')
		}
	}

	onRequestAllMOSObjects (cb: () => Promise<Array<IMOSObject>>) {
		this._callbackOnRequestAllMOSObjects = cb
	}

	async getAllMOSObjects (): Promise <Array<IMOSObject>> {
		const message = new ReqMosObjAll()
		const reply = await this.executeCommand(message)
		if (reply.mos.roAck) {
			throw new Error(Parser.xml2ROAck(reply.mos.roAck).toString())
		} else if (reply.mos.mosListAll) {
			const objs: Array<IMOSObject> = Parser.xml2MosObjs(reply.mos.mosListAll.mosObj)
			return objs
		} else {
			throw new Error('Unknown response')
		}
	}

	async sendAllMOSObjects (objs: IMOSObject[]): Promise<IMOSAck> {
		const message = new MosListAll(objs)
		const reply = await this.executeCommand(message)
		if (reply.mos) {
			const ack: IMOSAck = Parser.xml2Ack(reply.mos.mosAck)
			return ack
		} else {
			throw new Error('Unknown response')
		}
	}

	/* Profile 2 */
	onCreateRunningOrder (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) {
		this._callbackOnCreateRunningOrder = cb
	}
	async sendCreateRunningOrder (ro: IMOSRunningOrder): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROCreate(ro)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}

	onReplaceRunningOrder (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) {
		this._callbackOnReplaceRunningOrder = cb
	}
	async sendReplaceRunningOrder (ro: IMOSRunningOrder): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROReplace(ro)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}

	onDeleteRunningOrder (cb: (runningOrderId: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnDeleteRunningOrder = cb
	}
	async sendDeleteRunningOrder (runningOrderId: MosString128): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new RODelete(runningOrderId)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}

	// onRequestRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void // get roReq, send roList
	onRequestRunningOrder (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) {
		this._callbackOnRequestRunningOrder = cb
	}

	async sendRequestRunningOrder (runningOrderId: MosString128): Promise<IMOSRunningOrder | null > {
		this._checkCurrentConnection()
		let message = new ROReq(runningOrderId)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		if (data.mos.roList) {
			let ro: IMOSRunningOrder = Parser.xml2RO(data.mos.roList)
			return ro
		} else throw new Error('Unknown response')
	}
	/**
	 * @deprecated getRunningOrder is deprecated, use sendRequestRunningOrder instead
	 */
	getRunningOrder (runningOrderId: MosString128): Promise<IMOSRunningOrder | null > {
		return this.sendRequestRunningOrder(runningOrderId)
	}

	onMetadataReplace (cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>) {
		this._callbackOnMetadataReplace = cb
	}
	async sendMetadataReplace (metadata: IMOSRunningOrderBase): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROMetadataReplace(metadata)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}

	onRunningOrderStatus (cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>) {
		this._callbackOnRunningOrderStatus = cb
	}

	onStoryStatus (cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>) {
		this._callbackOnStoryStatus = cb
	}
	onItemStatus (cb: (status: IMOSItemStatus) => Promise<IMOSROAck>) {
		this._callbackOnItemStatus = cb
	}

	/** @deprecated setRunningOrderStatus is deprecated, use sendRunningOrderStatus instead */
	setRunningOrderStatus (status: IMOSRunningOrderStatus): Promise<IMOSROAck> {
		return this.sendRunningOrderStatus(status)
	}
	/** @deprecated setStoryStatus is deprecated, use sendStoryStatus instead */
	setStoryStatus (status: IMOSStoryStatus): Promise<IMOSROAck> {
		return this.sendStoryStatus(status)
	}
	/** @deprecated setItemStatus is deprecated, use sendItemStatus instead */
	setItemStatus (status: IMOSItemStatus): Promise<IMOSROAck> {
		return this.sendItemStatus(status)
	}

	async sendRunningOrderStatus (status: IMOSRunningOrderStatus): Promise<IMOSROAck> {
		let message = new ROElementStat({
			type: ROElementStatType.RO,
			roId: new MosString128(status.ID),
			status: status.Status
		})
		const reply = await this.executeCommand(message)
		return Parser.xml2ROAck(reply.mos.roAck)
	}

	async sendStoryStatus (status: IMOSStoryStatus): Promise<IMOSROAck> {
		let message = new ROElementStat({
			type: ROElementStatType.STORY,
			roId: new MosString128(status.RunningOrderId),
			storyId: new MosString128(status.ID),
			status: status.Status
		})
		const reply = await this.executeCommand(message)
		return Parser.xml2ROAck(reply.mos.roAck)
	}
	async sendItemStatus (status: IMOSItemStatus): Promise<IMOSROAck> {
		let message = new ROElementStat({
			type: ROElementStatType.ITEM,
			roId: new MosString128(status.RunningOrderId),
			storyId: new MosString128(status.StoryId),
			itemId: new MosString128(status.ID),
			objId: new MosString128(status.ObjectId),
			itemChannel: new MosString128(status.Channel),
			status: status.Status
		})
		const reply = await this.executeCommand(message)
		return Parser.xml2ROAck(reply.mos.roAck)
	}
	onReadyToAir (cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>) {
		this._callbackOnReadyToAir = cb
	}
	onROInsertStories (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) {
		this._callbackOnROInsertStories = cb
	}
	async sendROInsertStories (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROInsertStories(Action, Stories)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROInsertItems (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) {
		this._callbackOnROInsertItems = cb
	}
	async sendROInsertItems (Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROInsertItems(Action, Items)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROReplaceStories (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) {
		this._callbackOnROReplaceStories = cb
	}
	async sendROReplaceStories (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROReplaceStories(Action, Stories)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROReplaceItems (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) {
		this._callbackOnROReplaceItems = cb
	}
	async sendROReplaceItems (Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROReplaceItems(Action, Items)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROMoveStories (cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnROMoveStories = cb
	}
	async sendROMoveStories (Action: IMOSStoryAction, Stories: Array<MosString128>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROMoveStories(Action, Stories)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROMoveItems (cb: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnROMoveItems = cb
	}
	async sendROMoveItems (Action: IMOSItemAction, Items: Array<MosString128>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROMoveItems(Action, Items)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onRODeleteStories (cb: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnRODeleteStories = cb
	}
	async sendRODeleteStories (Action: IMOSROAction, Stories: Array<MosString128>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new RODeleteStories(Action, Stories)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onRODeleteItems (cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnRODeleteItems = cb
	}
	async sendRODeleteItems (Action: IMOSStoryAction, Items: Array<MosString128>): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new RODeleteItems(Action, Items)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROSwapStories (cb: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnROSwapStories = cb
	}
	async sendROSwapStories (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROSwapStories(Action, StoryID0, StoryID1)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	onROSwapItems (cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnROSwapItems = cb
	}
	async sendROSwapItems (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROSwapItems(Action, ItemID0, ItemID1)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}

	/* Profile 3 */
	onMosObjCreate (cb: (object: IMOSObject) => Promise<IMOSAck>) {
		this._callbackOnMosObjCreate = cb
	}

	mosObjCreate (object: IMOSObject): Promise<MOSAck> {
		const message = new MosObjCreate(object)
		return this.executeCommand(message)
	}

	onMosItemReplace (cb: (roID: MosString128, storyID: MosString128, item: IMOSItem) => Promise<IMOSROAck>) {
		this._callbackOnMosItemReplace = cb
	}

	mosItemReplace (options: MosItemReplaceOptions): Promise<IMOSROAck> {
		const message = new MosItemReplace(options)
		return this.executeCommand(message)
	}

	onMosReqSearchableSchema (cb: (username: string) => Promise<IMOSSearchableSchema>) {
		this._callbackOnMosReqSearchableSchema = cb
	}

	mosRequestSearchableSchema (username: string): Promise<IMOSSearchableSchema> {
		const message = new MosReqSearchableSchema({ username })
		return this.executeCommand(message).then(response => {
			return response.mos.mosListSearchableSchema
		})
	}

	onMosReqObjectList (cb: (objList: IMosRequestObjectList) => Promise<IMosObjectList>) {
		this._callbackOnMosReqObjList = cb
	}

	mosRequestObjectList (reqObjList: IMosRequestObjectList): Promise<IMosObjectList> {
		const message = new MosReqObjList(reqObjList)
		return this.executeCommand(message).then(response => {
			const objList = response.mos.mosObjList
			if (objList.list) objList.list = Parser.xml2MosObjs(objList.list.mosObj)
			return objList
		})
	}

	onMosReqObjectAction (cb: (action: string, obj: IMOSObject) => Promise<IMOSAck>) {
		this._callbackOnMosObjAction = cb
	}

	/* Profile 4 */
	onROReqAll (cb: () => Promise<IMOSRunningOrder[]>) {
		this._callbackOnROReqAll = cb
	}
	getAllRunningOrders (): Promise<Array<IMOSRunningOrderBase>> {
		let message = new ROReqAll()
		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					if (data.mos.hasOwnProperty('roListAll')) {
						let xmlRos: Array<any> = (data.mos.roListAll || {}).ro
						if (!Array.isArray(xmlRos)) xmlRos = [xmlRos]
						let ros: Array<IMOSRunningOrderBase> = []
						xmlRos.forEach((xmlRo) => {
							if (xmlRo) {
								ros.push(Parser.xml2ROBase(xmlRo))
							}
						})
						resolve(ros)
					} else {
						console.log(data.mos)
						reject('Unknown reply')
					}
				}).catch(reject)
			}
		})
	}
	onROStory (cb: (story: IMOSROFullStory) => Promise<IMOSROAck>) {
		this._callbackOnROStory = cb
	}
	async sendROStory (story: IMOSROFullStory): Promise<IMOSROAck> {
	// async sendROSwapItems (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128): Promise<IMOSROAck> {
		this._checkCurrentConnection()
		let message = new ROStory(story)
		const data = await this.executeCommand(message)
		this._handleBadResponseData(data)
		return Parser.xml2ROAck(data.mos.roAck)
	}
	setDebug (debug: boolean) {
		this._debug = debug
	}
	checkProfileValidness (): void {
		this._checkProfileValidness()
	}

	private executeCommand (message: MosMessage, resend?: boolean): Promise<any> {
		if (this._currentConnection) {
			if (this._debug) console.log('exec command', message)
			if (!this._currentConnection.connected) {
				return this.switchConnections(message)
			}
			return this._currentConnection.executeCommand(message).then((res) => {
				if (res.mos.roAck && res.mos.roAck.roStatus === 'Buddy server cannot respond because main server is available') {
					return Promise.reject('Buddy server cannot respond because main server is available')
				} else {
					return res
				}
			}).catch((e) => {
				if (this._debug) console.log('errored', e)
				if (this._primaryConnection && this._secondaryConnection && !resend) {
					return this.switchConnections(message)
				} else {
					return Promise.reject(e)
				}
			})
		} else {
			return Promise.reject('No connection')
		}
	}
	private switchConnections (message?: MosMessage): Promise<any> {
		if (this._currentConnection && this._primaryConnection && this._secondaryConnection) {
			if (this._debug) console.log('switching connection')
			this._currentConnection = this._currentConnection === this._primaryConnection ? this._secondaryConnection : this._primaryConnection
			if (!this._currentConnection.connected) return Promise.reject('No connection available for failover')
			let p
			if (message) {
				if (this._debug) console.log('resending msg')
				p = this.executeCommand(message, true).catch((e) => {
					if (e === 'Main server available') {
						// @todo: we may deadlock if primary is down for us, but up for buddy
						return this.switchConnections(message)
					}
					// @ts-ignore - following line will always resolve if called from here
					this.switchConnections().catch((e) => {
						throw Error('e')
					})
					return Promise.reject(e)
				})
			}
			(this._currentConnection === this._primaryConnection ? this._secondaryConnection : this._primaryConnection).handOverQueue(this._currentConnection)
			return p || Promise.resolve()
		}
		return Promise.reject('No connection available for failover')
	}
	private _emitConnectionChange (): void {
		if (this._callbackOnConnectionChange) this._callbackOnConnectionChange(this.getConnectionStatus())
	}
	/** throws if there is an error */
	private _handleBadResponseData (data: any): void {
		if (!data.mos) throw new Error(`Unknown data: <mos> missing from message`)

		if (
			data.mos.mosAck &&
			data.mos.mosAck.status === 'NACK'
		) {
			throw new Error(`Error in response: ${data.mos.mosAck.statusDescription || 'No statusDescription given'}`)
		}
	}
	/** throws if there is no connection */
	private _checkCurrentConnection () {
		if (!this._currentConnection) throw new Error(`Unable to send message due to no current connection`)
	}
	/** throws if something's wrong
	 */
	private _checkProfileValidness (): void {
		if (!this._strict) return
		/** For MOS-devices: Require a callback to have been set */
		const requireCallback = (profile: string, callbackName: string, method: Function) => {
			// @ts-ignore no index signature
			if (!this[callbackName]) {
				throw new Error(`Error: This MOS-device is configured to support Profile ${profile}, but callback ${method.name} has not been set!`)
			}
		}
		const requireMOSCallback = (profile: string, callbackName: string, method: Function) => {
			if (this.supportedProfiles.deviceType !== 'MOS') return
			requireCallback(profile, callbackName, method)
		}
		// const requireNCSCallback = (profile: string, callbackName: string, method: Function) => {
		// 	if (this.supportedProfiles.deviceType !== 'NCS') return
		// 	requireCallback(profile, callbackName, method)
		// }
		/** Require another profile to have been set  */
		const requireProfile = (profile: string, requiredProfile: string) => {
			// @ts-ignore no index signature
			if (!this.supportedProfiles[requiredProfile]) {
				throw new Error(`Error: This MOS-device is configured to support Profile ${profile}, therefore it must also support Profile ${requireProfile}!`)
			}
		}
		if (this.supportedProfiles.profile0) {
			requireCallback('0', '_callbackOnGetMachineInfo', this.onGetMachineInfo)
			requireCallback('0', '_callbackOnConnectionChange', this.onConnectionChange)
		}
		if (this.supportedProfiles.profile1) {
			requireProfile('1', '0')
			requireMOSCallback('1', '_callbackOnRequestMOSOBject', this.onRequestMOSObject)
			requireMOSCallback('1', '_callbackOnRequestAllMOSObjects', this.onRequestAllMOSObjects)
		}
		if (this.supportedProfiles.profile2) {
			requireProfile('2', '0')
			requireProfile('2', '1')
			requireMOSCallback('2', '_callbackOnCreateRunningOrder', this.onCreateRunningOrder)
			requireMOSCallback('2', '_callbackOnReplaceRunningOrder', this.onReplaceRunningOrder)
			requireMOSCallback('2', '_callbackOnDeleteRunningOrder', this.onDeleteRunningOrder)
			requireMOSCallback('2', '_callbackOnRequestRunningOrder', this.onRequestRunningOrder)
			requireMOSCallback('2', '_callbackOnMetadataReplace', this.onMetadataReplace)
			requireMOSCallback('2', '_callbackOnRunningOrderStatus', this.onRunningOrderStatus)
			requireMOSCallback('2', '_callbackOnStoryStatus', this.onStoryStatus)
			requireMOSCallback('2', '_callbackOnItemStatus', this.onItemStatus)
			requireMOSCallback('2', '_callbackOnReadyToAir', this.onReadyToAir)
			requireMOSCallback('2', '_callbackOnROInsertStories', this.onROInsertStories)
			requireMOSCallback('2', '_callbackOnROInsertItems', this.onROInsertItems)
			requireMOSCallback('2', '_callbackOnROReplaceStories', this.onROReplaceStories)
			requireMOSCallback('2', '_callbackOnROReplaceItems', this.onROReplaceItems)
			requireMOSCallback('2', '_callbackOnROMoveStories', this.onROMoveStories)
			requireMOSCallback('2', '_callbackOnROMoveItems', this.onROMoveItems)
			requireMOSCallback('2', '_callbackOnRODeleteStories', this.onRODeleteStories)
			requireMOSCallback('2', '_callbackOnRODeleteItems', this.onRODeleteItems)
			requireMOSCallback('2', '_callbackOnROSwapStories', this.onROSwapStories)
			requireMOSCallback('2', '_callbackOnROSwapItems', this.onROSwapItems)
		}
		if (this.supportedProfiles.profile3) {
			requireProfile('3', '0')
			requireProfile('3', '1')
			requireProfile('3', '2')
			requireMOSCallback('3', '_callbackOnMosItemReplace', this.onMosItemReplace)
			requireMOSCallback('3', '_callbackOnMosObjCreate', this.onMosObjCreate)
			requireMOSCallback('3', '_callbackOnMosObjAction', this.onMosReqObjectAction)
			requireMOSCallback('3', '_callbackOnMosReqObjList', this.onMosReqObjectList)
			requireMOSCallback('3', '_callbackOnMosReqSearchableSchema', this.onMosReqSearchableSchema)
		}
		if (this.supportedProfiles.profile4) {
			requireProfile('4', '0')
			requireProfile('4', '1')
			requireProfile('4', '2')
			requireMOSCallback('4', '_callbackOnROReqAll', this.onROReqAll)
			requireMOSCallback('4', '_callbackOnROStory', this.onROStory)
		}
		if (this.supportedProfiles.profile5) {
			requireProfile('5', '0')
			requireProfile('5', '1')
			requireProfile('5', '2')
			throw new Error('Erorr: Profile 5 is not currently implemented!')
		}
		if (this.supportedProfiles.profile6) {
			requireProfile('6', '0')
			requireProfile('6', '1')
			requireProfile('6', '2')
			throw new Error('Erorr: Profile 6 is not currently implemented!')
		}
		if (this.supportedProfiles.profile7) {
			requireProfile('7', '0')
			requireProfile('7', '1')
			requireProfile('7', '2')
			throw new Error('Erorr: Profile 7 is not currently implemented!')
		}
	}
}
