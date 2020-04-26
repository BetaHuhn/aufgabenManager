/* main.js - Maximilian Schiller 2020 */

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

/* Darkmode Support */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
detectDarkMode()

var data;
var last = document.getElementById('legend')
var numAufgaben = 0;

var role;
var user_id;

async function auth() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const response = await fetch('/api/auth', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        var login = document.getElementById('login');
        login.href = "/logout"
        login.innerHTML = "Logout"
        var hero = document.getElementById('heroBtn');
        hero.href = "/aufgaben"

    } else {
        console.log("not logged in")
        /* var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Du bist nicht angemeldet</p>`
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search) */
    }
}

function switchPreview(e){
    if(e.id == "teacher"){
        e.id = "student";
        document.getElementById('buttonText').innerHTML = "Zur Lehrer Ansicht";
        document.getElementById('previewText').innerHTML = "Schüler können ganz einfach Lösungen für eine Aufgabe hochladen.";
        document.getElementById('AufgabeLehrer').src = toggleSwitch.checked ? "/static/previews/AufgabeDark.png" : "/static/previews/AufgabeLight.png"
        document.getElementById('AufgabeLehrer').id = "Aufgabe"

    }else{
        e.id = "teacher";
        document.getElementById('buttonText').innerHTML = "Zur Schüler Ansicht";
        document.getElementById('previewText').innerHTML = "Lehrer sehen in einer übersichtlichen Tabelle wer bereits eine Lösung abgegeben hat. Mit einem Klick ist diese dann heruntergeladen.";
        document.getElementById('Aufgabe').src = toggleSwitch.checked ? "/static/previews/AufgabeLehrerDark.png" : "/static/previews/AufgabeLehrerLight.png"
        document.getElementById('Aufgabe').id = "AufgabeLehrer"
    }
}

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

function swichToLight(){
    var pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    console.log("Switching to the light side")
    for(i in pictures){
        var image = document.getElementById(pictures[i])
        if(image) { image.src = "/static/previews/" + pictures[i] + "Light.png" }
    }
    document.documentElement.setAttribute('data-theme', 'light');
    toggleSwitch.checked = false;
    document.getElementById('checkboxIcon').className = "fas fa-adjust light"
    document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
}

function swichToDark(){
    var pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    console.log("Switching to the dark side")
    for(i in pictures){
        var image = document.getElementById(pictures[i])
        if(image) { image.src = "/static/previews/" + pictures[i] + "Dark.png" }
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