const net = require('net')

class JDWP {

  constructor() {
    this.eventHandler = {}
  }

  on(event, callback) {
    this.eventHandler[event] = callback
  }

  dispatch(event, option) {
    const callback = this.eventHandler[event]
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
      // TODO use enum
      this.dispatch('connect')
    })
  }

  close() {
    this.client.on('close', () => {
      // TODO use enum
      this.dispatch('close')
    })
    this.client.destroy()
  }
}

module.exports = new JDWP()
