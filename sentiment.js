/**
 * Sends text to the sentiment analysis API.
 *
 * @format
 * @param {string} text - The extracted H1 text.
 * @returns {Promise<{label: string, score: number, analysis_time_ms: number}>} - The sentiment analysis result including time.
 */

// TODO: Remove this, just kept for memory!!!
export async function analyzeSentimentWhole(text) {
	try {
		const startTime = performance.now()
		/*const response = await fetch("http://localhost:8000/get-sentiment", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
		})*/

		const reqTextSections = { sections: text }

		const response = await fetch(
			"http://localhost:8000/get-sentiment-sections",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reqTextSections),
			}
		)
		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`)
		}
		const data = await response.json()

		const endTime = performance.now()
		const elapsedTime = endTime - startTime

		return {
			label: data.label || "Unknown",
			score: data.score || 0.0,
			analysis_time_ms: elapsedTime,
		}
	} catch (error) {
		console.error("Error fetching sentiment analysis:", error)
		return { label: "Error", score: 0.0, analysis_time_ms: 0 }
	}
}

export async function analyzeSentiment(textSections) {
	try {
		const startTime = performance.now()

		const reqTextSections = { sections: textSections }

		const response = await fetch(
			"http://localhost:8000/get-sentiment-sections",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reqTextSections),
			}
		)

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`)
		}

		const data = await response.json()

		console.log("Scores for sections: ", data)

		const endTime = performance.now()
		const elapsedTime = endTime - startTime

		return {
			label: data.label || "Unknown",
			score: data.score || 0.0,
			analysis_time_ms: elapsedTime,
		}
	} catch (error) {
		console.error("Error fetching sentiment analysis:", error)
		return { label: "Error", score: 0.0, analysis_time_ms: 0 }
	}
}
