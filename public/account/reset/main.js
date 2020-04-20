/*  main.js - Maximilian Schiller 2020 */
var copyBtn = document.getElementById('copyBtn');
var copyOut = document.getElementById('copyOut');
var $body = document.getElementsByTagName('body')[0];

/* Darkmode Support */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
detectDarkMode()

var last = document.getElementById('fileDiv')

var role;

async function change(){
    var email = document.getElementById('email').value;
    if(email){
        var error = document.getElementById('error');
        error.innerHTML = "prüfen..."
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: email})
        };
        const response = await fetch('/api/auth/reset/password/request', options);
        const json = await response.json();
        if (json.status == 200) {
            console.log(json);
            var error = document.getElementById('error');
            error.innerHTML = "Wir haben dir eine Email geschickt"
            document.getElementById('form').style.display = "none"
        }else if (json.status == 407){
            var error = document.getElementById('error');
            error.innerHTML = "Bitte fülle alle Felder aus"
            console.log(json)
        }else if (json.status == 404){
            var error = document.getElementById('error');
            error.innerHTML = "Diese Email gibt es nicht"
            console.log(json)
        }else {
            var error = document.getElementById('error');
            error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
            console.log(json)
        }
    }else{
        var error = document.getElementById('error');
        error.innerHTML = "Bitte fülle alle Felder aus"
        console.log("Email field not filled out")
    }
    
}

function AvoidSpace(event) {
    var k = event ? event.which : window.event.keyCode;
    if (k == 32) return false;
}

setInterval(function(){ 
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

//Switch theme when slider changes
function switchThemeSlider() {
    if (toggleSwitch.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('checkboxIcon').className = "fas fa-adjust dark"
        //switchText.innerHTML = "Dark Mode"
        document.cookie = "darkmode=true;path=/;domain=zgk.mxis.ch";
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('checkboxIcon').className = "fas fa-adjust light"
        //switchText.innerHTML = "Light Mode"
        document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
    }
}

//Switch between light and dark theme
function switchTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        //switchText.innerHTML = "Dark Mode"
        toggleSwitch.checked = true;
        document.getElementById('checkboxIcon').className = "fas fa-adjust dark"
        document.cookie = "darkmode=true;path=/;domain=zgk.mxis.ch";
        console.log("Cookie: " + getCookie('darkmode'))
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        //switchText.innerHTML = "Light Mode"
        toggleSwitch.checked = false;
        document.getElementById('checkboxIcon').className = "fas fa-adjust light"
        document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
        console.log("Cookie: " + getCookie('darkmode'))
    }
}

//Runs in the beginning. Checks if System Dark mode is on or if preference set in cookie
function detectDarkMode() {
    console.log("Cookie: " + getCookie('darkmode'))
    if (getCookie('darkmode') == 'false') {
        console.log("Switching to the light side")
        document.documentElement.setAttribute('data-theme', 'light');
        //switchText.innerHTML = "Light Mode";
        toggleSwitch.checked = false;
        document.getElementById('checkboxIcon').className = "fas fa-adjust light"
        document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
    } else if (getCookie('darkmode') == 'true') {
        console.log("Switching to the dark side")
        document.documentElement.setAttribute('data-theme', 'dark');
        //switchText.innerHTML = "Dark Mode";
        toggleSwitch.checked = true;
        document.getElementById('checkboxIcon').className = "fas fa-adjust dark"
        document.cookie = "darkmode=true;path=/;domain=zgk.mxis.ch";
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log("Switching to the dark side")
        document.documentElement.setAttribute('data-theme', 'dark');
        //switchText.innerHTML = "Dark Mode";
        toggleSwitch.checked = true;
        document.getElementById('checkboxIcon').className = "fas fa-adjust dark"
        document.cookie = "darkmode=true;path=/;domain=zgk.mxis.ch";
    } else {
        console.log("Switching to the light side")
        document.documentElement.setAttribute('data-theme', 'light');
        //switchText.innerHTML = "Light Mode";
        toggleSwitch.checked = false;
        document.getElementById('checkboxIcon').className = "fas fa-adjust light"
        document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
    }
    window.matchMedia("(prefers-color-scheme: dark)").addListener(e => e.matches && switchTheme())
    window.matchMedia("(prefers-color-scheme: light)").addListener(e => e.matches && switchTheme())
    toggleSwitch.addEventListener('change', switchThemeSlider, false);
}
