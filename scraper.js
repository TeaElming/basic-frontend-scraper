/**
 * Fetches and extracts text from a webpage.
 *
 * @format
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} - Extracted H1 text.
 */

export async function extractAndProcessText(url) {
	try {
		// Always fetch a fresh copy from the network.
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
 * Extracts the main heading (H1) text from the document.
 *
 * @param {Document} doc - The parsed HTML document.
 * @returns {string} - The extracted H1 text.
 */
function extractArticleContent(doc) {
	const h1 = doc.querySelector("h1")
	if (!h1) {
		alert("No H1 found on the page.")
		return ""
	}
	return h1.textContent.trim()
}
