import { Socket } from 'net'
import { NCSServerConnection } from './connection/NCSServerConnection'

import {
	IMOSObject,
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
	IMOSAckStatus,
	IMOSObjectStatus,
	IMOSObjectList,
	IMOSRequestObjectList,
	IMOSListSearchableSchema,
	IMOSAck,
	MosItemReplaceOptions,
	IMOSString128,
	IMOSTime,
	IMOSExternalMetaData,
	IMOSListMachInfo,
	IMOSDefaultActiveX,
} from '@mos-connection/model'
import { MosModel } from '@mos-connection/helper'
import { IConnectionConfig, IMOSConnectionStatus, IMOSDevice } from './api'
import { MosString128, MosTime } from '@mos-connection/helper'
import { has, isEmpty, safeStringify } from './lib'

export class MosDevice implements IMOSDevice {
	// private _host: string
	socket: Socket
	manufacturer: IMOSString128
	model: IMOSString128
	hwRev: IMOSString128
	swRev: IMOSString128
	DOM: IMOSTime
	SN: IMOSString128
	ID: IMOSString128
	time: IMOSTime
	opTime: IMOSTime
	mosRev: IMOSString128
	defaultActiveX?: Array<IMOSDefaultActiveX>
	mosExternalMetaData?: Array<IMOSExternalMetaData>

	private _idPrimary: string
	private _idSecondary: string | null
	private _debug = false

	private supportedProfiles: {
		deviceType: 'NCS' | 'MOS'
	} & IProfiles = {
		deviceType: 'MOS',
		profile0: false,
		profile1: false,
		profile2: false,
		profile3: false,
		profile4: false,
		profile5: false,
		profile6: false,
		profile7: false,
	} // Use same names as IProfiles?

	/** If set, will do more checks that mos-protocol is properly implemented */
	private _strict: boolean | undefined
	private _disposed = false

	private _primaryConnection: NCSServerConnection | null = null
	private _secondaryConnection: NCSServerConnection | null = null
	private _currentConnection: NCSServerConnection | null = null

	// Callbacks for Profile 0:
	private _callbackOnRequestMachineInfo?: () => Promise<IMOSListMachInfo>
	private _callbackOnConnectionChange?: (connectionStatus: IMOSConnectionStatus) => void

	// Callbacks for Profile 1:
	private _callbackOnRequestMOSOBject?: (objId: string) => Promise<IMOSObject | null>
	private _callbackOnRequestAllMOSObjects?: () => Promise<Array<IMOSObject>>

