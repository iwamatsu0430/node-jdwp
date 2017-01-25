const net = require('net')

const HAND_SHAKE = 'JDWP-Handshake'

class JDWP {

  constructor() {
    this.eventStore = {}
    this.events = {
      CONNECT: Symbol(),
      CLOSE: Symbol()
    }
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
    const dataString = data.toString()
    if (dataString === HAND_SHAKE) {
      this.dispatch(this.events.CONNECT)
    } else {
      // TODO
    }
  }

  close() {
    this.client.on('close', () => {
      this.dispatch(this.events.CLOSE)
    })
    this.client.destroy()
  }
}

module.exports = new JDWP()
