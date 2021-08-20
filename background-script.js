chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    chrome.windows.create({url: chrome.runtime.getURL("src/geolocation.html"), type: "popup", height: 200, width: 400});
});
