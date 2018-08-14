import { Socket } from 'net'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { MosString128 } from './dataTypes/mosString128'
import { MosTime } from './dataTypes/mosTime'
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData'
// import { MosDuration } from './dataTypes/mosDuration'
import { IMOSListMachInfo, IMOSDefaultActiveX, ListMachineInfo } from './mosModel/0_listMachInfo'
import { ROAck } from './mosModel/ROAck'
import { ReqMachInfo } from './mosModel/0_reqMachInfo'
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
	IMOSObjectStatus
} from './api'
import { IConnectionConfig } from './config/connectionConfig'
import { Parser } from './mosModel/Parser'
import { MOSAck } from './mosModel/mosAck'
import { ROList } from './mosModel/ROList'
import { HeartBeat } from './mosModel/0_heartBeat'
import { ROReq } from './mosModel/2_roReq'
import { ROElementStat, ROElementStatType } from './mosModel/2_roElementStat'
import { MosObj } from './mosModel/1_mosObj'
import { MosListAll } from './mosModel/1_mosListAll'
import { ReqMosObj } from './mosModel/1_reqMosObj'
import { ReqMosObjAll } from './mosModel/1_reqMosObjAll'
import { ROReqAll } from './mosModel/4_roReqAll'
import { MosMessage } from './mosModel/MosMessage'

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

	private supportedProfiles: {[profile: string]: (boolean | string), deviceType: string} = {
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

	// private _profiles: ProfilesSupport
	private _primaryConnection: NCSServerConnection | null = null
	private _secondaryConnection: NCSServerConnection | null = null
	private _currentConnection: NCSServerConnection | null = null

	// Profile 0
	private _callbackOnGetMachineInfo?: () => Promise<IMOSListMachInfo>
	private _callbackOnConnectionChange?: (connectionStatus: IMOSConnectionStatus) => void

	// Profile 1
	private _callbackOnRequestMOSOBject?: (objId: string) => Promise<IMOSObject | null>
	private _callbackOnRequestAllMOSObjects?: () => Promise<Array< IMOSObject>>

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

	// Profile 4
	private _callbackOnROStory?: (story: IMOSROFullStory) => Promise<IMOSROAck>

	constructor (
		idPrimary: string,
		idSecondary: string | null,
		connectionConfig: IConnectionConfig,
		primaryConnection: NCSServerConnection | null,
		secondaryConnection: NCSServerConnection | null,
		offSpecFailover?: boolean
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

		if (connectionConfig) {
			if (connectionConfig.profiles['0']) this.supportedProfiles.profile0 = true
			if (connectionConfig.profiles['1']) this.supportedProfiles.profile1 = true
			if (connectionConfig.profiles['2']) this.supportedProfiles.profile2 = true
			if (connectionConfig.profiles['3']) this.supportedProfiles.profile3 = true
			if (connectionConfig.profiles['4']) this.supportedProfiles.profile4 = true
			if (connectionConfig.profiles['5']) this.supportedProfiles.profile5 = true
			if (connectionConfig.profiles['6']) this.supportedProfiles.profile6 = true
			if (connectionConfig.profiles['7']) this.supportedProfiles.profile7 = true
			if (connectionConfig.debug) this._debug = connectionConfig.debug
		}
		if (primaryConnection) {
			this._primaryConnection = primaryConnection
			this._primaryConnection.onConnectionChange(() => {
				this.emitConnectionChange()
				if (offSpecFailover && this._currentConnection !== this._primaryConnection && this._primaryConnection!.connected) {
					this.switchConnections().catch(() => null) // and hope no current message goes lost
				}
			})
		}
		if (secondaryConnection) {
			this._secondaryConnection = secondaryConnection
			this._secondaryConnection.onConnectionChange(() => this.emitConnectionChange())
		}
		this._currentConnection = this._primaryConnection || this._primaryConnection || null
	}

	get hasConnection (): boolean {
		return !!this._currentConnection
	}
	get idPrimary (): string {
		return this._idPrimary
	}
	get idSecondary (): string | null {
		return this._idSecondary
	}
	get primaryHost (): string | null {
		return (this._primaryConnection ? this._primaryConnection.host : null)
	}
	get primaryId (): string | null {
		return (this._primaryConnection ? this._primaryConnection.id : null)
	}
	get secondaryHost (): string | null {
		return (this._secondaryConnection ? this._secondaryConnection.host : null)
	}
	get secondaryId (): string | null {
		return (this._secondaryConnection ? this._secondaryConnection.id : null)
	}

	emitConnectionChange (): void {
		if (this._callbackOnConnectionChange) this._callbackOnConnectionChange(this.getConnectionStatus())
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
				this._callbackOnRequestAllMOSObjects().then((mosObjs: Array<IMOSObject>) => {
					let resp = new MosListAll(mosObjs)
					resolve(resp)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID),
					ItemID:  new MosString128(data.roElementAction.element_target.itemID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID),
					ItemID:  new MosString128(data.roElementAction.element_target.itemID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID),
					ItemID:  new MosString128(data.roElementAction.element_target.itemID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
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
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
				}, items[0], items[1]).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			// Profile 4
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
	getMachineInfo (): Promise<IMOSListMachInfo> {
		let message = new ReqMachInfo()

		return new Promise((resolve, reject) => {
			if (this._currentConnection) {

				this.executeCommand(message).then((data) => {
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
					resolve(list)
				}).catch(reject)
			}
		})
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
	onRequestMOSObject (cb: (objId: string) => Promise<IMOSObject | null>) {
		this._callbackOnRequestMOSOBject = cb
	}

	onRequestAllMOSObjects (cb: () => Promise<Array<IMOSObject>>) {
		this._callbackOnRequestAllMOSObjects = cb
	}

	getMOSObject (objID: MosString128): Promise <IMOSObject> {
		let message = new ReqMosObj(objID)
		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					if (data.mos.roAck) {
						reject(Parser.xml2ROAck(data.mos.roAck))
					} else if (data.mos.mosObj) {
						let obj: IMOSObject = Parser.xml2MosObj(data.mos.mosObj)
						resolve(obj)
					} else {
						reject('Unknown response')
					}
				}).catch(reject)
			}
		})
	}

	getAllMOSObjects (): Promise <Array<IMOSObject>> {
		let message = new ReqMosObjAll()
		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					if (data.mos.roAck) {
						reject(Parser.xml2ROAck(data.mos.roAck))
					} else if (data.mos.mosListAll) {
						let objs: Array<IMOSObject> = Parser.xml2MosObjs(data.mos.mosListAll.mosObj)
						resolve(objs)
					} else {
						reject('Unknown response')
					}
				}).catch(reject)
			}
		})
	}

	/* Profile 2 */
	onCreateRunningOrder (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) {
		this._callbackOnCreateRunningOrder = cb
	}

	onReplaceRunningOrder (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) {
		this._callbackOnReplaceRunningOrder = cb
	}

	onDeleteRunningOrder (cb: (runningOrderId: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnDeleteRunningOrder = cb
	}

	// onRequestRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void // get roReq, send roList
	onRequestRunningOrder (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) {
		this._callbackOnRequestRunningOrder = cb
	}

	getRunningOrder (runningOrderId: MosString128): Promise<IMOSRunningOrder | null > {
		let message = new ROReq(runningOrderId)

		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					if (data.mos.roAck) {
						reject(Parser.xml2ROAck(data.mos.roAck))
					} else if (data.mos.roList) {
						let ro: IMOSRunningOrder = Parser.xml2RO(data.mos.roList)
						resolve(ro)
					} else {
						reject('Unknown response')
					}
				})
				.catch(reject)
			}
		})
	}

	onMetadataReplace (cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>) {
		this._callbackOnMetadataReplace = cb
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

	setRunningOrderStatus (status: IMOSRunningOrderStatus): Promise < IMOSROAck > {
		let message = new ROElementStat({
			type: ROElementStatType.RO,
			roId: new MosString128(status.ID),
			status: status.Status
		})
		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					let roAck: ROAck = Parser.xml2ROAck(data.mos.roAck)
					resolve(roAck)
				}).catch(reject)
			}
		})
	}

	setStoryStatus (status: IMOSStoryStatus): Promise < IMOSROAck > {
		let message = new ROElementStat({
			type: ROElementStatType.STORY,
			roId: new MosString128(status.RunningOrderId),
			storyId: new MosString128(status.ID),
			status: status.Status
		})
		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					let roAck: ROAck = Parser.xml2ROAck(data.mos.roAck)
					resolve(roAck)
				}).catch(reject)
			}
		})
	}
	setItemStatus (status: IMOSItemStatus): Promise < IMOSROAck > {
		let message = new ROElementStat({
			type: ROElementStatType.ITEM,
			roId: new MosString128(status.RunningOrderId),
			storyId: new MosString128(status.StoryId),
			itemId: new MosString128(status.ID),
			objId: new MosString128(status.ObjectId),
			itemChannel: new MosString128(status.Channel),
			status: status.Status
		})
		return new Promise((resolve, reject) => {
			if (this._currentConnection) {
				this.executeCommand(message).then((data) => {
					let roAck: ROAck = Parser.xml2ROAck(data.mos.roAck)
					resolve(roAck)
				}).catch(reject)
			}
		})
	}
	onReadyToAir (cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>) {
		this._callbackOnReadyToAir = cb
	}
	onROInsertStories (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) {
		this._callbackOnROInsertStories = cb
	}
	onROInsertItems (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) {
		this._callbackOnROInsertItems = cb
	}
	onROReplaceStories (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) {
		this._callbackOnROReplaceStories = cb
	}
	onROReplaceItems (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) {
		this._callbackOnROReplaceItems = cb
	}
	onROMoveStories (cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnROMoveStories = cb
	}
	onROMoveItems (cb: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnROMoveItems = cb
	}
	onRODeleteStories (cb: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnRODeleteStories = cb
	}
	onRODeleteItems (cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnRODeleteItems = cb
	}
	onROSwapStories (cb: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnROSwapStories = cb
	}
	onROSwapItems (cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnROSwapItems = cb
	}

	/* Profile 4 */
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

	private executeCommand (message: MosMessage, resend?: boolean): Promise<any> {
		if (this._currentConnection) {
			console.log('exec command', message)
			if (!this._currentConnection.connected) {
				return this.switchConnections(message)
			}
			return this._currentConnection.executeCommand(message).then((res) => {
				if (res.mos.roAck && res.mos.roAck.roStatus === 'Buddy server cannot respond because main server is available') {
					return Promise.reject('Buddy server cannot respond because main server is available')
				}
				return res
			}).catch((e) => {
				console.log('errored', e)
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
			console.log('swithcing conn')
			this._currentConnection = this._currentConnection === this._primaryConnection ? this._secondaryConnection : this._primaryConnection
			if (!this._currentConnection.connected) return Promise.reject('No connection available for failover')
			let p
			if (message) {
				console.log('resending msg')
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
}
