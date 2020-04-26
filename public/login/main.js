//main.js

function checkCookie() {
    // Quick test if browser has cookieEnabled host property
    if (navigator.cookieEnabled) return true;
    // Create cookie
    document.cookie = "cookietest=1";
    var ret = document.cookie.indexOf("cookietest=") != -1;
    // Delete cookie
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
    return ret;
}

var check = checkCookie();
console.log(check)
if (!check) {
    console.log("Cookies not enabled")
    document.getElementById('login').style.display = "none"
    var error = document.getElementById('error');
    error.innerHTML = '<p>Fehler, Cookies sind blockiert. <a href="https://enablecookies.info/de/">Hier</a> ist eine Anleitung wie du sie aktivierst</p>'
    alert("Hinweis: Damit wir dich anmelden können musst du Cookies erlauben.")
}


/* Darkmode Support */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
detectDarkMode()

var url_string = window.location.href; //window.location.href
var url = new URL(url_string);
var ref = url.searchParams.get("ref")
console.log("Ref: " + ref)

async function auth() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const response = await fetch('/api/auth', options);
    const json = await response.json();
    if (json.status == 200) {
        var error = document.getElementById('error');
        error.innerHTML = "Du bist bereits angemeldet"
        window.location.href = "/aufgaben"
        document.getElementById('loader').style.display = "none";
    } else {
        console.log("not logged in")
        document.getElementById('loader').style.display = "none";
        document.getElementById('container').style.display = "block";
    }
}

auth()

async function login() {
    document.getElementById('loader').style.display = "inline-block";
    var password = document.getElementById('password').value;
    var email = document.getElementById('email').value;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: password, email: email })
    };
    const response = await fetch('/auth/login', options);
    const json = await response.json();
    if (json.status == 408) {
        var error = document.getElementById('error');
        error.innerHTML = "Falsches Passwort"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 405) {
        var error = document.getElementById('error');
        error.innerHTML = "Diesen Benutzer gibt es nicht"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 200) {
        console.log(json);
        var error = document.getElementById('error');
        error.innerHTML = "Login erfolgreich"
        document.getElementById('loader').style.display = "none";
        if (ref != undefined) {
            console.log(ref)
            window.location.replace(ref)
        } else {
            window.location.replace('/aufgaben')
        }
    } else {
        var error = document.getElementById('error');
        error.innerHTML = "Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal."
        document.getElementById('loader').style.display = "none";
    }
}

var input = document.getElementById("password");
input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("loginBtn").click();
    }
});

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