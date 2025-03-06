/**
 * Fetches and extracts article parts from a webpage while:
 * - Scraping based on the fetched HTML (`doc`).
 * - Setting attributes in the live DOM (`document`).
 *
 * @format
 * @param {string} url - The URL to scrape.
 * @returns {Promise<Array>} - Array of article parts.
 */
export async function extractAndProcessText(url) {
	try {
		// Fetch fresh HTML content when the URL changes.
		const response = await fetch(url, { cache: "no-store" })
		const html = await response.text()
		const parser = new DOMParser()
		const doc = parser.parseFromString(html, "text/html")

		// Clear previous sentiment attributes in the live DOM.
		clearSentimentAttributes(document)

		// Extract content from the fetched HTML but apply attributes to the live DOM.
		const parts = extractArticleContent(doc)

		// Apply the attributes from the fetched content to the live DOM.
		applyAttributesToLiveDOM(doc, document)

		return parts
	} catch (error) {
		console.error("Error fetching the page:", error)
		return []
	}
}

/**
 * Clears all existing `data-sentiment-id` attributes in the live DOM.
 *
 * @param {Document} liveDoc - The live webpage document.
 */
function clearSentimentAttributes(liveDoc) {
	liveDoc.querySelectorAll("[data-sentiment-id]").forEach((el) => {
		el.removeAttribute("data-sentiment-id")
	})
	console.log("Cleared all previous sentiment attributes.")
}

/**
 * Extracts article content (H1, H2-H6, P) and assigns attributes in the **fetched** document (`doc`).
 *
 * @param {Document} doc - The fetched HTML document.
 * @returns {Array} - Array of article parts.
 */
function extractArticleContent(doc) {
	const parts = []
	const container = doc.querySelector("article") || doc.body

	// 1) Main heading (H1)
	const h1 = container.querySelector("h1")
	if (!h1) {
		console.warn("No H1 found on the page.")
		return []
	}

	// Assign sentiment ID in the fetched document (not live yet)
	h1.setAttribute("data-sentiment-id", "mh")
	parts.push({ id: "mh", content: h1.textContent.trim() })

	// 2) Collect subheadings (H2-H6) and paragraphs (P) after the H1.
	const contentNodes = Array.from(
		container.querySelectorAll("h2, h3, h4, h5, h6, p")
	)
	let subheadingCounter = 1
	let paragraphCounter = 1
	let currentHeading = null
	let paragraphBuffer = []

	function flushParagraphs() {
		if (currentHeading && paragraphBuffer.length > 0) {
			currentHeading.setAttribute("data-sentiment-id", `sh${subheadingCounter}`)
			parts.push({
				id: `sh${subheadingCounter}`,
				content: currentHeading.textContent.trim(),
			})
			subheadingCounter++

			paragraphBuffer.forEach((pNode) => {
				pNode.setAttribute("data-sentiment-id", `p${paragraphCounter}`)
				parts.push({
					id: `p${paragraphCounter}`,
					content: pNode.textContent.trim(),
				})
				paragraphCounter++
			})
			paragraphBuffer = []
		}
	}

	// 3) Iterate through the content nodes
	for (let i = 0; i < contentNodes.length; i++) {
		const node = contentNodes[i]
		if (/^H[2-6]$/.test(node.tagName)) {
			flushParagraphs()
			currentHeading = node
		} else if (node.tagName === "P") {
			const text = node.textContent.trim()
			if (text) {
				paragraphBuffer.push(node)
			}
		}
	}
	flushParagraphs()

	console.log("Scraped and tagged parts:", parts)
	return parts
}

/**
 * Copies the `data-sentiment-id` attributes from the fetched HTML (`doc`)
 * to the live DOM (`liveDoc`) to ensure correct overlays.
 *
 * @param {Document} doc - The fetched HTML document (scraped content).
 * @param {Document} liveDoc - The live webpage document (to apply attributes).
 */
function applyAttributesToLiveDOM(doc, liveDoc) {
	const fetchedElements = doc.querySelectorAll("[data-sentiment-id]")
	fetchedElements.forEach((fetchedElement) => {
		const sentimentId = fetchedElement.getAttribute("data-sentiment-id")
		const textContent = fetchedElement.textContent.trim()

		// Find the matching element in the live DOM
		const matchingElement = Array.from(
			liveDoc.querySelectorAll(fetchedElement.tagName)
		).find((el) => el.textContent.trim() === textContent)

		if (matchingElement) {
			matchingElement.setAttribute("data-sentiment-id", sentimentId)
		}
	})

	console.log("Updated live DOM with new sentiment attributes.")
}