	// Callbacks for Profile 2:
	private _callbackOnCreateRunningOrder?: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnReplaceRunningOrder?: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnDeleteRunningOrder?: (runningOrderId: IMOSString128) => Promise<IMOSROAck>
	private _callbackOnRequestRunningOrder?: (runningOrderId: IMOSString128) => Promise<IMOSRunningOrder | null>
	private _callbackOnMetadataReplace?: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>
	private _callbackOnRunningOrderStatus?: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>
	private _callbackOnStoryStatus?: (status: IMOSStoryStatus) => Promise<IMOSROAck>
	private _callbackOnItemStatus?: (status: IMOSItemStatus) => Promise<IMOSROAck>
	private _callbackOnReadyToAir?: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>
	private _callbackOnROInsertStories?: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROInsertItems?: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROReplaceStories?: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROReplaceItems?: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROMoveStories?: (Action: IMOSStoryAction, Stories: Array<IMOSString128>) => Promise<IMOSROAck>
	private _callbackOnROMoveItems?: (Action: IMOSItemAction, Items: Array<IMOSString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteStories?: (Action: IMOSROAction, Stories: Array<IMOSString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteItems?: (Action: IMOSStoryAction, Items: Array<IMOSString128>) => Promise<IMOSROAck>
	private _callbackOnROSwapStories?: (
		Action: IMOSROAction,
		StoryID0: IMOSString128,
		StoryID1: IMOSString128
	) => Promise<IMOSROAck>
	private _callbackOnROSwapItems?: (
		Action: IMOSStoryAction,
		ItemID0: IMOSString128,
		ItemID1: IMOSString128
	) => Promise<IMOSROAck>

	// Callbacks for Profile 3:
	private _callbackOnItemReplace?: (roId: IMOSString128, storyID: IMOSString128, item: IMOSItem) => Promise<IMOSROAck>
	private _callbackOnObjectCreate?: (obj: IMOSObject) => Promise<IMOSAck>
	private _callbackOnRequestObjectActionNew?: (obj: IMOSObject) => Promise<IMOSAck>
	private _callbackOnRequestObjectActionUpdate?: (objId: IMOSString128, obj: IMOSObject) => Promise<IMOSAck>
	private _callbackOnRequestObjectActionDelete?: (objId: IMOSString128) => Promise<IMOSAck>
	private _callbackOnRequestObjectList?: (objList: IMOSRequestObjectList) => Promise<IMOSObjectList>
	private _callbackOnRequestSearchableSchema?: (username: string) => Promise<IMOSListSearchableSchema>

	// Callbacks for Profile 4:
	private _callbackOnRequestAllRunningOrders?: () => Promise<IMOSRunningOrder[]>
	private _callbackOnRunningOrderStory?: (story: IMOSROFullStory) => Promise<IMOSROAck>

	constructor(
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
			this._primaryConnection.on('connectionChanged', () => {
				this._emitConnectionChange()
				if (
					offSpecFailover &&
					this._currentConnection !== this._primaryConnection &&
					this._primaryConnection?.connected
				) {
					this.switchConnections() // and hope no current message goes lost
				}
			})
		}
		if (secondaryConnection) {
			this._secondaryConnection = secondaryConnection
			this._secondaryConnection.on('connectionChanged', () => this._emitConnectionChange())
		}
		this._currentConnection = this._primaryConnection || this._secondaryConnection || null
		if (this._strict) {
			setTimeout(() => {
				if (this._disposed) return
				try {
					this._checkProfileValidness()
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error(e)
				}
			}, 1000)
		}
	}
	/** True if MOS-device has connection to server (can send messages) */
	get hasConnection(): boolean {
		return !!this._currentConnection
	}
	/** Primary ID (probably the NCS-ID) */
	get idPrimary(): string {
		return this._idPrimary
	}
	/** Secondary / Buddy ID (probably the MOS-ID) */
	get idSecondary(): string | null {
		return this._idSecondary
	}
	/** Host name (IP-address) of the primary server */
	get primaryHost(): string | null {
		return this._primaryConnection ? this._primaryConnection.host : null
	}
	/** Name (ID) of the primary server */
	get primaryId(): string | null {
		return this._primaryConnection ? this._primaryConnection.id : null
	}
	/** Host name (IP-address) of the secondary (buddy) server */
	get secondaryHost(): string | null {
		return this._secondaryConnection ? this._secondaryConnection.host : null
	}
	/** Name (ID) of the secondary (buddy) server */
	get secondaryId(): string | null {
		return this._secondaryConnection ? this._secondaryConnection.id : null
	}

	connect(): void {
		if (this._primaryConnection) this._primaryConnection.connect()
		if (this._secondaryConnection) this._secondaryConnection.connect()
	}
	async dispose(): Promise<void> {
		this._currentConnection = null
		const ps: Array<Promise<any>> = []
		if (this._primaryConnection) ps.push(this._primaryConnection.dispose())
		if (this._secondaryConnection) ps.push(this._secondaryConnection.dispose())
		await Promise.all(ps)
	}

	async routeData(data: MosModel.AnyXML, port: MosModel.PortType): Promise<any> {
		if (data && has(data, 'mos')) data = data['mos']

		// Suppress console spam:
		if (!has(data, 'heartbeat')) {
			this.debugTrace('parsedData', data)
			// this.debugTrace('keys', Object.keys(data))
		}

		// Route and format data:
		// Profile 0:
		if (data.heartbeat) {
			// send immediate reply on the same port:
			return new MosModel.HeartBeat(port)
		} else if (data.reqMachInfo && typeof this._callbackOnRequestMachineInfo === 'function') {
			if (port === 'query') throw new Error('message "reqMachInfo" is invalid on query port')
			const m = await this._callbackOnRequestMachineInfo()
			return new MosModel.ListMachineInfo(m, port)
			// Profile 1:
		} else if (data.mosReqObj && typeof this._callbackOnRequestMOSOBject === 'function') {
			const mosObj = await this._callbackOnRequestMOSOBject(data.mosReqObj.objID)
			if (!mosObj) return null
			return new MosModel.MosObj(mosObj)
		} else if (data.mosReqAll && typeof this._callbackOnRequestAllMOSObjects === 'function') {
			const pause = data.mosReqAll.pause || 0
			const mosObjects = await this._callbackOnRequestAllMOSObjects()

			setImmediate(() => {
				// spec: Pause, when greater than zero, indicates the number of seconds to pause
				// between individual mosObj messages.
				// Pause of zero indicates that all objects will be sent using the mosListAll message..
				// http://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS-Protocol-2.8.4-Current.htm#mosReqAll
				if (pause > 0) {
					if (mosObjects.length) {
						// const firstObject = mosObjects.shift() as IMOSObject
						// const resp = new MosObj(firstObject)
						// resolve(resp)
						const sendNextObject = () => {
							if (this._disposed) return
							const nextObject = mosObjects.shift()
							if (nextObject) {
								this.sendMOSObject(nextObject)
									.then(() => {
										setTimeout(sendNextObject, pause * 1000)
									})
									.catch((e) => {
										console.error('Error in async mosObj response to mosReqAll', e)
									})
							}
						}
						setTimeout(sendNextObject, pause * 1000)
					}
				} else {
					this._sendAllMOSObjects(mosObjects).catch((e) => {
						console.error('Error in async mosListAll response to mosReqAll', e)
					})
				}
			})

			// What this should contain isn't well defined in the protocol
			return new MosModel.MOSAck({
				ID: new MosString128(0),
				Revision: 0,
				Description: new MosString128(''),
				Status: IMOSAckStatus.ACK,
			})

			// Profile 2:
		} else if (data.roCreate && typeof this._callbackOnCreateRunningOrder === 'function') {
			const ro = MosModel.XMLRunningOrder.fromXML(data.roCreate)

			const resp = await this._callbackOnCreateRunningOrder(ro)
			return new MosModel.ROAck(resp)
		} else if (data.roReplace && typeof this._callbackOnReplaceRunningOrder === 'function') {
			const ro: IMOSRunningOrder = MosModel.XMLRunningOrder.fromXML(data.roReplace)

			const resp = await this._callbackOnReplaceRunningOrder(ro)
			return new MosModel.ROAck(resp)
		} else if (data.roDelete && typeof this._callbackOnDeleteRunningOrder === 'function') {
			// TODO: Change runningOrderId to RunningOrderID in interface?
			const resp = await this._callbackOnDeleteRunningOrder(data.roDelete.roID)
			return new MosModel.ROAck(resp)
		} else if (data.roReq && typeof this._callbackOnRequestRunningOrder === 'function') {
			const ro = await this._callbackOnRequestRunningOrder(data.roReq.roID)
			if (ro) {
				return new MosModel.ROList(ro)
			} else {
				// RO not found
				return new MosModel.ROAck({
					ID: data.roReq.roID,
					Status: new MosString128(IMOSAckStatus.NACK),
					Stories: [],
				})
			}
		} else if (data.roMetadataReplace && typeof this._callbackOnMetadataReplace === 'function') {
			const ro: IMOSRunningOrderBase = MosModel.XMLRunningOrderBase.fromXML(data.roMetadataReplace)
			const resp = await this._callbackOnMetadataReplace(ro)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementStat &&
			data.roElementStat.element === 'RO' &&
			typeof this._callbackOnRunningOrderStatus === 'function'
		) {
			const status: IMOSRunningOrderStatus = {
				ID: new MosString128(data.roElementStat.roID),
				Status: data.roElementStat.status,
				Time: new MosTime(data.roElementStat.time),
			}

			const resp = await this._callbackOnRunningOrderStatus(status)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementStat &&
			data.roElementStat.element === 'STORY' &&
			typeof this._callbackOnStoryStatus === 'function'
		) {
			const status: IMOSStoryStatus = {
				RunningOrderId: new MosString128(data.roElementStat.roID),
				ID: new MosString128(data.roElementStat.storyID),
				Status: data.roElementStat.status as IMOSObjectStatus,
				Time: new MosTime(data.roElementStat.time),
			}

			const resp = await this._callbackOnStoryStatus(status)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementStat &&
			data.roElementStat.element === 'ITEM' &&
			typeof this._callbackOnItemStatus === 'function'
		) {
			const status: IMOSItemStatus = {
				RunningOrderId: new MosString128(data.roElementStat.roID),
				StoryId: new MosString128(data.roElementStat.storyID),
				ID: new MosString128(data.roElementStat.itemID),
				Status: data.roElementStat.status as IMOSObjectStatus,
				Time: new MosTime(data.roElementStat.time),
			}
			if (has(data.roElementStat, 'objID')) status.ObjectId = new MosString128(data.roElementStat.objID)
			if (has(data.roElementStat, 'itemChannel'))
				status.Channel = new MosString128(data.roElementStat.itemChannel)

			const resp = await this._callbackOnItemStatus(status)
			return new MosModel.ROAck(resp)
		} else if (data.roReadyToAir && typeof this._callbackOnReadyToAir === 'function') {
			const resp = await this._callbackOnReadyToAir({
				ID: new MosString128(data.roReadyToAir.roID),
				Status: data.roReadyToAir.roAir,
			})
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'INSERT' &&
			(data.roElementAction.element_source || {}).story &&
			typeof this._callbackOnROInsertStories === 'function'
		) {
			const action: IMOSStoryAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
			}
			const stories: Array<IMOSROStory> = MosModel.XMLROStories.fromXML([
				data.roElementAction.element_source.story,
			])
			const resp = await this._callbackOnROInsertStories(action, stories)

			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'INSERT' &&
			(data.roElementAction.element_source || {}).item &&
			typeof this._callbackOnROInsertItems === 'function'
		) {
			const action: IMOSItemAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
				ItemID: new MosString128((data.roElementAction.element_target || {}).itemID),
			}
			const items: Array<IMOSItem> = MosModel.XMLMosItems.fromXML(data.roElementAction.element_source.item)
			const resp = await this._callbackOnROInsertItems(action, items)

			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'REPLACE' &&
			(data.roElementAction.element_source || {}).story &&
			typeof this._callbackOnROReplaceStories === 'function'
		) {
			const action: IMOSStoryAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
			}
			const stories: Array<IMOSROStory> = MosModel.XMLROStories.fromXML([
				data.roElementAction.element_source.story,
			])
			const resp = await this._callbackOnROReplaceStories(action, stories)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'REPLACE' &&
			(data.roElementAction.element_source || {}).item &&
			typeof this._callbackOnROReplaceItems === 'function'
		) {
			const action: IMOSItemAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
				ItemID: new MosString128((data.roElementAction.element_target || {}).itemID),
			}
			const items: Array<IMOSItem> = MosModel.XMLMosItems.fromXML(data.roElementAction.element_source.item)
			const resp = await this._callbackOnROReplaceItems(action, items)
			resp.Stories = [] // dont return these (?)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'MOVE' &&
			(data.roElementAction.element_source || {}).storyID &&
			typeof this._callbackOnROMoveStories === 'function'
		) {
			const action: IMOSStoryAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
			}
			const storyIDs: Array<IMOSString128> = MosModel.XMLMosIDs.fromXML(
				data.roElementAction.element_source.storyID
			)
			const resp = await this._callbackOnROMoveStories(action, storyIDs)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'MOVE' &&
			(data.roElementAction.element_source || {}).itemID &&
			typeof this._callbackOnROMoveItems === 'function'
		) {
			const action: IMOSItemAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
				ItemID: new MosString128((data.roElementAction.element_target || {}).itemID),
			}
			const itemIDs: Array<IMOSString128> = MosModel.XMLMosIDs.fromXML(data.roElementAction.element_source.itemID)
			const resp = await this._callbackOnROMoveItems(action, itemIDs)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'DELETE' &&
			data.roElementAction.element_source.storyID &&
			typeof this._callbackOnRODeleteStories === 'function'
		) {
			const stories: Array<IMOSString128> = MosModel.XMLMosIDs.fromXML(
				data.roElementAction.element_source.storyID
			)

			const resp = await this._callbackOnRODeleteStories(
				{
					RunningOrderID: new MosString128(data.roElementAction.roID),
				},
				stories
			)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'DELETE' &&
			data.roElementAction.element_source.itemID &&
			typeof this._callbackOnRODeleteItems === 'function'
		) {
			const action: IMOSStoryAction = {
				RunningOrderID: new MosString128(data.roElementAction.roID),
				StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
			}
			const items: Array<IMOSString128> = MosModel.XMLMosIDs.fromXML(data.roElementAction.element_source.itemID)

			const resp = await this._callbackOnRODeleteItems(action, items)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'SWAP' &&
			data.roElementAction.element_source.storyID &&
			data.roElementAction.element_source.storyID.length === 2 &&
			typeof this._callbackOnROSwapStories === 'function'
		) {
			const stories: Array<IMOSString128> = MosModel.XMLMosIDs.fromXML(
				data.roElementAction.element_source.storyID
			)

			const resp = await this._callbackOnROSwapStories(
				{
					RunningOrderID: new MosString128(data.roElementAction.roID),
				},
				stories[0],
				stories[1]
			)
			return new MosModel.ROAck(resp)
		} else if (
			data.roElementAction &&
			data.roElementAction.operation === 'SWAP' &&
			data.roElementAction.element_source.itemID &&
			data.roElementAction.element_source.itemID.length === 2 &&
			typeof this._callbackOnROSwapItems === 'function'
		) {
			const items: Array<IMOSString128> = MosModel.XMLMosIDs.fromXML(data.roElementAction.element_source.itemID)

			const resp = await this._callbackOnROSwapItems(
				{
					RunningOrderID: new MosString128(data.roElementAction.roID),
					StoryID: new MosString128((data.roElementAction.element_target || {}).storyID),
				},
				items[0],
				items[1]
			)
			return new MosModel.ROAck(resp)

			// Profile 3
		} else if (data.mosItemReplace && typeof this._callbackOnItemReplace === 'function') {
			const resp = await this._callbackOnItemReplace(
				data.mosItemReplace.ID,
				data.mosItemReplace.itemID,
				MosModel.XMLMosItem.fromXML(data.mosItemReplace.item)
			)
			return new MosModel.ROAck(resp)
		} else if (data.mosObjCreate && typeof this._callbackOnObjectCreate === 'function') {
			const resp = await this._callbackOnObjectCreate(MosModel.XMLMosObject.fromXML(data.mosObjCreate))

			const ack = new MosModel.MOSAck(resp)
			return ack
		} else if (
			data.mosReqObjAction &&
			data.mosReqObjAction.operation === 'NEW' &&
			typeof this._callbackOnRequestObjectActionNew === 'function'
		) {
			const resp = await this._callbackOnRequestObjectActionNew(
				MosModel.XMLMosObject.fromXML(data.mosReqObjAction)
			)
			return new MosModel.MOSAck(resp)
		} else if (
			data.mosReqObjAction &&
			data.mosReqObjAction.operation === 'UPDATE' &&
			typeof this._callbackOnRequestObjectActionUpdate === 'function'
		) {
			const resp = await this._callbackOnRequestObjectActionUpdate(
				data.mosReqObjAction.objID,
				MosModel.XMLMosObject.fromXML(data.mosReqObjAction)
			)
			return new MosModel.MOSAck(resp)
		} else if (
			data.mosReqObjAction &&
			data.mosReqObjAction.operation === 'DELETE' &&
			typeof this._callbackOnRequestObjectActionDelete === 'function'
		) {
			const resp = await this._callbackOnRequestObjectActionDelete(data.mosReqObjAction.objID)
			return new MosModel.MOSAck(resp)
		} else if (data.mosReqObjList && typeof this._callbackOnRequestObjectList === 'function') {
			const resp = await this._callbackOnRequestObjectList(
				MosModel.XMLMosRequestObjectList.fromXML(data.mosReqObjList)
			)
			return new MosModel.MosObjList(resp)
		} else if (data.mosReqSearchableSchema && typeof this._callbackOnRequestSearchableSchema === 'function') {
			const resp = await this._callbackOnRequestSearchableSchema(data.mosReqSearchableSchema.username)
			return new MosModel.MosListSearchableSchema(resp)

			// Profile 4
		} else if (data.roReqAll && typeof this._callbackOnRequestAllRunningOrders === 'function') {
			const list = await this._callbackOnRequestAllRunningOrders()
			const roListAll = new MosModel.ROListAll()
			roListAll.ROs = list
			return roListAll
		} else if (data.roStorySend && typeof this._callbackOnRunningOrderStory === 'function') {
			const story: IMOSROFullStory = MosModel.XMLROFullStory.fromXML(data.roStorySend)
			const resp = await this._callbackOnRunningOrderStory(story)
			return new MosModel.ROAck(resp)

			// TODO: Use MosMessage instead of string
			// TODO: Use reject if function dont exists? Put Nack in ondata
		} else {
			this.debugTrace('Unsupported function')
			this.debugTrace(data)
			const keys = Object.keys(data).filter((key) => ['ncsID', 'mosID', 'messageID'].indexOf(key) === -1)
			return new MosModel.MOSAck({
				ID: new MosString128(0), // Depends on type of message, needs logic
				Revision: 0,
				Description: new MosString128(`Unsupported function: "${keys.join(', ')}"`),
				Status: IMOSAckStatus.NACK,
			})
		}
	}

	// ============================================================================================================
	// ==========================   Profile 0   ===================================================================
	// ============================================================================================================
	async requestMachineInfo(): Promise<IMOSListMachInfo> {
		const message = new MosModel.ReqMachInfo()

		const data = await this.executeCommand(message)
		const listMachInfo = data.mos.listMachInfo

		let dom: IMOSTime | undefined
		if (!isEmpty(listMachInfo.DOM)) {
			try {
				dom = new MosTime(listMachInfo.DOM)
			} catch (e) {
				// TODO: This is a hack, DOM probably should be a string not IMOSTime. But that means breaking api change
				dom = undefined
				this.debugTrace(`Failed to parse DOM as IMOSTime: ${e}`)
			}
		}

		const list: IMOSListMachInfo = {
			manufacturer: new MosString128(listMachInfo.manufacturer),
			model: new MosString128(listMachInfo.model),
			hwRev: new MosString128(listMachInfo.hwRev),
			swRev: new MosString128(listMachInfo.swRev),
			DOM: dom,
			SN: new MosString128(listMachInfo.SN),
			ID: new MosString128(listMachInfo.ID),
			time: new MosTime(listMachInfo.time),
			opTime: new MosTime(listMachInfo.opTime),
			mosRev: new MosString128(listMachInfo.mosRev),
			supportedProfiles: {
				deviceType: listMachInfo.supportedProfiles.deviceType,
			},
			defaultActiveX: listMachInfo.defaultActiveX,
			mosExternalMetaData: listMachInfo.mosExternalMetaData,
		}

		if (Array.isArray(listMachInfo.supportedProfiles.mosProfile)) {
			for (const mosProfile of listMachInfo.supportedProfiles.mosProfile) {
				// @ts-expect-error hack
				list.supportedProfiles[`profile${mosProfile.attributes.number}`] = mosProfile.text === 'YES'
			}
		}

		return list
	}

	onRequestMachineInfo(cb: () => Promise<IMOSListMachInfo>): void {
		this.checkProfile('onRequestMachineInfo', 'profile1')
		this._callbackOnRequestMachineInfo = cb
	}

	onConnectionChange(cb: (connectionStatus: IMOSConnectionStatus) => void): void {
		this.checkProfile('onConnectionChange', 'profile1')
		this._callbackOnConnectionChange = cb
	}

	getConnectionStatus(): IMOSConnectionStatus {
		// TODO: Implement this
		return {
			PrimaryConnected: this._primaryConnection ? this._primaryConnection.connected : false,
			PrimaryStatus: '',
			SecondaryConnected: this._secondaryConnection ? this._secondaryConnection.connected : false,
			SecondaryStatus: '',
		}
	}

	// Deprecated methods:
	/** @deprecated getMachineInfo is deprecated, use requestMachineInfo instead */
	async getMachineInfo(): Promise<IMOSListMachInfo> {
		return this.requestMachineInfo()
	}
	/** @deprecated onGetMachineInfo is deprecated, use onRequestMachineInfo instead */
	onGetMachineInfo(cb: () => Promise<IMOSListMachInfo>): void {
		return this.onRequestMachineInfo(cb)
	}

	// ============================================================================================================
	// ==========================   Profile 1   ===================================================================
	// ============================================================================================================
	async sendMOSObject(obj: IMOSObject): Promise<IMOSAck> {
		const message = new MosModel.MosObj(obj)

		const reply = await this.executeCommand(message)

		const ack: IMOSAck = MosModel.XMLMosAck.fromXML(reply.mos.mosAck)
		return ack
	}

	onRequestMOSObject(cb: (objId: string) => Promise<IMOSObject | null>): void {
		this.checkProfile('onRequestMOSObject', 'profile1')
		this._callbackOnRequestMOSOBject = cb
	}

	async sendRequestMOSObject(objID: IMOSString128): Promise<IMOSObject> {
		const message = new MosModel.ReqMosObj(objID)

		const reply = await this.executeCommand(message)
		if (reply.mos.roAck) {
			throw new Error(MosModel.XMLMosROAck.fromXML(reply.mos.roAck).toString())
		} else if (reply.mos.mosObj) {
			const obj: IMOSObject = MosModel.XMLMosObject.fromXML(reply.mos.mosObj)
			return obj
		} else {
			throw new Error(`Unknown response: ${safeStringify(reply).slice(0, 200)}`)
		}
	}

	onRequestAllMOSObjects(cb: () => Promise<Array<IMOSObject>>): void {
		this.checkProfile('onRequestAllMOSObjects', 'profile1')
		this._callbackOnRequestAllMOSObjects = cb
	}

	async sendRequestAllMOSObjects(): Promise<Array<IMOSObject>> {
		const message = new MosModel.ReqMosObjAll()
		const reply = await this.executeCommand(message)
		if (reply.mos.roAck) {
			throw new Error(MosModel.XMLMosROAck.fromXML(reply.mos.roAck).toString())
		} else if (reply.mos.mosListAll) {
			const objs: Array<IMOSObject> = MosModel.XMLMosObjects.fromXML(reply.mos.mosListAll.mosObj)
			return objs
		} else {
			throw new Error(`Unknown response: ${safeStringify(reply).slice(0, 200)}`)
		}
	}

	/**
	 * http://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS-Protocol-2.8.4-Current.htm#mosListAll
	 */
	private async _sendAllMOSObjects(objs: IMOSObject[]): Promise<IMOSAck> {
		const message = new MosModel.MosListAll(objs)
		const reply = await this.executeCommand(message)
		if (reply.mos) {
			const ack: IMOSAck = MosModel.XMLMosAck.fromXML(reply.mos.mosAck)
			return ack
		} else {
			throw new Error(`Unknown response: ${safeStringify(reply).slice(0, 200)}`)
		}
	}

	/**
	 * @deprecated getMOSObject is deprecated, use sendRequestMOSObject instead
	 */
	async getMOSObject(objId: IMOSString128): Promise<IMOSObject> {
		return this.sendRequestMOSObject(objId)
	}
	/** @deprecated getAllMOSObjects is deprecated, use sendRequestAllMOSObjects instead */
	async getAllMOSObjects(): Promise<IMOSObject[]> {
		return this.sendRequestAllMOSObjects()
	}

	// ============================================================================================================
	// ==========================   Profile 2   ===================================================================
	// ============================================================================================================
	onCreateRunningOrder(cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>): void {
		this.checkProfile('onCreateRunningOrder', 'profile2')
		this._callbackOnCreateRunningOrder = cb
	}
	async sendCreateRunningOrder(ro: IMOSRunningOrder): Promise<IMOSROAck> {
		const message = new MosModel.ROCreate(ro)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	onReplaceRunningOrder(cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>): void {
		this.checkProfile('onReplaceRunningOrder', 'profile2')
		this._callbackOnReplaceRunningOrder = cb
	}
	async sendReplaceRunningOrder(ro: IMOSRunningOrder): Promise<IMOSROAck> {
		const message = new MosModel.ROReplace(ro)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	onDeleteRunningOrder(cb: (runningOrderId: IMOSString128) => Promise<IMOSROAck>): void {
		this.checkProfile('onDeleteRunningOrder', 'profile2')
		this._callbackOnDeleteRunningOrder = cb
	}
	async sendDeleteRunningOrder(runningOrderId: IMOSString128): Promise<IMOSROAck> {
		const message = new MosModel.RODelete(runningOrderId)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	onRequestRunningOrder(cb: (runningOrderId: IMOSString128) => Promise<IMOSRunningOrder | null>): void {
		this.checkProfile('onRequestRunningOrder', 'profile2')
		this._callbackOnRequestRunningOrder = cb
	}

	async sendRequestRunningOrder(runningOrderId: IMOSString128): Promise<IMOSRunningOrder | null> {
		const message = new MosModel.ROReq(runningOrderId)
		const reply = await this.executeCommand(message)
		if (reply.mos.roList) {
			const ro: IMOSRunningOrder = MosModel.XMLRunningOrder.fromXML(reply.mos.roList)
			return ro
		} else throw new Error(`Unknown response: ${safeStringify(reply).slice(0, 200)}`)
	}
	/**
	 * @deprecated getRunningOrder is deprecated, use sendRequestRunningOrder instead
	 */
	async getRunningOrder(runningOrderId: IMOSString128): Promise<IMOSRunningOrder | null> {
		return this.sendRequestRunningOrder(runningOrderId)
	}

	onMetadataReplace(cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>): void {
		this.checkProfile('onMetadataReplace', 'profile2')
		this._callbackOnMetadataReplace = cb
	}
	async sendMetadataReplace(metadata: IMOSRunningOrderBase): Promise<IMOSROAck> {
		const message = new MosModel.ROMetadataReplace(metadata)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	onRunningOrderStatus(cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>): void {
		this.checkProfile('onRunningOrderStatus', 'profile2')
		this._callbackOnRunningOrderStatus = cb
	}

	onStoryStatus(cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>): void {
		this.checkProfile('onStoryStatus', 'profile2')
		this._callbackOnStoryStatus = cb
	}
	onItemStatus(cb: (status: IMOSItemStatus) => Promise<IMOSROAck>): void {
		this.checkProfile('onItemStatus', 'profile2')
		this._callbackOnItemStatus = cb
	}

	/** @deprecated setRunningOrderStatus is deprecated, use sendRunningOrderStatus instead */
	async setRunningOrderStatus(status: IMOSRunningOrderStatus): Promise<IMOSROAck> {
		return this.sendRunningOrderStatus(status)
	}
	/** @deprecated setStoryStatus is deprecated, use sendStoryStatus instead */
	async setStoryStatus(status: IMOSStoryStatus): Promise<IMOSROAck> {
		return this.sendStoryStatus(status)
	}
	/** @deprecated setItemStatus is deprecated, use sendItemStatus instead */
	async setItemStatus(status: IMOSItemStatus): Promise<IMOSROAck> {
		return this.sendItemStatus(status)
	}

	async sendRunningOrderStatus(status: IMOSRunningOrderStatus): Promise<IMOSROAck> {
		const message = new MosModel.ROElementStat({
			type: MosModel.ROElementStatType.RO,
			roId: new MosString128(status.ID),
			status: status.Status,
		})
		const reply = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(reply.mos.roAck)
	}

	async sendStoryStatus(status: IMOSStoryStatus): Promise<IMOSROAck> {
		const message = new MosModel.ROElementStat({
			type: MosModel.ROElementStatType.STORY,
			roId: new MosString128(status.RunningOrderId),
			storyId: new MosString128(status.ID),
			status: status.Status,
		})
		const reply = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(reply.mos.roAck)
	}
	async sendItemStatus(status: IMOSItemStatus): Promise<IMOSROAck> {
		const message = new MosModel.ROElementStat({
			type: MosModel.ROElementStatType.ITEM,
			roId: new MosString128(status.RunningOrderId),
			storyId: new MosString128(status.StoryId),
			itemId: new MosString128(status.ID),
			objId: new MosString128(status.ObjectId),
			itemChannel: new MosString128(status.Channel),
			status: status.Status,
		})
		const reply = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(reply.mos.roAck)
	}
	onReadyToAir(cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>): void {
		this.checkProfile('onReadyToAir', 'profile2')
		this._callbackOnReadyToAir = cb
	}
	async sendReadyToAir(Action: IMOSROReadyToAir): Promise<IMOSROAck> {
		const message = new MosModel.ROReadyToAir({
			roId: Action.ID,
			roAir: Action.Status,
		})

		const reply = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(reply.mos.roAck)
	}
	onROInsertStories(cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>): void {
		this.checkProfile('onROInsertStories', 'profile2')
		this._callbackOnROInsertStories = cb
	}
	async sendROInsertStories(Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> {
		const message = new MosModel.ROInsertStories(Action, Stories)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROInsertItems(cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>): void {
		this.checkProfile('onROInsertItems', 'profile2')
		this._callbackOnROInsertItems = cb
	}
	async sendROInsertItems(Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> {
		const message = new MosModel.ROInsertItems(Action, Items)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROReplaceStories(cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>): void {
		this.checkProfile('onROReplaceStories', 'profile2')
		this._callbackOnROReplaceStories = cb
	}
	async sendROReplaceStories(Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<IMOSROAck> {
		const message = new MosModel.ROReplaceStories(Action, Stories)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROReplaceItems(cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>): void {
		this.checkProfile('onROReplaceItems', 'profile2')
		this._callbackOnROReplaceItems = cb
	}
	async sendROReplaceItems(Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<IMOSROAck> {
		const message = new MosModel.ROReplaceItems(Action, Items)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROMoveStories(cb: (Action: IMOSStoryAction, Stories: Array<IMOSString128>) => Promise<IMOSROAck>): void {
		this.checkProfile('onROMoveStories', 'profile2')
		this._callbackOnROMoveStories = cb
	}
	async sendROMoveStories(Action: IMOSStoryAction, Stories: Array<IMOSString128>): Promise<IMOSROAck> {
		const message = new MosModel.ROMoveStories(Action, Stories)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROMoveItems(cb: (Action: IMOSItemAction, Items: Array<IMOSString128>) => Promise<IMOSROAck>): void {
		this.checkProfile('onROMoveItems', 'profile2')
		this._callbackOnROMoveItems = cb
	}
	async sendROMoveItems(Action: IMOSItemAction, Items: Array<IMOSString128>): Promise<IMOSROAck> {
		const message = new MosModel.ROMoveItems(Action, Items)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onRODeleteStories(cb: (Action: IMOSROAction, Stories: Array<IMOSString128>) => Promise<IMOSROAck>): void {
		this.checkProfile('onRODeleteStories', 'profile2')
		this._callbackOnRODeleteStories = cb
	}
	async sendRODeleteStories(Action: IMOSROAction, Stories: Array<IMOSString128>): Promise<IMOSROAck> {
		const message = new MosModel.RODeleteStories(Action, Stories)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onRODeleteItems(cb: (Action: IMOSStoryAction, Items: Array<IMOSString128>) => Promise<IMOSROAck>): void {
		this.checkProfile('onRODeleteItems', 'profile2')
		this._callbackOnRODeleteItems = cb
	}
	async sendRODeleteItems(Action: IMOSStoryAction, Items: Array<IMOSString128>): Promise<IMOSROAck> {
		const message = new MosModel.RODeleteItems(Action, Items)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROSwapStories(
		cb: (Action: IMOSROAction, StoryID0: IMOSString128, StoryID1: IMOSString128) => Promise<IMOSROAck>
	): void {
		this.checkProfile('onROSwapStories', 'profile2')
		this._callbackOnROSwapStories = cb
	}
	async sendROSwapStories(
		Action: IMOSROAction,
		StoryID0: IMOSString128,
		StoryID1: IMOSString128
	): Promise<IMOSROAck> {
		const message = new MosModel.ROSwapStories(Action, StoryID0, StoryID1)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}
	onROSwapItems(
		cb: (Action: IMOSStoryAction, ItemID0: IMOSString128, ItemID1: IMOSString128) => Promise<IMOSROAck>
	): void {
		this.checkProfile('onROSwapItems', 'profile2')
		this._callbackOnROSwapItems = cb
	}
	async sendROSwapItems(Action: IMOSStoryAction, ItemID0: IMOSString128, ItemID1: IMOSString128): Promise<IMOSROAck> {
		const message = new MosModel.ROSwapItems(Action, ItemID0, ItemID1)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	// ============================================================================================================
	// ==========================   Profile 3   ===================================================================
	// ============================================================================================================
	onObjectCreate(cb: (object: IMOSObject) => Promise<IMOSAck>): void {
		this.checkProfile('', 'profile3')
		this._callbackOnObjectCreate = cb
	}

	async sendObjectCreate(object: IMOSObject): Promise<IMOSAck> {
		const message = new MosModel.MosObjCreate(object)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosAck.fromXML(data.mos.mosAck)
	}

	onItemReplace(cb: (roID: IMOSString128, storyID: IMOSString128, item: IMOSItem) => Promise<IMOSROAck>): void {
		this.checkProfile('onItemReplace', 'profile3')
		this._callbackOnItemReplace = cb
	}

	async sendItemReplace(options: MosItemReplaceOptions): Promise<IMOSROAck> {
		const message = new MosModel.MosItemReplace(options)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	onRequestSearchableSchema(cb: (username: string) => Promise<IMOSListSearchableSchema>): void {
		this.checkProfile('onRequestSearchableSchema', 'profile3')
		this._callbackOnRequestSearchableSchema = cb
	}

	async sendRequestSearchableSchema(username: string): Promise<IMOSListSearchableSchema> {
		const message = new MosModel.MosReqSearchableSchema({ username })
		const response = await this.executeCommand(message)
		return response.mos.mosListSearchableSchema
	}

	onRequestObjectList(cb: (objList: IMOSRequestObjectList) => Promise<IMOSObjectList>): void {
		this.checkProfile('onRequestObjectList', 'profile3')
		this._callbackOnRequestObjectList = cb
	}

	async sendRequestObjectList(reqObjList: IMOSRequestObjectList): Promise<IMOSObjectList> {
		const message = new MosModel.MosReqObjList(reqObjList)
		const response = await this.executeCommand(message)
		const objList = response.mos.mosObjList
		if (objList.list) objList.list = MosModel.XMLMosObjects.fromXML(objList.list.mosObj)
		return objList
	}

	onRequestObjectActionNew(cb: (obj: IMOSObject) => Promise<IMOSAck>): void {
		this.checkProfile('onRequestObjectActionNew', 'profile3')
		this._callbackOnRequestObjectActionNew = cb
	}
	async sendRequestObjectActionNew(obj: IMOSObject): Promise<IMOSAck> {
		const message = new MosModel.MosReqObjActionNew({ object: obj })
		const response = await this.executeCommand(message)
		return MosModel.XMLMosAck.fromXML(response.mos.mosAck)
	}

	onRequestObjectActionUpdate(cb: (objId: IMOSString128, obj: IMOSObject) => Promise<IMOSAck>): void {
		this.checkProfile('onRequestObjectActionUpdate', 'profile3')
		this._callbackOnRequestObjectActionUpdate = cb
	}
	async sendRequestObjectActionUpdate(objId: IMOSString128, obj: IMOSObject): Promise<IMOSAck> {
		const message = new MosModel.MosReqObjActionUpdate({ object: obj, objectId: objId })
		const response = await this.executeCommand(message)
		return MosModel.XMLMosAck.fromXML(response.mos.mosAck)
	}
	onRequestObjectActionDelete(cb: (objId: IMOSString128) => Promise<IMOSAck>): void {
		this.checkProfile('onRequestObjectActionDelete', 'profile3')
		this._callbackOnRequestObjectActionDelete = cb
	}
	async sendRequestObjectActionDelete(objId: IMOSString128): Promise<IMOSAck> {
		const message = new MosModel.MosReqObjActionDelete({ objectId: objId })
		const response = await this.executeCommand(message)
		return MosModel.XMLMosAck.fromXML(response.mos.mosAck)
	}

	// Deprecated methods:
	/** @deprecated onMosObjCreate is deprecated, use onObjectCreate instead */
	onMosObjCreate(cb: (object: IMOSObject) => Promise<IMOSAck>): void {
		return this.onObjectCreate(cb)
	}
	/** @deprecated mosObjCreate is deprecated, use sendObjectCreate instead */
	async mosObjCreate(object: IMOSObject): Promise<IMOSAck> {
		return this.sendObjectCreate(object)
	}
	/** @deprecated onMosItemReplace is deprecated, use onItemReplace instead */
	onMosItemReplace(cb: (roID: IMOSString128, storyID: IMOSString128, item: IMOSItem) => Promise<IMOSROAck>): void {
		return this.onItemReplace(cb)
	}
	/** @deprecated mosItemReplace is deprecated, use sendItemReplace instead */
	async mosItemReplace(options: MosItemReplaceOptions): Promise<IMOSROAck> {
		return this.sendItemReplace(options)
	}
	/** @deprecated onMosReqSearchableSchema is deprecated, use onRequestSearchableSchema instead */
	onMosReqSearchableSchema(cb: (username: string) => Promise<IMOSListSearchableSchema>): void {
		return this.onRequestSearchableSchema(cb)
	}
	/** @deprecated mosRequestSearchableSchema is deprecated, use sendRequestSearchableSchema instead */
	async mosRequestSearchableSchema(username: string): Promise<IMOSListSearchableSchema> {
		return this.sendRequestSearchableSchema(username)
	}
	/** @deprecated onMosReqObjectList is deprecated, use onRequestObjectList instead */
	onMosReqObjectList(cb: (objList: IMOSRequestObjectList) => Promise<IMOSObjectList>): void {
		return this.onRequestObjectList(cb)
	}
	/** @deprecated mosRequestObjectList is deprecated, use sendRequestObjectList instead */
	async mosRequestObjectList(reqObjList: IMOSRequestObjectList): Promise<IMOSObjectList> {
		return this.sendRequestObjectList(reqObjList)
	}
	/** @deprecated onMosReqObjectAction is deprecated, use onRequestObjectAction*** instead */
	onMosReqObjectAction(_cb: (action: string, obj: IMOSObject) => Promise<IMOSAck>): void {
		throw new Error('onMosReqObjectAction is deprecated, use onRequestObjectAction*** instead')
	}

	// ============================================================================================================
	// ==========================   Profile 4   ===================================================================
	// ============================================================================================================
	onRequestAllRunningOrders(cb: () => Promise<IMOSRunningOrder[]>): void {
		this.checkProfile('onRequestAllRunningOrders', 'profile4')
		this._callbackOnRequestAllRunningOrders = cb
	}
	async sendRequestAllRunningOrders(): Promise<Array<IMOSRunningOrderBase>> {
		const message = new MosModel.ROReqAll()

		if (this._currentConnection) {
			const reply = await this.executeCommand(message)

			if (has(reply.mos, 'roListAll')) {
				let xmlRos: Array<any> = (reply.mos.roListAll || {}).ro
				if (!Array.isArray(xmlRos)) xmlRos = [xmlRos]
				const ros: Array<IMOSRunningOrderBase> = []
				xmlRos.forEach((xmlRo) => {
					if (xmlRo) {
						ros.push(MosModel.XMLRunningOrderBase.fromXML(xmlRo))
					}
				})
				return ros
			} else throw new Error(`Unknown response: ${safeStringify(reply).slice(0, 200)}`)
		} else throw new Error(`Unable to send message due to no current connection`)
	}
	onRunningOrderStory(cb: (story: IMOSROFullStory) => Promise<IMOSROAck>): void {
		this.checkProfile('onRunningOrderStory', 'profile4')
		this._callbackOnRunningOrderStory = cb
	}
	async sendRunningOrderStory(story: IMOSROFullStory): Promise<IMOSROAck> {
		// async sendROSwapItems (Action: IMOSStoryAction, ItemID0: IMOSString128, ItemID1: IMOSString128): Promise<IMOSROAck> {
		const message = new MosModel.ROStory(story)
		const data = await this.executeCommand(message)
		return MosModel.XMLMosROAck.fromXML(data.mos.roAck)
	}

	// Deprecated methods:
	/** @deprecated onROReqAll is deprecated, use onRequestAllRunningOrders instead */
	onROReqAll(cb: () => Promise<IMOSRunningOrder[]>): void {
		return this.onRequestAllRunningOrders(cb)
	}
	/** @deprecated getAllRunningOrders is deprecated, use sendRequestAllRunningOrders instead */
	async getAllRunningOrders(): Promise<Array<IMOSRunningOrderBase>> {
		return this.sendRequestAllRunningOrders()
	}
	/** @deprecated onROStory is deprecated, use onRunningOrderStory instead */
	onROStory(cb: (story: IMOSROFullStory) => Promise<IMOSROAck>): void {
		return this.onRunningOrderStory(cb)
	}
	/** @deprecated sendROStory is deprecated, use sendRunningOrderStory instead */
	async sendROStory(story: IMOSROFullStory): Promise<IMOSROAck> {
		return this.sendRunningOrderStory(story)
	}

	// =============================================================================================================
	// ///////////////////////////////////// End of Profile methods \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	setDebug(debug: boolean): void {
		this._debug = debug
	}
	checkProfileValidness(): void {
		this._checkProfileValidness()
	}

	/** Does a check if the specified profile is set, and throws otherwise */
	private checkProfile(methodName: string, profile: keyof IProfiles) {
		if (this._strict && !this.supportedProfiles[profile])
			throw new Error(`"${methodName}" cannot be set while "Profile 2" is not enabled.`)
	}

	private async executeCommand(message: MosModel.MosMessage, resend?: boolean): Promise<MosReply> {
		if (this._currentConnection) {
			this.debugTrace('exec command', message)
			if (!this._currentConnection.connected) {
				return this.switchConnectionsAndExecuteCommand(message)
			}

			try {
				const reply = await this._currentConnection.executeCommand(message)
				return this._ensureReply(reply)
			} catch (e) {
				this.debugTrace('errored', e)
				if (this._primaryConnection && this._secondaryConnection && !resend) {
					return this.switchConnectionsAndExecuteCommand(message)
				} else {
					throw e
				}
			}
		} else {
			throw new Error(`Unable to send message due to no current connection`)
		}
	}
	private switchConnections(): void {
		if (!this._currentConnection) throw new Error('Unable to failover connection: No current connection')
		if (!this._primaryConnection) throw new Error('Unable to failover connection: No primary connection')
		if (!this._secondaryConnection) throw new Error('Unable to failover connection: No secondary connection')

		this.debugTrace('switching connection')

		let otherConnection =
			this._currentConnection === this._primaryConnection ? this._secondaryConnection : this._primaryConnection
		const currentConnection = this._currentConnection

		if (!otherConnection.connected)
			throw new Error(
				`Unable to failover connection: Other connection is not connected (${otherConnection.host})`
			)

		// Switch:
		this._currentConnection = otherConnection
		otherConnection = currentConnection // former current connection

		otherConnection.handOverQueue(this._currentConnection)
	}
	private async switchConnectionsAndExecuteCommand(message: MosModel.MosMessage): Promise<MosReply> {
		this.switchConnections()

		this.debugTrace('resending msg')

		try {
			return await this.executeCommand(message, true)
		} catch (e) {
			if (`${e}` === 'Main server available') {
				// @todo: we may deadlock if primary is down for us, but up for buddy
				return this.switchConnectionsAndExecuteCommand(message)
			}
			this.switchConnections()

			throw e
		}
	}
	private _emitConnectionChange(): void {
		if (this._callbackOnConnectionChange) this._callbackOnConnectionChange(this.getConnectionStatus())
	}
	/** throws if there is an error */
	private _ensureReply(reply: any): MosReply {
		if (!reply.mos) throw new Error(`Unknown data: <mos> missing from message`)

		if (
			reply.mos.roAck &&
			reply.mos.roAck.roStatus === 'Buddy server cannot respond because main server is available'
		) {
			throw new Error('Buddy server cannot respond because main server is available')
		}

		if (reply.mos.mosAck && reply.mos.mosAck.status === 'NACK') {
			throw new Error(`Error in response: ${reply.mos.mosAck.statusDescription || 'No statusDescription given'}`)
		}

		return reply
	}
	/** throws if something's wrong
	 */
	private _checkProfileValidness(): void {
		if (!this._strict) return
		/** For MOS-devices: Require a callback to have been set */
		const requireCallback = (profile: string, callbackName: string, method: (...args: any[]) => any) => {
			// @ts-expect-error no index signature
			if (!this[callbackName]) {
				throw new Error(
					`Error: This MOS-device is configured to support Profile ${profile}, but callback ${method.name} has not been set!`
				)
			}
		}
		/** Check: Requires that a callback has been set */
		const requireMOSCallback = (profile: string, callbackName: string, method: (...args: any[]) => any) => {
			if (this.supportedProfiles.deviceType !== 'MOS') return
			requireCallback(profile, callbackName, method)
		}
		// const requireNCSCallback = (profile: string, callbackName: string, method: Function) => {
		// 	if (this.supportedProfiles.deviceType !== 'NCS') return
		// 	requireCallback(profile, callbackName, method)
		// }
		/** Require another profile to have been set  */
		const requireProfile = (profile: number, requiredProfile: number) => {
			// @ts-expect-error no index signature
			if (!this.supportedProfiles['profile' + requiredProfile]) {
				throw new Error(
					`Error: This MOS-device is configured to support Profile ${profile}, therefore it must also support Profile ${requiredProfile}!`
				)
			}
		}
		/* eslint-disable @typescript-eslint/unbound-method */
		if (this.supportedProfiles.profile0) {
			requireCallback('0', '_callbackOnRequestMachineInfo', this.onRequestMachineInfo)
			// _callbackOnConnectionChange not required
		}
		if (this.supportedProfiles.profile1) {
			requireProfile(1, 0)
			requireMOSCallback('1', '_callbackOnRequestMOSOBject', this.onRequestMOSObject)
			requireMOSCallback('1', '_callbackOnRequestAllMOSObjects', this.onRequestAllMOSObjects)
		}
		if (this.supportedProfiles.profile2) {
			requireProfile(2, 0)
			requireProfile(2, 1)
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
			requireProfile(3, 0)
			requireProfile(3, 1)
			requireProfile(3, 2)
			requireMOSCallback('3', '_callbackOnItemReplace', this.onItemReplace)
			requireMOSCallback('3', '_callbackOnObjectCreate', this.onObjectCreate)
			requireMOSCallback('3', '_callbackOnRequestObjectActionNew', this.onRequestObjectActionNew)
			requireMOSCallback('3', '_callbackOnRequestObjectActionUpdate', this.onRequestObjectActionUpdate)
			requireMOSCallback('3', '_callbackOnRequestObjectActionDelete', this.onRequestObjectActionDelete)
			requireMOSCallback('3', '_callbackOnRequestObjectList', this.onRequestObjectList)
			requireMOSCallback('3', '_callbackOnRequestSearchableSchema', this.onRequestSearchableSchema)
		}
		if (this.supportedProfiles.profile4) {
			requireProfile(4, 0)
			requireProfile(4, 1)
			requireProfile(4, 2)
			requireMOSCallback('4', '_callbackOnRequestAllRunningOrders', this.onRequestAllRunningOrders)
			requireMOSCallback('4', '_callbackOnRunningOrderStory', this.onRunningOrderStory)
		}
		if (this.supportedProfiles.profile5) {
			requireProfile(5, 0)
			requireProfile(5, 1)
			requireProfile(5, 2)
			throw new Error('Erorr: Profile 5 is not currently implemented!')
		}
		if (this.supportedProfiles.profile6) {
			requireProfile(6, 0)
			requireProfile(6, 1)
			requireProfile(6, 2)
			throw new Error('Erorr: Profile 6 is not currently implemented!')
		}
		if (this.supportedProfiles.profile7) {
			requireProfile(7, 0)
			requireProfile(7, 1)
			requireProfile(7, 2)
			throw new Error('Erorr: Profile 7 is not currently implemented!')
		}
	}
	private debugTrace(...strs: any[]) {
		// eslint-disable-next-line no-console
		if (this._debug) console.log(...strs)
	}
}

export interface IProfiles {
	profile0: boolean
	profile1: boolean
	profile2: boolean
	profile3: boolean
	profile4: boolean
	profile5: boolean
	profile6: boolean
	profile7: boolean
}

interface MosReply {
	mos: any
}
