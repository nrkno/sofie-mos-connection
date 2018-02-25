import {Socket} from 'net'

export class ConnectionManager {

	/** */
	register (id: number, socket: Socket, direction: 'incoming' | 'outgoing') {
		console.log ( 'register connection', id, socket, direction)
	}

	/** */
	unregister (id: number, direction: 'incoming' | 'outgoing') {
		console.log ( 'unregister connection', id, direction)

	}
}
