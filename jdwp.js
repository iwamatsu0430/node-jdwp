const net = require('net')
const virtualMachine = require('./lib/virtual-machine')

const HEX = 16
const HAND_SHAKE = 'JDWP-Handshake'

class JDWP {

  constructor() {
    this.eventStore = {}
    this.callbackStore = {}
    this.events = {
      CONNECT: Symbol(),
      CLOSE: Symbol()
    }
    this.serialIdClosure = (() => {
      let id = 0
      return () => id++
    })()
  }

  getSerialId() {
    return this.serialIdClosure()
  }

  on(event, callback) {
    this.eventStore[event] = callback
  }

  off(event) {
    delete this.eventStore[event]
  }

  dispatch(event, option) {
    const callback = this.eventStore[event]
    if (callback) {
      callback.apply(option)
    }
  }

  connect(host, port) {
    if (typeof host !== 'string') {
      throw new Error(`${host} is ${typeof host}. please set string.`)
    }
    if (typeof port !== 'number') {
      throw new Error(`${port} is ${typeof port}. please set number.`)
    }
    this.client = net.connect({host: host, port: port}, () => {
      this.client.on('data', this.listen.bind(this))
      this.client.write(HAND_SHAKE)
    })
  }

  listen(data) {
    if (data.toString('ascii') === HAND_SHAKE) {
      this.dispatch(this.events.CONNECT)
    } else {
      // header
      const length = data.readUInt32BE(0)
      const id = data.readUInt32BE(4)
      const flags = data.readUInt8(8)
      const errorCode = data.readUInt16BE(9)

      if (errorCode === 0) {
        this.callbackStore[id](data.slice(11))
      }
    }
  }

  readString(data) {
    const contentLength = data.readUInt32BE(0)
    return data.toString('utf-8', 4, contentLength - 4)
  }

  getVersion(callback) {
    this.sendCommand(1, 1, null, data => {
      const content = this.readString(data)
      callback(content)
    })
  }

  sendCommand(commandSet, command, body, callback) {
    const id = this.getSerialId()

    const length = 11
    const flags = 1
    const header = new Buffer(length)
    header.writeUInt32BE(length.toString(HEX), 0)
    header.writeUInt32BE(id.toString(HEX), 4)
    header.writeUInt8(flags.toString(HEX), 8)
    header.writeUInt8(commandSet.toString(HEX), 9)
    header.writeUInt8(command.toString(HEX), 10)

    this.callbackStore[id] = data => {
      delete this.callbackStore[id]
      callback(data)
    }

    const a = Buffer.concat([header, body ? body : new Buffer(0)])
    console.log(header)
    console.log(a)
    this.client.write(a)
  }

  close() {
    this.client.on('close', () => {
      this.dispatch(this.events.CLOSE)
    })
    this.client.destroy()
  }
}

module.exports = new JDWP()
