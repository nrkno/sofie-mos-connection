import { EventEmitter } from 'events'
import { xml2js } from '@mos-connection/helper'

export class MosMessageParser extends EventEmitter {
	private dataChunks = ''

	public debug = false

	constructor(private description: string) {
		super()
	}

	public parseMessage(messageString: string): void {
		this.debugTrace(`Socket got data (${this.description}): "${messageString}"`)

		this.dataChunks += messageString

		// parse as many messages as possible from the data
		while (this.dataChunks.length > 0) {
			// whitespace before a mos message is junk
			this.dataChunks = this.dataChunks.trimStart()

			const lengthBefore = this.dataChunks.length
			this._tryParseData()
			const lengthAfter = this.dataChunks.length

			if (lengthAfter === lengthBefore) {
				// Nothing was plucked, so abort
				break
			}
		}
	}
	private _tryParseData() {
		const startMatch = '<mos>' // <mos>
		const endMatch = '</mos>' // </mos>

		let messageString: string | undefined

		const startIndex = this.dataChunks.indexOf(startMatch)
		if (startIndex === -1) {
			// No start tag, so looks like we have jibberish
			this.dataChunks = ''
		} else {
			if (startIndex > 0) {
				const junkStr = this.dataChunks.slice(0, startIndex)
				this.debugTrace(`${this.description} Discarding message fragment: "${junkStr}"`)

				// trim off anything before <mos>, as we'll never be able to parse that anyway.
				this.dataChunks = this.dataChunks.slice(startIndex)
			}

			const endIndex = this.dataChunks.indexOf(endMatch)
			if (endIndex >= 0) {
				// We have an end too, so pull out the message
				const endIndex2 = endIndex + endMatch.length
				messageString = this.dataChunks.slice(0, endIndex2)
				this.dataChunks = this.dataChunks.slice(endIndex2)

				// parse our xml
			}
		}

		let parsedData: any | null = null
		try {
			if (messageString) {
				parsedData = xml2js(messageString) // , { compact: true, trim: true, nativeType: true })
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.log('dataChunks-------------\n', this.dataChunks)
			// eslint-disable-next-line no-console
			console.log('messageString---------\n', messageString)
			// this.emit('error', e)

			throw err
		}
		if (parsedData) {
			this.emit('message', parsedData, messageString)
		}
	}
	private debugTrace(str: string) {
		if (this.debug) {
			// Supress console spam:
			if (!`${str}`.match(/<heartbeat>/)) {
				// eslint-disable-next-line no-console
				console.log(str)
			}
		}
	}
}
