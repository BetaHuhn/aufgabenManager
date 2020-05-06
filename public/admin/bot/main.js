/* main.js - Maximilian Schiller & Noah Till 2020 */

/* Darkmode Support */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
detectDarkMode()

var c1 = document.getElementById('c1c').value;
var c2 = document.getElementById('c2c').value;
var req = "";

async function auth() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const response = await fetch('/api/auth/admin', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        document.getElementById('loader').style.display = "none";
        document.getElementById('wrapper').style.display = "block";
    } else if(json.response == "not permitted"){
        console.log("not permitted")
        window.location.replace('/')
    } else{
        console.log("not logged in")
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    }
}

function changeReq(button) {
    req = button.getAttribute("req");
    switch (req) {
        case "disctoken":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Change Discord Token";
            document.getElementById('c1txt').innerHTML = "Token";
            document.getElementById('c1').style.display = "block";
            break;
        case "teletoken":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Change Telegram Token";
            document.getElementById('c1txt').innerHTML = "Token";
            document.getElementById('c1').style.display = "block";
            break;

        case "telename":
            document.getElementById('c2').style.display = "none";
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Change Telegram Bot name";
            document.getElementById('c1txt').innerHTML = "Name";
            document.getElementById('c1').style.display = "block";
            break;

        case "post":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Post Task";
            document.getElementById('c1txt').innerHTML = "Taks ID";
            document.getElementById('c1').style.display = "block";
            break;

        case "postall":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Post to all classes";
            document.getElementById('c1txt').innerHTML = "Message";
            document.getElementById('c1').style.display = "block";
            break;

        case "postclass":
            document.getElementById('headline').innerHTML = "Post to specific class";
            document.getElementById('c1txt').innerHTML = "Class";
            document.getElementById('c1').style.display = "block";
            document.getElementById('c2txt').innerHTML = "Message";
            document.getElementById('c2').style.display = "block";
            break;
    }
}

async function submit() {
    c1 = document.getElementById('c1c').value;
    c2 = document.getElementById('c2c').value;
    if (req == "") {
        document.getElementById('status').innerHTML = "Klicke zuerst auf eine Funktion";
        return;
    }
    if (c1 == "") {
        document.getElementById('status').innerHTML = "Bitte gib zuerst ein Argument ein";
        return;
    }
    console.log("req: " + req + ", c1: " + c1 + ", c2: " + c2);
    var options;
    document.getElementById('loader').style.display = "block";
    document.getElementById('status').innerHTML = "Sending...";
    if (req == "postclass") {
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "req": req, "c1": c1, "c2": c2 })
        };
    } else {
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "req": req, "c1": c1 })
        };
    }
    const response = await fetch('/api/admin', options);
    const json = await response.json();
    if (json.status == 200) {
        document.getElementById('loader').style.display = "none";
        document.getElementById('status').innerHTML = "status: " + json.status + " response: " + json.data;
    }else if(json.status == 405){
        window.location.href = "/login"
    }else{
        console.log(json)
        document.getElementById('loader').style.display = "none";
        document.getElementById('status').innerHTML = "Failed to reach api, maybe its offline!";
    }
}

setInterval(function() {
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);

/* Dark Mode switch logic */

//Gets a cookie by key
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}

function swichToLight() {
    var pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    console.log("Switching to the light side")
    for (i in pictures) {
        var image = document.getElementById(pictures[i])
        if (image) { image.src = "/static/previews/" + pictures[i] + "Light.png" }
    }
    document.documentElement.setAttribute('data-theme', 'light');
    toggleSwitch.checked = false;
    document.getElementById('checkboxIcon').className = "fas fa-adjust light"
    document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
}

function swichToDark() {
    var pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    console.log("Switching to the dark side")
    for (i in pictures) {
        var image = document.getElementById(pictures[i])
        if (image) { image.src = "/static/previews/" + pictures[i] + "Dark.png" }
    }
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleSwitch.checked = true;
    document.getElementById('checkboxIcon').className = "fas fa-adjust dark"
    document.cookie = "darkmode=true;path=/;domain=zgk.mxis.ch";
}

//Switch theme when slider changes
function switchThemeSlider() {
    if (toggleSwitch.checked) {
        swichToDark()
    } else {
        swichToLight()
    }
}

//Switch between light and dark theme
function switchTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        swichToDark()
    } else {
        swichToLight()
    }
}

//Runs in the beginning. Checks if System Dark mode is on or if preference set in cookie
function detectDarkMode() {
    console.log("Cookie: " + getCookie('darkmode'))
    if (getCookie('darkmode') == 'false') {
        swichToLight()
    } else if (getCookie('darkmode') == 'true') {
        swichToDark()
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        swichToDark()
    } else {
        swichToLight()
    }
    window.matchMedia("(prefers-color-scheme: dark)").addListener(e => e.matches && switchTheme())
    window.matchMedia("(prefers-color-scheme: light)").addListener(e => e.matches && switchTheme())
    toggleSwitch.addEventListener('change', switchThemeSlider, false);
}