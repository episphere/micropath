const viewerObj = {}

viewerObj.default = {
  "tileSourceOptions": {
    'profile': [ "http://iiif.io/api/image/2/level2.json" ],
    'protocol': "http://iiif.io/api/image",
    'tiles': [{
      'scaleFactors': [1, 4, 16, 64, 256, 1024],
      'width': 256,
    }]
  },
  "osdViewerOptions": {
    'id': "openseadragon",
    'visibilityRatio': 1,
    'minZoomImageRatio': 1,
    'prefixUrl': "https://episphere.github.io/svs/openseadragon/images/",
    'timeout': 180*1000,
    'crossOriginPolicy': "Anonymous",
    'sequenceMode': false
  }
}

viewerObj.handlers = {
  viewer: {
    animationFinish: (e) => {
      const animationFinishEvent = new CustomEvent("viewerAnimationFinish", e)
      document.body.dispatchEvent(animationFinishEvent)
    },
    
    open: (e) => {
      const viewer = e.eventSource
      viewer.world.getItemAt(0).addOnceHandler('fully-loaded-change', viewerObj.handlers.tiledImage.fullyLoadedChange)
      const openEvent = new CustomEvent("viewerOpen", e)
      document.body.dispatchEvent(openEvent)
    },
  },
  
  tiledImage: {
    fullyLoadedChange: (e) => {
      progressBar(false)
      const fullyLoadedChangeEvent = new CustomEvent("viewerFullyLoadedChange", e)
      document.body.dispatchEvent(fullyLoadedChangeEvent)
    }
  }

}

const progressBar = (show=true) => {

  if (show) {
    document.getElementById("progressBarContainer").style.opacity = 1
    
    let progressBarCurrentWidth = 0
    let moveAheadBy = 2
    
    viewerObj.progressBarMover = setInterval(() => {
      if (progressBarCurrentWidth > 35 && progressBarCurrentWidth < 65) {
        moveAheadBy = 0.75
      } 
      else if (progressBarCurrentWidth >= 65 && progressBarCurrentWidth < 90) {
        moveAheadBy = 0.3
      } 
      else if (progressBarCurrentWidth >= 90 && progressBarCurrentWidth < 95) {
        moveAheadBy = 0.01
      }
      else if (progressBarCurrentWidth >= 95 && progressBarCurrentWidth < 100) {
        moveAheadBy = 0
      }

      progressBarCurrentWidth += moveAheadBy
      progressBarCurrentWidth = progressBarCurrentWidth < 100 ? progressBarCurrentWidth : 100
      
      document.getElementById("progressBar").style.width = `${progressBarCurrentWidth}%`
    }, 200)
  
  } 
  else if (viewerObj.progressBarMover) {
    clearInterval(viewerObj.progressBarMover)
    delete viewerObj.progressBarMover
  
    setTimeout(() => {
      
      setTimeout(() => {
        document.getElementById("progressBar").style.width = "0%"
      }, 700)
      
      document.getElementById("progressBarContainer").style.opacity = "0"
    }, 700)
    
    document.getElementById("progressBar").style.width = "100%"
  }

}

const createTileSource = async (url) => {
  // Create a tile source for the image.
  const tileSources = await OpenSeadragon.GeoTIFFTileSource.getAllTileSources(url, { logLatency: false, cache: true })
  return tileSources[0]
}

viewerObj.loadViewer = async (viewerOpts=viewerObj.default.osdViewerOptions) => {
  if (!viewerObj.viewer) {
    viewerObj.viewer = OpenSeadragon(viewerOpts)
    // viewerObj.viewer.addHandler('update-viewport', viewerObj.handlers.viewer.updateViewport)
    viewerObj.viewer.addHandler('animation-finish', viewerObj.handlers.viewer.animationFinish)
  }
}

viewerObj.loadImage = async (url) => {
  // Load the image.
  if (!url) {
    console.error("Cannot load image. URL Missing")
    return
  }
  
  if (!viewerObj.progressBarMover) {
    progressBar(true)
  }

  if (!viewerObj.viewer) {
    viewerObj.loadViewer()
  } else {
    viewerObj.viewer.close()
  }

  const tileSource = await createTileSource(url)
  if (!tileSource) {
    alert("Error retrieving image information!")
    return undefined
  }

  viewerObj.viewer.addOnceHandler('open', viewerObj.handlers.viewer.open)
  viewerObj.viewer.open(tileSource)
}

// Use hashParams to invoke handlePanAndZoom separately in the importing module.
viewerObj.handlePanAndZoom = (centerX=hashParams?.wsiCenterX, centerY=hashParams?.wsiCenterY, zoomLevel=hashParams?.wsiZoom) => {
  if (viewerObj.viewer?.viewport) {
    const currentZoom = viewerObj.viewer.viewport.getZoom()
    zoomLevel = parseFloat(zoomLevel)
    if (zoomLevel && zoomLevel !== currentZoom) {
      viewerObj.viewer.viewport.zoomTo(zoomLevel)
    }
    
    const { x: currentX, y: currentY } = viewerObj.viewer.viewport.getCenter()
    centerX = parseFloat(centerX)
    centerY = parseFloat(centerY)
    if (centerX && centerY && ( centerX !== currentX || centerY !== currentY )) {
      viewerObj.viewer.viewport.panTo(new OpenSeadragon.Point(centerX, centerY))
    }
  }
}

export default viewerObj;