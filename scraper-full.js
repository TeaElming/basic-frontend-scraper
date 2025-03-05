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
		return ""
	}
	parts.push({
		id: "mh",
		content: h1.textContent.trim(),
	})

	// 2) Collect all subheadings (h2-h6) + paragraphs (p) that appear AFTER the h1.
	const contentNodes = Array.from(
		container.querySelectorAll("h2, h3, h4, h5, h6, p")
	).filter(
		(node) =>
			h1.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
	)

	// Helper to remove <img> or <video> from a <p> node and get clean text.
	function getParagraphText(pNode) {
		const clone = pNode.cloneNode(true)
		clone.querySelectorAll("img, video").forEach((el) => el.remove())
		return clone.textContent.trim()
	}

	let subheadingCounter = 1
	let paragraphCounter = 1

	// Keep track of "pending" subheading and the paragraphs belonging to it.
	let pendingSubheading = null
	let pendingParagraphs = []

	// Function to finalize the current subheading + paragraphs (if any).
	function flushSubheadingAndParagraphs() {
		if (pendingSubheading && pendingParagraphs.length > 0) {
			// Add the subheading
			parts.push({
				id: "sh" + subheadingCounter,
				content: pendingSubheading.textContent.trim(),
			})
			subheadingCounter++

			// Add each paragraph
			for (const pText of pendingParagraphs) {
				parts.push({
					id: "p" + paragraphCounter,
					content: pText,
				})
				paragraphCounter++
			}
		}
		// Reset
		pendingSubheading = null
		pendingParagraphs = []
	}

	// 3) Iterate through the contentNodes
	for (let i = 0; i < contentNodes.length; i++) {
		const node = contentNodes[i]

		if (/^H[2-6]$/.test(node.tagName)) {
			// We have encountered a new subheading:
			// First, finalize the previous subheading group.
			flushSubheadingAndParagraphs()

			// Now this becomes our pending subheading
			pendingSubheading = node
			pendingParagraphs = []
		} else if (node.tagName === "P") {
			// If we have a pending subheading, store paragraphs associated with it
			if (pendingSubheading) {
				const pText = getParagraphText(node)
				if (pText) {
					pendingParagraphs.push(pText)
				}
			}
		}
	}

	// Flush the last subheading group if it has paragraphs
	flushSubheadingAndParagraphs()

	return JSON.stringify(parts, null, 2)
}
