chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    // any messages sent here will mean to popup the 'turn on geolocation' page, so do so:
    chrome.windows.create({url: chrome.runtime.getURL("src/geolocation.html"), type: "popup", height: 200, width: 400});
});
