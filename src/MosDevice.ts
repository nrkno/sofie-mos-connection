import { Socket } from 'net'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { MosString128 } from './dataTypes/mosString128'
import { MosTime } from './dataTypes/mosTime'
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData'
import { MosDuration } from './dataTypes/mosDuration'
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
	private _callbackOnGetMachineInfo: () => Promise<IMOSListMachInfo>
	private _callbackOnConnectionChange: (connectionStatus: IMOSConnectionStatus) => void

	// Profile 1
	private _callbackOnRequestMOSOBject: (objId: string) => Promise<IMOSObject | null>
	private _callbackOnRequestAllMOSObjects: () => Promise<Array< IMOSObject>>

	// Profile 2
	private _callbackOnCreateRunningOrder: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnReplaceRunningOrder: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnDeleteRunningOrder: (runningOrderId: MosString128) => Promise< IMOSROAck>
	private _callbackOnRequestRunningOrder: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>
	private _callbackOnMetadataReplace: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>
	private _callbackOnRunningOrderStatus: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>
	private _callbackOnStoryStatus: (status: IMOSStoryStatus) => Promise<IMOSROAck>
	private _callbackOnItemStatus: (status: IMOSItemStatus) => Promise<IMOSROAck>
	private _callbackOnReadyToAir: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>
	private _callbackOnROInsertStories: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROInsertItems: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROReplaceStories: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROReplaceItems: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROMoveStories: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnROMoveItems: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteStories: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteItems: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnROSwapStories: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>
	private _callbackOnROSwapItems: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>

	// Profile 4
	private _callbackOnROStory: (story: IMOSROFullStory) => Promise<any>

	constructor (
		idPrimary: string,
		idSecondary: string | null,
		connectionConfig: IConnectionConfig,
		primaryConnection: NCSServerConnection | null,
		secondaryConnection: NCSServerConnection | null
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
			this._primaryConnection.onConnectionChange(() => this.emitConnectionChange())
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

	emitConnectionChange (): void {
		if (this._callbackOnConnectionChange) this._callbackOnConnectionChange(this.getConnectionStatus())
	}

	connect (): void {
		if (this._primaryConnection) this._primaryConnection.connect()
		if (this._secondaryConnection) this._secondaryConnection.connect()
	}

	routeData (data: any): Promise<any> {
		if (data && data.hasOwnProperty('mos')) data = data['mos']

		return new Promise((resolve, reject) => {
			if (this._debug) {
				console.log('parsedData', data)
				// console.log('parsedTest', keys)
				console.log('keys', Object.keys(data))
			}

			// Route and format data

			// Profile 0
			// console.log(data)
			// TODO: _callbackOnConnectionChange: (connectionStatus: IMOSConnectionStatus) => void
			if (data.heartbeat) {
				// send immediate reply:
				// console.log('heartbeat')
				let ack = new HeartBeat()
				resolve(ack)

			// Profile 1
			// TODO: _callbackOnRequestMOSOBject: (objId: string) => Promise<IMOSObject | null>
			// TODO: _callbackOnRequestAllMOSObjects: () => Promise<Array<IMOSObject>>

			// TODO: _callbackOnGetMachineInfo: () => Promise<IMOSListMachInfo>
			} else if (data.reqMachInfo && typeof this._callbackOnGetMachineInfo === 'function') {
				this._callbackOnGetMachineInfo().then((m: IMOSListMachInfo) => {
					let resp = new ListMachineInfo(m)
					resolve(resp)
				})
			} else if (data.roCreate && typeof this._callbackOnCreateRunningOrder === 'function') {
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
				// TODO: Add & test DefaultChannel, Trigger, MacroIn, MacroOut

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
					// console.log('ro', ro)
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

			} else if (data.roStorySend && typeof this._callbackOnROInsertStories === 'function') {
				let action: IMOSStoryAction = {
					RunningOrderID: data.roStorySend.roID,
					StoryID: data.roStorySend.storyID
				}
				let stories: Array<IMOSROStory> = []
				let story: IMOSROStory = {
					ID: data.roStorySend.storyID,
					Slug: data.roStorySend.storySlug,
					Items: []
					// TODO: Add & test Items, ObjectID, MOSID, mosAbstract, Paths, StoryBody
					// Channel, EditorialStart, EditorialDuration, UserTimingDuration, Trigger, MacroIn, MacroOut
				}
				if (data.roStorySend.hasOwnProperty('storyNum') && data.roStorySend.storyNum !== {}) story.Number = data.roStorySend.storyNum
				if (data.roStorySend.hasOwnProperty('mosExternalMetadata')) {
					// TODO: Handle an array of mosExternalMetadata
					let meta: IMOSExternalMetaData = {
						MosSchema: data.roStorySend.mosExternalMetadata.mosSchema,
						MosPayload: data.roStorySend.mosExternalMetadata.mosPayload
					}
					if (data.roStorySend.mosExternalMetadata.hasOwnProperty('mosScope')) meta.MosScope = data.roStorySend.mosExternalMetadata.mosScope
					story.MosExternalMetaData = [meta]
				}
				stories.push(story)
				// console.log('roStorySend', stories)
				this._callbackOnROInsertStories(action, stories).then((resp: IMOSROAck) => {
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
			// TODO: private _callbackOnROStory: (story: IMOSROFullStory) => Promise<any>

			// TODO: Use MosMessage instead of string
			// TODO: Use reject if function dont exists? Put Nack in ondata
			} else {
				console.log(data)
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

				this._currentConnection.executeCommand(message).then((data) => {
					// console.log('reply', data)
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
				})
			} else {
				reject('No Connection')
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

	getMOSObject (objID: string): Promise <IMOSObject> {
		// TODO: Implement this
	}

	getAllMOSObjects (): Promise <Array<IMOSObject>> {
		// TODO: Implement this
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
				this._currentConnection.executeCommand(message).then((data) => {
					if (data.mos.roAck) {
						reject(data.mos.roAck)
					} else if (data.mos.roList) {
						let ro: IMOSRunningOrder = Parser.xml2RO(data.mos.roList)
						resolve(ro)
					} else {
						reject('Unknown response')
					}
				})
			} else {
				reject('No Connection')
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
				this._currentConnection.executeCommand(message).then((data) => {
					let roAck: ROAck = Parser.xml2ROAck(data.mos.roAck)
					resolve(roAck)
				})
			} else {
				reject('No Connection')
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
				this._currentConnection.executeCommand(message).then((data) => {
					let roAck: ROAck = Parser.xml2ROAck(data.mos.roAck)
					resolve(roAck)
				})
			} else {
				reject('No Connection')
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
				this._currentConnection.executeCommand(message).then((data) => {
					let roAck: ROAck = Parser.xml2ROAck(data.mos.roAck)
					resolve(roAck)
				})
			} else {
				reject('No Connection')
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
	onROStory (cb: (story: IMOSROFullStory) => Promise<any>) {
		this._callbackOnROStory = cb
	}
}
