/** @format */

;(function () {
	if (document.getElementById("my-extension-side-panel")) return

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

	const urlParagraph = document.createElement("p")
	urlParagraph.style.whiteSpace = "normal"
	urlParagraph.style.wordWrap = "break-word"
	urlParagraph.textContent = "Current URL: " + window.location.href
	contentArea.appendChild(urlParagraph)

	const h1Paragraph = document.createElement("p")
	h1Paragraph.style.whiteSpace = "normal"
	h1Paragraph.style.wordWrap = "break-word"
	h1Paragraph.textContent = "H1: Loading..."
	contentArea.appendChild(h1Paragraph)

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

	const analysisTimeParagraph = document.createElement("p")
	analysisTimeParagraph.style.marginTop = "10px"
	analysisTimeParagraph.textContent = "Analysed in: Loading..."
	contentArea.appendChild(analysisTimeParagraph)

	panel.appendChild(contentArea)
	document.body.appendChild(panel)

	// Update URL display and clear previous data
	function updateUrl() {
		urlParagraph.textContent = "Current URL: " + window.location.href
		h1Paragraph.textContent = "H1: Loading..."
		sentimentLabel.textContent = "Loading..."
		sentimentScore.textContent = ""
		runSentimentAnalysis()
	}

	// Override history methods to detect SPA URL changes.
	;(function (history) {
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

	runSentimentAnalysis()
})()
