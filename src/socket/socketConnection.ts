import {Socket} from 'net'

export default class SocketConnection {

  id: number
  socket: Socket

  /**  */
  constructor (id: number, socket: Socket) {
    this.id = id
    this.socket = socket
  }
}
