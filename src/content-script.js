let lat = 43.6532259;
let long = -79.383186;
const exclude = "current,minutely,daily,alerts";
const appId = "";
const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=${exclude}&appid=${appId}`;

const sleep = m => new Promise(r => setTimeout(r, m));

async function getWeatherData() {
    try {
        const response = await fetch(url);
        return await response.text();
    } catch (error) {
        console.log(error);
    }
}

function getCoordinates() {
    return new Promise((res, rej) => {
        return navigator.geolocation.getCurrentPosition(res, rej);
    });
}

(async () => {
    let weatherData = JSON.parse(await getWeatherData());
    console.log(weatherData);

    await sleep(500);

    if (navigator.geolocation) {
        try {
            const position = await this.getCoordinates();

            lat = position.coords.latitude;
            long = position.coords.longitude;
        } catch (error) {
            chrome.runtime.sendMessage({error: "geolocation"});
            return;
        }
    } else {
        chrome.runtime.sendMessage({error: "geolocation"});
        return;
    }

    const nodes = document.getElementsByTagName("*");

    let node;

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].childElementCount == 25) {
            if (nodes[i].children[0].childElementCount != 0) {
                node = nodes[i];
                break;
            }
        }
    }

    let columns = document.querySelectorAll("div[role='gridcell'][jsname]");

    let startHour = new Date().getHours();

    let startColumn = 0;

    for (let i = 0; i < columns.length; i++) {
        let column = columns[i];
        if (column.children[0].innerHTML.endsWith(new Date().getDate()) || column.children[0].innerHTML.endsWith("today")) {
            startColumn = i;
            break;
        }
    }

    console.log(columns[startColumn].querySelectorAll("div[role='presentation']")[0]);

    for (let i = 0; i < weatherData.hourly.length; i++) {
        const newContent = document.createElement("div");
        newContent.innerHTML = "<i>" + weatherData.hourly[i].weather[0].description + " / " + Math.round(weatherData.hourly[i].temp - 273) + "°C" + "</i>";
        newContent.style.top = (columns[0].offsetHeight / 24) * startHour + "px";
        newContent.style.position = "absolute";
        newContent.style.color = "gray";
        newContent.style.fontSize = "10px";
        newContent.dataset.isWeather = true;

        columns[startColumn].querySelectorAll("div[role='presentation']")[0].appendChild(newContent);

        startHour++;
        if (startHour >= 24) {
            startColumn++;
            startHour = 0;

            if (startColumn == columns.length) break;
        }
    }

    const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
    };

    const observer = new MutationObserver(changeCallback);
    observer.observe(columns[0], observerOptions);
    observer.observe(columns[1], observerOptions);
    observer.observe(columns[2], observerOptions);
})();

function changeCallback(mutationList, observer) {
    mutationList.forEach(mutation => {
        switch (mutation.type) {
            case "childList":
                //console.log("test1 " + mutation.removedNodes.length);
                mutation.removedNodes.forEach(node => {
                    if (node.dataset != null && node.dataset.isWeather) {
                        //console.log("TESTESTSETEST");
                        mutation.target.appendChild(node);
                    }
                });
                break;
            case "attributes":
                //console.log("test2");
                break;
        }
    });
}
