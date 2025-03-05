/** @format */
;(function () {
	if (document.getElementById("my-extension-side-panel")) return

	// -------------------------------
	// Create Side Panel UI
	// -------------------------------
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
	contentArea.style.overflowY = "auto"
	contentArea.style.maxHeight = "calc(100% - 50px)"

	// URL and H1 display
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

	// Sentiment container and analysis time
	const sentimentContainer = document.createElement("div")
	sentimentContainer.style.marginTop = "10px"
	sentimentContainer.innerHTML = "<strong>Sentiment Analysis:</strong>"
	contentArea.appendChild(sentimentContainer)
	const analysisTimeParagraph = document.createElement("p")
	analysisTimeParagraph.style.marginTop = "10px"
	analysisTimeParagraph.textContent = "Analysed in: Loading..."
	contentArea.appendChild(analysisTimeParagraph)

	panel.appendChild(contentArea)
	document.body.appendChild(panel)

	// -------------------------------
	// Utility: Clear Sidebar & Overlays
	// -------------------------------
	function clearSentimentFields() {
		h1Paragraph.textContent = "H1: Loading..."
		sentimentContainer.innerHTML = "<strong>Sentiment Analysis:</strong>"
		analysisTimeParagraph.textContent = "Analysed in: Loading..."
	}
	function clearPreviousOverlays() {
		document.querySelectorAll(".sentiment-overlay").forEach((ov) => ov.remove())
	}

	// -------------------------------
	// Overlay Application
	// -------------------------------
	// Applies a semi-transparent overlay to an element based on its sentiment.
	function applyOverlay(element, label) {
		if (!element) return
		// Remove existing overlays in this element.
		element.querySelectorAll(".sentiment-overlay").forEach((ov) => ov.remove())
		const overlay = document.createElement("div")
		overlay.className = "sentiment-overlay"
		overlay.style.position = "absolute"
		overlay.style.top = "0"
		overlay.style.left = "0"
		overlay.style.width = "100%"
		overlay.style.height = "100%"
		overlay.style.pointerEvents = "none"
		overlay.style.zIndex = "1"
		switch (label.toLowerCase()) {
			case "positive":
				overlay.style.backgroundColor = "rgba(212,237,218,0.5)"
				break
			case "negative":
				overlay.style.backgroundColor = "rgba(248,215,218,0.5)"
				break
			default:
				overlay.style.backgroundColor = "rgba(255,243,205,0.5)"
		}
		if (window.getComputedStyle(element).position === "static") {
			element.style.position = "relative"
		}
		element.appendChild(overlay)
	}

	// -------------------------------
	// Re-Fetching & Sentiment Analysis
	// -------------------------------
	// Uses the scraper to tag the live DOM and return fresh article parts,
	// then passes those parts to the sentiment analysis module.
	async function runSentimentAnalysis() {
		try {
			// Call the scraper. It clears previous tags and re-tags the live DOM.
			const { extractAndProcessText } = await import(
				chrome.runtime.getURL("scraper-full.js")
			)
			const freshParts = await extractAndProcessText(window.location.href)
			console.log("Freshly scraped parts:", freshParts)
			if (!Array.isArray(freshParts) || freshParts.length === 0) {
				console.error("No valid content found.")
				h1Paragraph.textContent = "H1: No valid content found."
				return
			}

			const mainHeading =
				freshParts.find((item) => item.id === "mh")?.content || "No H1 found"
			h1Paragraph.textContent = "H1: " + mainHeading

			const { analyzeSentiment } = await import(
				chrome.runtime.getURL("sentiment.js")
			)
			const { sentimentResults, elapsedTime } = await analyzeSentiment(
				freshParts
			)
			console.log("Sentiment data received:", sentimentResults)
			if (!Array.isArray(sentimentResults)) {
				console.error("Expected an array but got:", sentimentResults)
				sentimentContainer.innerHTML =
					"<strong>Sentiment Analysis:</strong><br>Error processing sentiment data."
				return
			}

			// Clear old results and overlays.
			sentimentContainer.innerHTML = "<strong>Sentiment Analysis:</strong>"
			clearPreviousOverlays()

			// For each sentiment result, update the sidebar and apply overlays on all matching DOM elements.
			sentimentResults.forEach(({ id, label, score }) => {
				const sectionDiv = document.createElement("div")
				sectionDiv.style.marginTop = "5px"
				sectionDiv.style.padding = "5px"
				sectionDiv.style.borderBottom = "1px solid #ddd"
				sectionDiv.setAttribute("data-custom-id", id)
				switch (label.toLowerCase()) {
					case "positive":
						sectionDiv.style.backgroundColor = "#d4edda"
						break
					case "negative":
						sectionDiv.style.backgroundColor = "#f8d7da"
						break
					default:
						sectionDiv.style.backgroundColor = "#fff3cd"
				}
				const sectionTitle = document.createElement("strong")
				sectionTitle.textContent = id + ": "
				sectionDiv.appendChild(sectionTitle)
				const sectionSentiment = document.createElement("span")
				sectionSentiment.textContent = ` ${label} (Score: ${score.toFixed(2)})`
				sectionDiv.appendChild(sectionSentiment)
				sentimentContainer.appendChild(sectionDiv)

				// Apply overlay to every element with the matching data-sentiment-id.
				const targetElements = document.querySelectorAll(
					`[data-sentiment-id="${id}"]`
				)
				if (targetElements.length > 0) {
					targetElements.forEach((el) => applyOverlay(el, label))
				} else {
					console.warn(`No DOM element found for sentiment ID: ${id}`)
				}
			})

			analysisTimeParagraph.textContent = `Analysed in: ${elapsedTime.toFixed(
				2
			)} ms`
		} catch (error) {
			console.error("Error during sentiment analysis:", error)
			h1Paragraph.textContent = "H1: Error extracting text."
			sentimentContainer.innerHTML =
				"<strong>Sentiment Analysis:</strong><br>Error fetching sentiment data."
			analysisTimeParagraph.textContent = "Analysed in: Error"
		}
	}

	// -------------------------------
	// URL Change & Re-scraping Logic
	// -------------------------------
	function updateUrl() {
		urlParagraph.textContent = "Current URL: " + window.location.href
		clearSentimentFields()
		clearPreviousOverlays()
		console.log(
			"URL updated. Re-scraping new content for:",
			window.location.href
		)
		setTimeout(() => {
			runSentimentAnalysis()
		}, 1000)
	}

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

	// Run analysis on initial load.
	runSentimentAnalysis()
})()
