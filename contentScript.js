/** @format */

; (function () {
  if (document.getElementById("my-extension-side-panel")) return

  // Create the side panel
  const panel = document.createElement("div")
  panel.id = "my-extension-side-panel"
  panel.style.position = "fixed"
  panel.style.top = "0"
  panel.style.right = "0"
  panel.style.width = "300px"
  panel.style.height = "100%"
  panel.style.backgroundColor = "#fff"
  panel.style.borderLeft = "1px solid #ccc"
  panel.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)"
  panel.style.zIndex = "999999"

  const header = document.createElement("div")
  header.style.display = "flex"
  header.style.justifyContent = "space-between"
  header.style.alignItems = "center"
  header.style.padding = "10px"
  header.style.backgroundColor = "#f1f1f1"
  header.style.borderBottom = "1px solid #ccc"

  const title = document.createElement("div")
  title.textContent = "Side Panel"

  const closeButton = document.createElement("button")
  closeButton.textContent = "X"
  closeButton.style.border = "none"
  closeButton.style.background = "none"
  closeButton.style.cursor = "pointer"
  closeButton.style.fontSize = "16px"
  closeButton.addEventListener("click", () => panel.remove())
  header.appendChild(title)
  header.appendChild(closeButton)
  panel.appendChild(header)

  const contentArea = document.createElement("div")
  contentArea.style.padding = "10px"

  // Radio Buttons for mode selection
  const modeLabel = document.createElement("div")
  modeLabel.textContent = "Mode:"
  modeLabel.style.marginBottom = "5px"
  contentArea.appendChild(modeLabel)

  const radioContainer = document.createElement("div")
  radioContainer.style.marginBottom = "10px"

  const autoRadio = document.createElement("input")
  autoRadio.type = "radio"
  autoRadio.name = "scrapingMode"
  autoRadio.value = "auto"
  autoRadio.checked = true

  const autoLabel = document.createElement("label")
  autoLabel.textContent = "Automatic Scraping"

  const manualRadio = document.createElement("input")
  manualRadio.type = "radio"
  manualRadio.name = "scrapingMode"
  manualRadio.value = "manual"

  const manualLabel = document.createElement("label")
  manualLabel.textContent = "Enter Text"

  radioContainer.appendChild(autoRadio)
  radioContainer.appendChild(autoLabel)
  radioContainer.appendChild(document.createElement("br"))
  radioContainer.appendChild(manualRadio)
  radioContainer.appendChild(manualLabel)

  contentArea.appendChild(radioContainer)

  // Text area (for manual text entry), hidden by default
  const manualTextArea = document.createElement("textarea")
  manualTextArea.rows = 4
  manualTextArea.style.width = "100%"
  manualTextArea.style.display = "none"

  const analyseButton = document.createElement("button")
  analyseButton.textContent = "Analyse"
  analyseButton.style.display = "none"
  analyseButton.style.marginTop = "5px"

  contentArea.appendChild(manualTextArea)
  contentArea.appendChild(analyseButton)

  // Paragraph to show current URL
  const urlParagraph = document.createElement("p")
  urlParagraph.style.whiteSpace = "normal"
  urlParagraph.style.wordWrap = "break-word"
  urlParagraph.textContent = "Current URL: " + window.location.href
  contentArea.appendChild(urlParagraph)

  // Paragraph to show H1 text
  const h1Paragraph = document.createElement("p")
  h1Paragraph.style.whiteSpace = "normal"
  h1Paragraph.style.wordWrap = "break-word"
  h1Paragraph.textContent = "H1: Loading..."
  contentArea.appendChild(h1Paragraph)

  // Sentiment container
  const sentimentContainer = document.createElement("div")
  sentimentContainer.style.marginTop = "10px"
  sentimentContainer.textContent = "Sentiment: "
  const sentimentLabel = document.createElement("span")
  sentimentLabel.textContent = "Loading..."
  const sentimentScore = document.createElement("span")
  sentimentScore.textContent = ""
  sentimentContainer.appendChild(sentimentLabel)
  sentimentContainer.appendChild(document.createTextNode(" Score: "))
  sentimentContainer.appendChild(sentimentScore)
  contentArea.appendChild(sentimentContainer)

  // Analysis time paragraph
  const analysisTimeParagraph = document.createElement("p")
  analysisTimeParagraph.style.marginTop = "10px"
  analysisTimeParagraph.textContent = "Analysed in: Loading..."
  contentArea.appendChild(analysisTimeParagraph)

  panel.appendChild(contentArea)
  document.body.appendChild(panel)

  // Mode change event: show/hide relevant UI
  function handleModeChange() {
    const mode = document.querySelector('input[name="scrapingMode"]:checked')
      .value
    if (mode === "auto") {
      manualTextArea.style.display = "none"
      analyseButton.style.display = "none"
      // Re-run automatic scraping immediately if URL changed or user toggled back
      updateUrl()
    } else {
      manualTextArea.style.display = "block"
      analyseButton.style.display = "inline-block"
    }
  }

  autoRadio.addEventListener("change", handleModeChange)
  manualRadio.addEventListener("change", handleModeChange)

  // Analyse button for manual text
  analyseButton.addEventListener("click", async () => {
    clearSentimentFields()
    const text = manualTextArea.value.trim()
    if (!text) {
      alert("Please enter text to analyse.")
      return
    }
    try {
      const startTime = performance.now()
      const { analyzeSentiment } = await import(
        chrome.runtime.getURL("sentiment.js")
      )
      const sentimentData = await analyzeSentiment(text)
      const endTime = performance.now()

      h1Paragraph.textContent = "H1: (Manual Entry)"
      sentimentLabel.textContent = sentimentData.label
      sentimentScore.textContent = sentimentData.score.toFixed(2)
      analysisTimeParagraph.textContent = `Analysed in: ${(endTime - startTime).toFixed(
        2
      )} ms`
    } catch (error) {
      console.error("Error during manual sentiment analysis:", error)
      h1Paragraph.textContent = "H1: Error in manual analysis."
      sentimentLabel.textContent = "Error"
      sentimentScore.textContent = ""
      analysisTimeParagraph.textContent = "Analysed in: Error"
    }
  })

  // Clears sentiment fields before each analysis
  function clearSentimentFields() {
    h1Paragraph.textContent = "H1: Loading..."
    sentimentLabel.textContent = "Loading..."
    sentimentScore.textContent = ""
    analysisTimeParagraph.textContent = "Analysed in: Loading..."
  }

  // Update URL display and trigger scraping if in auto mode
  function updateUrl() {
    urlParagraph.textContent = "Current URL: " + window.location.href
    clearSentimentFields()

    const mode = document.querySelector('input[name="scrapingMode"]:checked')
      .value
    if (mode === "auto") {
      runSentimentAnalysis()
    }
  }

  // Listen for SPA-like URL changes
  ; (function (history) {
    const originalPushState = history.pushState
    history.pushState = function (...args) {
      const result = originalPushState.apply(history, args)
      window.dispatchEvent(new Event("locationchange"))
      return result
    }
    const originalReplaceState = history.replaceState
    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(history, args)
      window.dispatchEvent(new Event("locationchange"))
      return result
    }
  })(window.history)

  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("locationchange"))
  )
  window.addEventListener("hashchange", updateUrl)
  window.addEventListener("locationchange", updateUrl)

  let currentUrl = window.location.href
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href
      updateUrl()
    }
  }, 500)

  // Original sentiment analysis logic (Automatic mode)
  async function runSentimentAnalysis() {
    try {
      const { extractAndProcessText } = await import(
        chrome.runtime.getURL("scraper.js")
      )
      const { analyzeSentiment } = await import(
        chrome.runtime.getURL("sentiment.js")
      )
      const extractedText = await extractAndProcessText(window.location.href)
      h1Paragraph.textContent = "H1: " + (extractedText || "No H1 found.")
      if (extractedText) {
        const sentimentData = await analyzeSentiment(extractedText)
        sentimentLabel.textContent = sentimentData.label
        sentimentScore.textContent = sentimentData.score.toFixed(2)
        analysisTimeParagraph.textContent = `Analysed in: ${sentimentData.analysis_time_ms.toFixed(
          2
        )} ms`
      } else {
        sentimentLabel.textContent = "N/A"
        sentimentScore.textContent = ""
        analysisTimeParagraph.textContent = "Analysed in: N/A"
      }
    } catch (error) {
      console.error("Error during sentiment analysis:", error)
      h1Paragraph.textContent = "H1: Error extracting text."
      sentimentLabel.textContent = "Error"
      sentimentScore.textContent = ""
      analysisTimeParagraph.textContent = "Analysed in: Error"
    }
  }

  // Default mode is auto, so run analysis on load
  runSentimentAnalysis()
})()
