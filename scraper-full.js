/**
 * Fetches and extracts article parts from a webpage.
 *
 * @format
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} - JSON string of article parts.
 */
export async function extractAndProcessText(url) {
	try {
		const response = await fetch(url, { cache: "no-store" })
		const html = await response.text()
		const parser = new DOMParser()
		const doc = parser.parseFromString(html, "text/html")
		return extractArticleContent(doc)
	} catch (error) {
		console.error("Error fetching the page:", error)
		return ""
	}
}

/**
 * Extracts the main heading (h1), subheadings (h2-h6) and paragraphs.
 *
 * Only includes a subheading if it has at least one <p> after it (before the next subheading).
 *
 * Returns a JSON array like:
 * [
 *   { id: "mh", content: "Main Heading" },
 *   { id: "sh1", content: "Subheading 1" },
 *   { id: "p1", content: "Paragraph after subheading 1" },
 *   { id: "p2", content: "Another paragraph after subheading 1" },
 *   ...
 * ]
 *
 * @param {Document} doc - The parsed HTML document.
 * @returns {string} - JSON string of article parts.
 */
function extractArticleContent(doc) {
	const parts = []

	// Use <article> if it exists, otherwise the whole body.
	const container = doc.querySelector("article") || doc.body

	// 1) Main heading
	const h1 = container.querySelector("h1")
	if (!h1) {
		alert("No H1 found on the page.")
		return []
	}
	parts.push({
		id: "mh",
		content: h1.textContent.trim(),
	})

	// 2) Collect all subheadings (h2-h6) + paragraphs (p) that appear AFTER the h1.
	const contentNodes = Array.from(
		container.querySelectorAll("h2, h3, h4, h5, h6, p, img, video")
	).filter(
		(node) =>
			h1.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
	)

	// Helper to extract clean text from a <p> node
	function getParagraphText(pNode) {
		const clone = pNode.cloneNode(true)
		clone.querySelectorAll("img, video").forEach((el) => el.remove())
		return clone.textContent.trim()
	}

	let subheadingCounter = 1
	let paragraphCounter = 1

	// Keep track of the current subheading
	let currentHeading = null
	let paragraphBuffer = []

	// Function to flush paragraphs into the list
	function flushParagraphs() {
		if (currentHeading && paragraphBuffer.length > 0) {
			// Add subheading if it exists
			parts.push({
				id: `sh${subheadingCounter}`,
				content: currentHeading.textContent.trim(),
			})
			subheadingCounter++

			// Add stored paragraphs
			paragraphBuffer.forEach((pText) => {
				parts.push({
					id: `p${paragraphCounter}`,
					content: pText,
				})
				paragraphCounter++
			})

			// Reset the buffer
			paragraphBuffer = []
		}
	}

	// 3) Iterate through elements, ensuring paragraphs after images/videos are included
	for (let i = 0; i < contentNodes.length; i++) {
		const node = contentNodes[i]

		if (/^H[2-6]$/.test(node.tagName)) {
			// Found a new subheading: Flush previous paragraphs
			flushParagraphs()
			currentHeading = node
		} else if (node.tagName === "P") {
			// Always store paragraphs
			const pText = getParagraphText(node)
			if (pText) {
				paragraphBuffer.push(pText)
			}
		} else if (node.tagName === "IMG" || node.tagName === "VIDEO") {
			// Media files don't reset the heading context, but we store them if followed by a paragraph
			continue
		}
	}

	// Flush the last set of paragraphs
	flushParagraphs()

	return parts
}
