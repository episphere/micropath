window.onload = () => {
    setTimeout(showDataSourceModal, 100)
}

const populateDataSourceOptionsInModal = (dataSourceConfigs) => {
    const dataSourceOptionsParentElement = document.getElementById("dataSourceOptions") 
    Object.values(dataSourceConfigs).forEach(dataSource => {
        const dataSourceOptionElement = document.createElement("div")
        dataSourceOptionElement.classList.add("grid", "grid-rows-4", "grid-cols-1", "gap-0.5", "items-center", "mx-4", "px-4", "w-32", "h-32", "border", "border-solid", "rounded-md", "border-sky-300")
        if (!dataSource.disabled) {
            dataSourceOptionElement.classList.add("hover:bg-gray-100", "hover:cursor-pointer")
            dataSourceOptionElement.addEventListener('click', () => selectDataSource(dataSource))
        } else {
            dataSourceOptionElement.classList.add("hover:cursor-not-allowed")
        }
        
        const dataSourceIconImg = document.createElement("img")
        dataSourceIconImg.classList.add("row-span-3")
        dataSourceIconImg.setAttribute('src', dataSource.iconImgPath)

        const dataSourceText = document.createElement("p")
        dataSourceText.classList.add("row-span-1", "text-center")
        dataSourceText.innerText = dataSource.displayName

        dataSourceOptionElement.appendChild(dataSourceIconImg)
        dataSourceOptionElement.appendChild(dataSourceText)
        dataSourceOptionsParentElement.appendChild(dataSourceOptionElement)                    
    })
}

const showDataSourceModal = async () => {
    const dataSourceConfigs = await fetch("./dataSourceConfigs.json").then(resp => resp.json())
    populateDataSourceOptionsInModal(dataSourceConfigs)
    document.getElementById("modalBackdrop").classList.remove("opacity-0")
    document.getElementById("modalBackdrop").classList.remove("hidden")
    document.getElementById("modalBackdrop").classList.add("ease-out","duration-300","opacity-100")
    setTimeout(() => {
        document.getElementById("modalBackdrop").classList.remove("ease-out","duration-300")
    }, 300)
    document.getElementById("modalPanel").classList.remove("opacity-0", "translate-y-4", "sm:translate-y-0", "sm:scale-95")
    document.getElementById("modalPanel").classList.remove("hidden")
    document.getElementById("modalPanel").classList.add("ease-out","duration-300","opacity-100", "translate-y-0", "sm:scale-100")
    setTimeout(() => {
        document.getElementById("modalPanel").classList.remove("ease-out","duration-300")
    }, 300)
}

const removeDataSourceModal = () => {
    document.getElementById("modalPanel").classList.remove("opacity-100", "translate-y-0", "sm:scale-100")
    document.getElementById("modalPanel").classList.add("ease-in","duration-200", "opacity-0", "translate-y-4", "sm:translate-y-0", "sm:scale-95")
    setTimeout(() => {
        document.getElementById("modalPanel").classList.remove("ease-in", "duration-200")
        document.getElementById("modalPanel").classList.add("hidden")
    }, 200)
    document.getElementById("modalBackdrop").classList.remove("opacity-100")
    document.getElementById("modalBackdrop").classList.add("ease-in","duration-200","opacity-0")
    setTimeout(() => {
        document.getElementById("modalBackdrop").classList.remove("ease-in","duration-200")
        document.getElementById("modalBackdrop").classList.add("hidden")
        document.getElementById("modalBackdrop").parentElement.classList.add("hidden")
    }, 200)
}

const selectDataSource = async (dataSourceConfig) => {
    if (!dataSourceConfig.disabled) {
        removeDataSourceModal()
        window.location.href = window.location.href.replace("index.html", "/") + dataSourceConfig.redirectPath
    }
}