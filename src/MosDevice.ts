import * as XMLBuilder from 'xmlbuilder'
import { Socket } from 'net'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { MosString128 } from './dataTypes/mosString128'
import { MosTime } from './dataTypes/mosTime'
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData'
import { MosDuration } from './dataTypes/mosDuration'
import { IMOSListMachInfo, IMOSDefaultActiveX } from './mosModel/0_listMachInfo'
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
	IMOSObjectPath,
	IMOSObjectPathType,
	IMOSAckStatus,
	IMOSObjectStatus
} from './api'
import { IConnectionConfig } from './config/connectionConfig'
import { SocketDescription } from './connection/socketConnection'
import { Parser } from './mosModel/Parser'
import { MosMessage } from './mosModel/MosMessage'
import { MOSAck } from './mosModel/mosAck'
import { ROList } from './mosModel/ROList'
const iconv = require('iconv-lite')

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

	private _id: string
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
	private _primaryConnection: NCSServerConnection
	private _secondaryConnection: NCSServerConnection
	private _currentConnection: NCSServerConnection

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

	private _tmp: string = ''

	constructor (
		connectionConfig: IConnectionConfig,
		primaryConnection: NCSServerConnection,
		secondaryConnection: NCSServerConnection | null
	) {
		this._id = new MosString128(connectionConfig.mosID).toString()
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

		this._primaryConnection = primaryConnection
		this._primaryConnection.onConnectionChange(() => this.emitConnectionChange())
		this._currentConnection = this._primaryConnection

		if (secondaryConnection) {
			this._secondaryConnection = secondaryConnection
			this._secondaryConnection.onConnectionChange(() => this.emitConnectionChange())
		}
	}

	get id (): string {
		return this._id
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('listMachInfo') // config headless
		root.ele('manufacturer', this.manufacturer.toString())
		root.ele('model', this.model.toString())
		root.ele('hwRev', this.hwRev.toString())
		root.ele('swRev', this.swRev.toString())
		root.ele('DOM', this.DOM.toString())
		root.ele('SN', this.SN.toString())
		root.ele('ID', this.ID.toString())
		root.ele('time', this.time.toString())
		root.ele('opTime', this.opTime.toString())
		root.ele('mosRev', this.mosRev.toString())

		let p = root.ele('supportedProfiles').att('deviceType', this.supportedProfiles.deviceType)
		for (let i = 0; i < 8; i++) {
			p.ele('mosProfile', (this.supportedProfiles['profile' + i] ? 'YES' : 'NO')).att('number', i)
		}

		// root.ele('defaultActiveX', this.manufacturer)
		// root.ele('mosExternalMetaData', this.manufacturer) import from IMOSExternalMetaData
		return root
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
			// TODO: _callbackOnGetMachineInfo: () => Promise<IMOSListMachInfo>
			// TODO: _callbackOnConnectionChange: (connectionStatus: IMOSConnectionStatus) => void

			// Profile 1
			// TODO: _callbackOnRequestMOSOBject: (objId: string) => Promise<IMOSObject | null>
			// TODO: _callbackOnRequestAllMOSObjects: () => Promise<Array<IMOSObject>>
			if (data.roCreate && typeof this._callbackOnCreateRunningOrder === 'function') {
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
				let stories: Array<IMOSROStory> = Parser.xml2Stories(data.roReplace.story)
				let ro: IMOSRunningOrder = {
					ID: new MosString128(data.roReplace.roID),
					Slug: new MosString128(data.roReplace.roSlug),
					Stories: stories
				}

				if (data.roReplace.hasOwnProperty('roEdStart')) ro.EditorialStart = new MosTime(data.roReplace.roEdStart)
				if (data.roReplace.hasOwnProperty('roEdDur')) ro.EditorialDuration = new MosDuration(data.roReplace.roEdDur)
				if (data.roReplace.hasOwnProperty('mosExternalMetadata')) {
					// TODO: Handle an array of mosExternalMetadata
					let meta: IMOSExternalMetaData = {
						MosSchema: data.roReplace.mosExternalMetadata.mosSchema,
						MosPayload: data.roReplace.mosExternalMetadata.mosPayload
					}
					if (data.roReplace.mosExternalMetadata.hasOwnProperty('mosScope')) meta.MosScope = data.roReplace.mosExternalMetadata.mosScope
					ro.MosExternalMetaData = [meta]
				}
				// TODO: Add & test DefaultChannel, Trigger, MacroIn, MacroOut
				// console.log(ro)

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
				// _callbackOnRequestRunningOrder: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>

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

			// TODO: _callbackOnMetadataReplace: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>
			// TODO: _callbackOnRunningOrderStatus: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>
			} else if (data.roElementStat && data.roElementStat.element === 'RO' && typeof this._callbackOnRunningOrderStatus === 'function') {
				let status: IMOSRunningOrderStatus = {
					ID: new MosString128(data.roElementStat.roID),
					Status: IMOSObjectStatus[data.roElementStat.status.replace(' ','_')],
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
					Status: IMOSObjectStatus[data.roElementStat.status],
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
					Status: IMOSObjectStatus[data.roElementStat.status],
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
				data.roElementAction.element_source &&
				data.roElementAction.element_source.story &&
				typeof this._callbackOnROInsertStories === 'function'
			) {
				let stories: Array<IMOSROStory> = Parser.xml2Stories([data.roElementAction.element_source.story])

				this._callbackOnROInsertStories({
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
				}, stories).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			// _callbackOnROInsertItems: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
			} else if (
				data.roElementAction &&
				data.roElementAction.operation === 'INSERT' &&
				data.roElementAction.element_source &&
				data.roElementAction.element_source.item &&
				typeof this._callbackOnROInsertItems === 'function'
			) {
				// console.log(data.roElementAction.element_source.item)

				let action: IMOSItemAction = {
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128(data.roElementAction.element_target.storyID),
					ItemID:  new MosString128(data.roElementAction.element_target.itemID)
				}

				this._callbackOnROInsertItems(
					action,
					Parser.xml2Items(data.roElementAction.element_source.item))
				.then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					// ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)
			// TODO: _callbackOnROReplaceStories: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
			// TODO: _callbackOnROReplaceItems: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>

			} else if (data.roElementAction &&
				data.roElementAction.operation === 'MOVE'
				&& typeof this._callbackOnROMoveStories === 'function'
			) {
				let stories: Array<MosString128> = []

				// Multiple stories, push all to array
				if (data.roElementAction.element_source.storyID instanceof Array) {
					for (let i = 0; i < data.roElementAction.element_source.storyID.length; i++) {
						stories.push(new MosString128(data.roElementAction.element_source.storyID[i]))
					}

				// Single story, store string in array
				} else {
					stories.push(new MosString128(data.roElementAction.element_source.storyID))
				}

				this._callbackOnROMoveStories({
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128(data.roElementAction.element_target.storyID)
				}, stories).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			// TODO: _callbackOnROMoveStories: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
			// TODO: _callbackOnROMoveItems: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>
			// TODO: _callbackOnRODeleteStories: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>

			} else if (data.roElementAction &&
				data.roElementAction.operation === 'DELETE' &&
				typeof this._callbackOnRODeleteStories === 'function'
			) {
				let stories: Array<MosString128> = []

				// Multiple stories, push all to array
				if (data.roElementAction.element_source.storyID instanceof Array) {
					for (let i = 0; i < data.roElementAction.element_source.storyID.length; i++) {
						stories.push(new MosString128(data.roElementAction.element_source.storyID[i]))
					}

				// Single story, store string in array
				} else {
					stories.push(new MosString128(data.roElementAction.element_source.storyID))
				}

				this._callbackOnRODeleteStories({
					RunningOrderID: new MosString128(data.roElementAction.roID)
				}, stories).then((resp: IMOSROAck) => {
					let ack = new ROAck()
					ack.ID = resp.ID
					ack.Status = resp.Status
					ack.Stories = resp.Stories
					resolve(ack)
				}).catch(reject)

			// TODO: _callbackOnRODeleteItems: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>
			// TODO: _callbackOnROSwapStories: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>
			// TODO: _callbackOnROSwapItems: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>

			// Profile 4
			// TODO: private _callbackOnROStory: (story: IMOSROFullStory) => Promise<any>

			// TODO: Use MosMessage instead of string
			// TODO: Use reject if function dont exists? Put Nack in ondata
			} else {
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

		return new Promise((resolve) => {
			this._currentConnection.executeCommand(message).then((data) => {
				console.log('reply', data)
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
			PrimaryConnected: this._primaryConnection.connected,
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

	getMOSObject (objID: string): Promise < IMOSObject > {
		// TODO: Implement this
	}

	getAllMOSObjects (): Promise < Array < IMOSObject >> {
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

	getRunningOrder (runningOrderId: MosString128): Promise < IMOSRunningOrder | null > {
		// TODO: Implement this
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
		// TODO: Implement this
	}

	setStoryStatus (status: IMOSStoryStatus): Promise < IMOSROAck > {
		// TODO: Implement this
	}

	setItemStatus (status: IMOSItemStatus): Promise < IMOSROAck > {
		// TODO: Implement this
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
