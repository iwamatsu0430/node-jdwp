VIRTUAL_MACHINE = 1

const commands = {
  version: 1,
  allClasses: 3,
  idSizes: 7
}

const typeTag = {
  CLASS: 1,
  INTERFACE: 2,
  ARRAY: 3
}

const classStatus = {
  VERIFIED: 1,
  PREPARED: 2,
  INITIALIZED: 4,
  ERROR: 8
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
      let currentPosition = 4
      let allClasses = []
      for (let i = 0; i < classCount; i++) {
        const refType = data.readInt8(currentPosition)
        currentPosition += 1
        const typeID1 = data.readInt8(currentPosition)
        currentPosition += 4
        const typeID2 = data.readInt32BE(currentPosition)
        const typeID = (typeID1 << 4) + typeID2
        currentPosition += 4
        const signature = this.parent.readString(data.slice(currentPosition))
        const signatureLength = data.readInt32BE(currentPosition)
        currentPosition += 4 + signatureLength
        const status = data.readInt32BE(currentPosition)
        currentPosition += 4
        allClasses.push({
          refType: refType,
          typeID: typeID,
          signature: signature,
          status: status
        })
      }
      callback(allClasses)
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
