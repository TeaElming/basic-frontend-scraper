/**
 * Fetches and extracts article parts from a webpage, ensuring both:
 * - Live updates when the URL changes.
 * - Ability to set attributes on live DOM elements.
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

		// Extract content from fresh HTML but apply attributes to the live DOM.
		return extractArticleContent(doc, document)
	} catch (error) {
		console.error("Error fetching the page:", error)
		return []
	}
}

/**
 * Extracts article content (H1, H2-H6, P) and assigns attributes to the live DOM.
 *
 * - Fetches content from `doc` (parsed HTML).
 * - Sets attributes in `liveDoc` (actual webpage DOM).
 *
 * @param {Document} doc - The fetched HTML document.
 * @param {Document} liveDoc - The live DOM document.
 * @returns {Array} - Array of article parts.
 */
function extractArticleContent(doc, liveDoc) {
	const parts = []

	// Detect container in fetched HTML.
	const container = doc.querySelector("article") || doc.body
	const liveContainer = liveDoc.querySelector("article") || liveDoc.body

	// Clear old sentiment attributes in live DOM.
	liveContainer.querySelectorAll("[data-sentiment-id]").forEach((el) => {
		el.removeAttribute("data-sentiment-id")
	})

	// 1) Main heading (H1)
	const h1 = container.querySelector("h1")
	const liveH1 = liveContainer.querySelector("h1")

	if (!h1 || !liveH1) {
		alert("No H1 found on the page.")
		return []
	}

	liveH1.setAttribute("data-sentiment-id", "mh")
	parts.push({ id: "mh", content: h1.textContent.trim() })

	// 2) Collect subheadings (H2-H6) and paragraphs (P) after the H1.
	const contentNodes = Array.from(
		container.querySelectorAll("h2, h3, h4, h5, h6, p")
	).filter(
		(node) =>
			h1.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
	)

	let subheadingCounter = 1
	let paragraphCounter = 1
	let currentHeading = null
	let paragraphBuffer = []

	function flushParagraphs() {
		if (currentHeading && paragraphBuffer.length > 0) {
			// Find and tag the matching subheading in the live DOM.
			const liveHeading = liveContainer.querySelector(
				`${currentHeading.tagName}:nth-of-type(${subheadingCounter})`
			)
			if (liveHeading) {
				liveHeading.setAttribute("data-sentiment-id", `sh${subheadingCounter}`)
			}

			parts.push({
				id: `sh${subheadingCounter}`,
				content: currentHeading.textContent.trim(),
			})
			subheadingCounter++

			// Process and tag each paragraph
			paragraphBuffer.forEach((pNode, index) => {
				const liveParagraph = liveContainer.querySelector(
					`p:nth-of-type(${paragraphCounter + index})`
				)
				if (liveParagraph) {
					liveParagraph.setAttribute(
						"data-sentiment-id",
						`p${paragraphCounter + index}`
					)
				}
				parts.push({
					id: `p${paragraphCounter + index}`,
					content: pNode.textContent.trim(),
				})
			})
			paragraphCounter += paragraphBuffer.length
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
