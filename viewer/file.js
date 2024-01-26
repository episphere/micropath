import viewerObj from "./viewer.js"
import modelLoaders from "../modelLoaders.js"

let model = {}
let isImageLoaded = false

const checkImageLoaded = () => {
  document.body.addEventListener("viewerFullyLoadedChange", (e) => {
    isImageLoaded = true
    document.getElementById("runModelBtn")?.removeAttribute("disabled")
    checkImageLoaded()
  }, {once: true})
}
checkImageLoaded()

const utils = {
  roundToPrecision: (value, precision) => Math.round((parseFloat(value) + Number.EPSILON) * 10 ** precision) / 10 ** precision
}

const getHashParam = (param) => {
  const hashParams = JSON.parse(localStorage.hashParams)
  return hashParams[param]
}

const loadHashParams = () => {
  // Load hash parameters from the URL.
  const previousHashParams = window.localStorage.hashParams ? JSON.parse(window.localStorage.hashParams) : {}
  const hashParams = {}

  if (window.location.hash.includes("=")) {

    window.location.hash.slice(1).split('&').forEach((param) => {
      let [key, value] = param.split('=')
      value = value.replace(/['"]+/g, "") // for when the hash parameter contains quotes.
      value = decodeURIComponent(value)
      hashParams[key] = value
    })

  }

  if (hashParams["fileURL"] && previousHashParams?.fileURL !== hashParams["fileURL"]) {
    // progressBar(false)
    document.getElementById("remoteURLTextbox").value = hashParams["fileURL"]
    viewerObj.loadImage(hashParams["fileURL"])
  }

  if (hashParams.wsiCenterX && hashParams.wsiCenterY && hashParams.wsiZoom) {
    viewerObj.handlePanAndZoom(hashParams.wsiCenterX, hashParams.wsiCenterY, hashParams.wsiZoom)
  }

  if (hashParams["dataSource"]) {
    setDataSource(hashParams["dataSource"])
  }

  window.localStorage.hashParams = JSON.stringify(hashParams)
}

const modifyHashString = (hashObj, removeFromHistory = true) => {
  // hashObj contains hash keys with corresponding values to update..
  const hashParams = JSON.parse(localStorage.hashParams)
  let hash = window.location.hash + ""

  Object.entries(hashObj).forEach(([key, val]) => {
    if (val && val !== hashParams[key]) {

      if (hashParams[key]) {
        hash = hash.replace(`${key}=${encodeURIComponent(hashParams[key])}`, `${key}=${encodeURIComponent(val)}`)
      }
      else {
        hash += hash.length > 0 ? "&" : ""
        hash += `${key}=${encodeURIComponent(val)}`
      }

    }

    else if (!val) {
      const param = `${key}=${encodeURIComponent(hashParams[key])}`
      const paramIndex = hash.indexOf(param)

      if (hash[paramIndex - 1] === "&") {  // if hash is of the form "...&q=123...", remove preceding & as well.
        hash = hash.replace(`&${param}`, "")
      }

      else if (hash[paramIndex + param.length] === "&") { // if hash is of the form "#q=123&...", remove following & as well.
        hash = hash.replace(`${param}&`, "")
      }

      else { // if hash is just #q=123, remove just the param.
        hash = hash.replace(param, "")
      }
    }
  })

  window.location.hash = hash

  if (removeFromHistory) {
    history.replaceState({}, '', window.location.pathname + window.location.hash)
  }
}

const removePanAndZoomFromHash = () => {
  modifyHashString({
    'wsiCenterX': undefined,
    'wsiCenterY': undefined,
    'wsiZoom': undefined
  }, true)
}

// const loadDefaultImage = () => {
//   const defaultWSIURL = "https://storage.googleapis.com/imagebox_test/openslide-testdata/Aperio/CMU-1.svs"
//   document.getElementById("imageURLInput").value = defaultWSIURL
// }

const setDataSource = (dataSource) => {
  const workingWithLocalData = dataSourceConfigs[dataSource]?.local
  if (workingWithLocalData) {
    document.getElementById("remoteURL").classList.add("hidden")
    document.getElementById("localFilePicker").classList.remove("hidden")
    document.getElementById("localFilePicker").querySelector("input").onchange = (e) => {
      viewerObj.loadImage(e.target.files[0])
    }
  } else {
    document.getElementById("localFilePicker").classList.add("hidden")
    document.getElementById("remoteURL").classList.remove("hidden")
    document.getElementById("remoteURL").querySelector("input").onkeyup = (e) => {
      if (e.key === 'Enter') {
        viewerObj.loadImage(e.target.value)
      }
    }
    document.getElementById("remoteURL").querySelector("button").onclick = (e) => {
      viewerObj.loadImage(e.target.value)
    }
  }
}

const loadModelOptions = () => {
  const modelOptionsTab = document.getElementById("modelOptionsTab")
  const annotationOptionsTab = document.getElementById("annotationOptionsTab")
  const optionsTabContent = document.getElementById("optionsTabContent")
  if (modelOptionsTab.getAttribute("active") !== "true") {
    annotationOptionsTab.removeAttribute("active")
    annotationOptionsTab.classList.remove("bg-blue-200")
    optionsTabContent.innerHTML = `
      <div id="loadModelPrompt" class="w-4/6 h-fit m-auto align-middle">
        <label class="block pt-3 pb-3 ml-2 mt-5 text-lg font-medium leading-6 text-gray-900">Load Model from</label>
      </div>
    `
    const modelOptionsSelector = document.createElement("select")
    modelOptionsSelector.id = "modelSourceSelector" 
    modelOptionsSelector.className ="block w-full h-full border rounded-md border-gray-400 bg-transparent py-3 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
    modelOptionsSelector.innerHTML = `<option>Select source...</option>`
    optionsTabContent.firstElementChild.appendChild(modelOptionsSelector)
    
    Object.values(modelLoaders.supportedDataSources).forEach(dataSource => {
      const optionElement = document.createElement('option')
      optionElement.innerText = dataSource.displayName
      if (dataSource.disabled) {
        optionElement.setAttribute("disabled", "true")
      } else {
        optionElement.value = dataSource.id
      }
      modelOptionsSelector.appendChild(optionElement)
    })
    
    modelOptionsSelector.onchange = async (e) => {
      const selectedModelSource = Object.values(modelLoaders.supportedDataSources).find(dataSource => dataSource.id == modelOptionsSelector.value)
      console.log(selectedModelSource)
      model = await selectedModelSource["loader"]()
      optionsTabContent.firstElementChild.removeChild(optionsTabContent.firstElementChild.lastElementChild)
      optionsTabContent.firstElementChild.firstElementChild.innerText = "Model successfully Loaded!"
      const runModelButton = document.createElement("button")
      runModelButton.id = "runModelBtn"
      runModelButton.classList = "m-1 pt-2 pb-2 pl-4 pr-4 text-gray-900 border rounded-md border-gray-400 hover:bg-green-200"
      runModelButton.innerText = "Run Model"
      if (!isImageLoaded) {
        runModelButton.setAttribute("disabled", true)
      }
      runModelButton.onclick = () => {
        runModel()
      }
      optionsTabContent.firstElementChild.appendChild(runModelButton)
    }
    modelOptionsTab.setAttribute("active", "true")
    modelOptionsTab.classList.add("bg-blue-100")
  }
}

const loadAnnotationOptions = () => {

}

const loadModelAndAnnotationOptions = () => {
  document.getElementById("modelOptionsTab").onclick = loadModelOptions
  document.getElementById("annotationOptionsTab").onclick = loadAnnotationOptions
  loadModelOptions()
}

const runModel = async () => {
  const { default: imagebox3 } = await import("https://episphere.github.io/imagebox3/imagebox3.mjs")
  const {width, height} = await (await imagebox3.getImageInfo(document.getElementById("remoteURLTextbox").value)).json()
  console.log(width, height)
  for (let i = 0; i < width-512; i+=512) {
    for (let j = 0; j < height-512; j+=512) {
      const rectBounds = viewerObj.viewer.world.getItemAt(0).imageToViewportRectangle(i, j, i+512, j+512)
      const rectBoundValues = Object.values(i, j, i+512, j+512)
      const rectBoundsInImageCoordsForId = rectBoundValues.splice(0, rectBoundValues.length - 1).map(v => Math.round(v)).join("_")
      const elementId = `modelPredProcessing_${rectBoundsInImageCoordsForId}`
      const rect = document.createElement("div")
      rect.setAttribute("id", elementId)
      rect.setAttribute("class", "border border-dashed border-cyan-400")
      rect.setAttribute("tabindex", "0")
      rect.tileX = rectBounds.x
      rect.tileY = rectBounds.y
      rect.tileWidth = rectBounds.width
      rect.tileHeight = rectBounds.height
      rect.style.zIndex = Math.max(10**1, Math.floor((1 - (rectBounds.width * rectBounds.height)) * (10**5)))
      viewerObj.viewer.addOverlay({
        element: rect,
        location: rectBounds
      })

      const imageTile = await imagebox3.getImageTile(document.getElementById("remoteURLTextbox").value, {
        tileX: i,
        tileY: j,
        tileWidth: 512,
        tileHeight: 512,
        tileSize: 256
      }, true)
      
      const tileBlob = await imageTile.blob()
      const tileImageBitmap = await createImageBitmap(tileBlob)
      let prediction= {}
      if (tileImageBitmap) {
        const offscreenCV = new OffscreenCanvas(tileImageBitmap.width, tileImageBitmap.height)
        const offscreenCtx = offscreenCV.getContext('2d')
        offscreenCtx.drawImage(tileImageBitmap, 0, 0)
        const imgData = offscreenCtx.getImageData(0, 0, tileImageBitmap.width, tileImageBitmap.height)
        // if (imgData.data.filter(pixelIntensity => pixelIntensity < 220).length > 100) {
          prediction = await model.classify(offscreenCV)
          console.log(prediction, `for coords: (${i}, ${j}),(${i+512}, ${j+512})` )
          rect.classList = `border border-solid ${prediction[0].prob > prediction[1].prob ? "border-red-600": "border-green-600"}`
        // } else {
        //   viewerObj.viewer.removeOverlay(rect)
        // }
      }
    }
  }
  
}

let dataSourceConfigs = {}
window.onload = async () => {
  dataSourceConfigs = await (await fetch("../dataSourceConfigs.json")).json()
  loadHashParams()

  viewerObj.loadViewer(viewerObj.default.osdViewerOptions)
  loadModelAndAnnotationOptions()
  // if (!workingWithLocalData && !getHashParam("fileURL")) {
  //   setTimeout(loadDefaultImage, 1000)
  // }
}

window.onhashchange = loadHashParams
