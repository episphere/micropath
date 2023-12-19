import { io as tfJsIO, loadGraphModel as tfJsLoadGraphModel } from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/+esm"
import { ImageClassificationModel } from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-automl/+esm"

const modelLoaders = {}

modelLoaders.loadLocalModel = async () => {
  const modelDirectoryHandle = await window.showDirectoryPicker()
  const handler = new IOHandler(modelDirectoryHandle)
  const graphModel = await tfJsLoadGraphModel(handler)
  const dictionaryFile = await modelDirectoryHandle.getFileHandle("dict.txt")
  const readDict = (dictionaryFile) => new Promise(async res => {
    const reader = new FileReader()
    reader.onload = (e) => {
      res(e.target.result)
    }
    reader.readAsText(await dictionaryFile.getFile())
  })
  const dictionary = await readDict(dictionaryFile)
  const model = new ImageClassificationModel(graphModel, dictionary.trim().split('\n'))
  console.log(await model.graphModel)
  return model
}

modelLoaders.loadRemoteModel = async () => {

}

modelLoaders.loadModelFromBox = async () => {

}

modelLoaders.supportedDataSources = {
  "local": {
    "id": 1,
    "displayName": "Local Device",
    "loader": modelLoaders.loadLocalModel,
    "disabled": false
  },
  "remote": {
    "id": 2,
    "displayName": "Remote URL",
    "loader": modelLoaders.loadRemoteModel,
    "disabled": true
  },
  "box": {
    "id": 3,
    "displayName": "Box",
    "loader": modelLoaders.loadModelFromBox,
    "disabled": true
  }
}

class IOHandler {
  constructor (directoryHandle) {
    this.directoryHandle = directoryHandle
    
  }
  
  async load() {
    // Returns a ModelArtifacts Object. https://github.com/tensorflow/tfjs/blob/81225adc2fcf6fcf633b4119e4b89a3bf55be824/tfjs-core/src/io/types.ts#L226
    const configFile = await this.directoryHandle.getFileHandle("model.json")
    const readConfig = () => new Promise(async (res) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        res(e.target.result)
      }
      reader.readAsText(await configFile.getFile())
    })
    const configJSON = JSON.parse(await readConfig())
    
    const totalWeightFiles = 6
    let weightData = new ArrayBuffer()
    const readBinary = (weightsFile) => new Promise(async (res) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        res(e.target.result)
      }
      reader.readAsArrayBuffer(await weightsFile.getFile())
    })

    for (let weightsFileIndex = 1; weightsFileIndex < totalWeightFiles+1; weightsFileIndex+=1) {

      const weightsFile = await this.directoryHandle.getFileHandle(`group1-shard${weightsFileIndex}of${totalWeightFiles}.bin`)
      const weightsBinary = await readBinary(weightsFile)

      const tempWeightData = new Uint8Array(weightData.byteLength + weightsBinary.byteLength)
      tempWeightData.set(new Uint8Array(weightData), 0)
      tempWeightData.set(new Uint8Array(weightsBinary), weightData.byteLength)
      weightData = tempWeightData.buffer
    }
    
    const modelArtifacts = {
      modelTopology: configJSON.modelTopology,
      format: configJSON.format,
      generatedBy: configJSON.generatedBy,
      convertedBy: configJSON.convertedBy,
      userDefinedMetadata: configJSON.userDefinedMetadata,
      weightSpecs: configJSON.weightsManifest[0].weights,
      weightData
    }
    
    return modelArtifacts
  }
  
  async save() {
    // Returns a ModelArtifactsInfo Object. https://github.com/tensorflow/tfjs/blob/81225adc2fcf6fcf633b4119e4b89a3bf55be824/tfjs-core/src/io/types.ts#L150
    return {
      dateSaved: new Date(),
      modelTopologyType: 'JSON'
    }
  }
}

export default modelLoaders