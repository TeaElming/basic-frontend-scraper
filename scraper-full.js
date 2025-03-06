/**
 * Fetches and extracts article parts from a webpage.
 *
 * @format
 * @param {string} url - The URL to scrape.
 * @returns {Promise<Array>} - Array of article parts.
 */
export async function extractAndProcessText(url) {
	try {
		// For a live DOM scrape, we pass the live document.
		return extractArticleContent(document)
	} catch (error) {
		console.error("Error fetching the page:", error)
		return []
	}
}

/**
 * Extracts the main heading (h1) and (optionally) subheadings (h2-h6) and paragraphs,
 * and tags the live DOM elements with a unique data attribute.
 *
 * Before tagging, any existing [data-sentiment-id] attributes are cleared.
 *
 * Returns an array like:
 * [
 *   { id: "mh", content: "Main Heading" },
 *   // { id: "sh1", content: "Subheading 1" },
 *   // { id: "p1", content: "Paragraph after subheading 1" },
 *   ...
 * ]
 *
 * @param {Document} doc - The Document to scrape.
 * @returns {Array} - Array of article parts.
 */
function extractArticleContent(doc) {
	const parts = []
	const container = doc.querySelector("article") || doc.body

	// Clear any existing tags so we start fresh.
	container.querySelectorAll("[data-sentiment-id]").forEach((el) => {
		el.removeAttribute("data-sentiment-id")
	})

	// 1) Main heading (h1)
	const h1 = container.querySelector("h1")
	if (!h1) {
		alert("No H1 found on the page.")
		return []
	}
	h1.setAttribute("data-sentiment-id", "mh")
	parts.push({
		id: "mh",
		content: h1.textContent.trim(),
	})

	/*
	// ============================
	// COMMENTED OUT: H2-H6 & P SCRAPING
	// ============================

	// 2) Collect subheadings (h2-h6) and paragraphs (p) after the H1.
	const contentNodes = Array.from(
		container.querySelectorAll("h2, h3, h4, h5, h6, p, img, video")
	).filter(
		(node) =>
			h1.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
	);

	let subheadingCounter = 1;
	let paragraphCounter = 1;
	let currentHeading = null;
	let paragraphBuffer = [];

	function flushParagraphs() {
		if (currentHeading && paragraphBuffer.length > 0) {
			if (!currentHeading.hasAttribute("data-sentiment-id")) {
				currentHeading.setAttribute(
					"data-sentiment-id",
					`sh${subheadingCounter}`
				);
			}
			parts.push({
				id: `sh${subheadingCounter}`,
				content: currentHeading.textContent.trim(),
			});
			subheadingCounter++;

			paragraphBuffer.forEach((pNode) => {
				if (!pNode.hasAttribute("data-sentiment-id")) {
					pNode.setAttribute("data-sentiment-id", `p${paragraphCounter}`);
				}
				parts.push({
					id: `p${paragraphCounter}`,
					content: pNode.textContent.trim(),
				});
				paragraphCounter++;
			});
			paragraphBuffer = [];
		}
	}

	for (let i = 0; i < contentNodes.length; i++) {
		const node = contentNodes[i];
		if (/^H[2-6]$/.test(node.tagName)) {
			flushParagraphs();
			currentHeading = node;
		} else if (node.tagName === "P") {
			const text = node.textContent.trim();
			if (text) {
				paragraphBuffer.push(node);
			}
		} else if (node.tagName === "IMG" || node.tagName === "VIDEO") {
			// Skip media nodes.
			continue;
		}
	}
	flushParagraphs();
	// ============================
	*/

	console.log("Scraped and tagged parts:", parts)
	return parts
}
