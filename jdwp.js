'use strict'

const net = require('net')
const VirtualMachine = require('./lib/virtual-machine')

const HAND_SHAKE = 'JDWP-Handshake'

class JDWP {

  constructor() {
    this.virtualMachine = new VirtualMachine(this)
    this.callbackStore = []
    this.idSizes = null
    this.receiving = {
      length: 0,
      id: null,
      data: [],
      currentLength: 0
    }
    this.serialIdClosure = (() => {
      let id = 0
      return () => id++
    })()
  }

  getSerialId() {
    return this.serialIdClosure()
  }

  connect(host, port, callback) {
    if (typeof host !== 'string') {
      throw new Error(`${host} is ${typeof host}. please set string.`)
    }
    if (typeof port !== 'number') {
      throw new Error(`${port} is ${typeof port}. please set number.`)
    }
    this.callbackStore[HAND_SHAKE] = callback
    this.client = net.connect({host: host, port: port}, () => {
      this.client.on('data', this.listen.bind(this))
      this.client.write(HAND_SHAKE)
    })
  }

  listen(data) {
    if (data.toString('ascii') === HAND_SHAKE) {
      this.virtualMachine.getIDSizes(idSizes => this.idSizes = idSizes)
      return
    }

    if (this.receiving.currentLength > 0) {
      this.receiving.data.push(data.slice(0))
      this.receiving.currentLength += data.length
      if (this.receiving.length <= this.receiving.currentLength) {
        const callback = this.callbackStore[this.receiving.id]
        if (callback) {
          callback(Buffer.concat(this.receiving.data))
          this.receiving.currentLength = 0
          this.receiving.id = null
          this.receiving.data = []
        }
      }
    } else {
      const length = data.readUInt32BE(0)
      const id = data.readUInt32BE(4)
      const flags = data.readUInt8(8)
      const errorCode = data.readUInt16BE(9)

      if (errorCode !== 0) {
        // TODO error handling
      }

      if (length <= data.length) {
        const callback = this.callbackStore[id]
        if (callback) {
          callback(data.slice(11))
          if (id === 0) {
            const initialCallback = this.callbackStore[HAND_SHAKE]
            if (callback) {
              initialCallback()
            }
          }
        }
      } else {
        this.receiving.length = length
        this.receiving.id = id
        this.receiving.data.push(data.slice(11))
        this.receiving.currentLength += data.length
      }
    }
  }

  readString(data) {
    const contentLength = data.readUInt32BE(0)
    return data.toString('utf-8', 4, 4 + contentLength)
  }

  sendCommand(commandSet, command, body, callback) {
    const id = this.getSerialId()
    body = body ? body : new Buffer(0)
    const headerLength = 11
    const flags = 1
    const header = new Buffer(headerLength)
    header.writeUInt32BE(headerLength + body.length, 0)
    header.writeUInt32BE(id, 4)
    header.writeUInt8(flags, 8)
    header.writeUInt8(commandSet, 9)
    header.writeUInt8(command, 10)

    this.callbackStore[id] = data => {
      delete this.callbackStore[id]
      callback(data)
    }

    this.client.write(Buffer.concat([header, body]))
  }

  close() {
    this.client.destroy()
  }
}

module.exports = new JDWP()
