VIRTUAL_MACHINE = 1

const commands = {
  version: 1,
  allClasses: 3,
  idSizes: 7
}

class VirtualMachine {

  constructor(parent) {
    this.parent = parent
  }

  // refer to https://docs.oracle.com/javase/jp/8/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_VirtualMachine_Version
  getVersion(callback) {
    this.parent.sendCommand(VIRTUAL_MACHINE, commands.version, null, data => {
      const content = this.parent.readString(data)
      callback(content)
    })
  }

  // refer to https://docs.oracle.com/javase/jp/8/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_VirtualMachine_AllClasses
  getAllClasses(callback) {
    this.parent.sendCommand(VIRTUAL_MACHINE, commands.allClasses, null, data => {
      const classCount = data.readInt32BE(0)
      const currentPosition = 4

      const refType = data.readInt8(4)
      const typeID1 = data.readInt32BE(5)
      const typeID2 = data.readInt32BE(9)
      const typeID = (typeID1 << 4) + typeID2
      const signature = this.parent.readString(data.slice(13))
      const status = data.readInt32BE(13 + 4 + data.readInt32BE(13))
      console.log(`refType = ${refType}`)
      console.log(`typeID = ${typeID}`)
      console.log(`signature = ${signature}`)
      console.log(`status = ${status}`)

      // TODO use for
    })
  }

  // refer to https://docs.oracle.com/javase/jp/8/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_VirtualMachine_IDSizes
  getIDSizes(callback) {
    this.parent.sendCommand(VIRTUAL_MACHINE, commands.idSizes, null, data => {
      callback({
        fieldIDSize: data.readInt32BE(0),
        methodIDSize: data.readInt32BE(4),
        objectIDSize: data.readInt32BE(8),
        referenceTypeIDSize: data.readInt32BE(12),
        frameIDSize: data.readInt32BE(16)
      })
    })
  }
}

module.exports = VirtualMachine
