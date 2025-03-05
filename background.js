/** @format */

chrome.action.onClicked.addListener((tab) => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ["contentScript-full.js"],
	})
})

//TODO: Remmeebr that I changed the contentscript to contentScript-full.js