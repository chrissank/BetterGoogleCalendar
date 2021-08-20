const exclude = "current,minutely,daily,alerts";
const appId = "";

const sleep = m => new Promise(r => setTimeout(r, m));

function getCoordinates() {
    return new Promise((res, rej) => {
        return navigator.geolocation.getCurrentPosition(res, rej);
    });
}

(async () => {
    let lat = 43.6532259; // default Toronto lat
    let long = -79.383186; // default Toronto long

    // get user location for weather in users area
    if (navigator.geolocation) {
        try {
            const position = await this.getCoordinates();

            lat = position.coords.latitude;
            long = position.coords.longitude;
        } catch (error) {
            // geolocation not enabled, tell them by sending popup to background-script.js
            chrome.runtime.sendMessage({error: "geolocation"});
            return;
        }
    } else {
        // geolocation not enabled, tell them by sending popup to background-script.js
        chrome.runtime.sendMessage({error: "geolocation"});
        return;
    }

    // get the the hourly weather report given the current location
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=${exclude}&appid=${appId}`;
    const response = await fetch(url);
    let weatherData = JSON.parse(await response.text());

    await sleep(500); // let gcal finish loading.. not the best way, but for now, it works on decent internet

    // get the columns shown (only works for 2, 3 or 4 days)
    let columns = document.querySelectorAll("div[role='gridcell'][jsname]");

    let hour = new Date().getHours();
    let column = 0;

    // which column are we currently looking at
    for (let i = 0; i < columns.length; i++) {
        let column = columns[i];
        if (column.children[0].innerHTML.endsWith(new Date().getDate()) || column.children[0].innerHTML.endsWith("today")) {
            column = i;
            break;
        }
    }

    // for each entry in the weather data
    for (let i = 0; i < weatherData.hourly.length; i++) {
        // create a div with the following properties
        const newContent = document.createElement("div");
        newContent.innerHTML = "<i>" + weatherData.hourly[i].weather[0].description + " / " + Math.round(weatherData.hourly[i].temp - 273) + "°C" + "</i>";
        newContent.style.top = (columns[0].offsetHeight / 24) * hour + "px";
        newContent.style.position = "absolute";
        newContent.style.color = "gray";
        newContent.style.fontSize = "10px";
        newContent.dataset.isWeather = true;

        // add it to the column
        columns[column].querySelectorAll("div[role='presentation']")[0].appendChild(newContent);

        // move to next position as described
        hour++;
        if (hour >= 24) {
            column++;
            hour = 0;

            if (column == columns.length) break;
        }
    }

    const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
    };

    // google calendar likes to refresh often, use this to track when the refresh happens
    const observer = new MutationObserver(changeCallback);
    observer.observe(columns[0], observerOptions);
    observer.observe(columns[1], observerOptions);
    observer.observe(columns[2], observerOptions);
})();

function changeCallback(mutationList, observer) {
    mutationList.forEach(mutation => {
        switch (mutation.type) {
            case "childList":
                // check if any of our nodes were deleted
                mutation.removedNodes.forEach(node => {
                    if (node.dataset != null && node.dataset.isWeather) {
                        // if our node was deleted, re-add it
                        mutation.target.appendChild(node);
                    }
                });
                break;
            case "attributes":
                break;
        }
    });
}
