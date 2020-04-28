/*  main.js - Maximilian Schiller 2020 */
var copyBtn = document.getElementById('copyBtn');
var copyOut = document.getElementById('copyOut');
var $body = document.getElementsByTagName('body')[0];

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

var last = document.getElementById('fileDiv')

var role;

function validateForm() {
    var a = document.getElementById('fach').value;
    var b = document.getElementById('klasse').value;
    var c = document.getElementById('text').value;
    var d = document.getElementById('abgabe').value;
    console.log("a: " + a + " b: " + b + " c: " + c + " d: " + d)
    if (a == null || a == "", b == null || b == "", c == null || c == "", d == null || d == "" || b == "Klasse") {
        //console.log(false)
        return false;
    } else {
        //console.log(true)
        return true
    }
}

async function authenticate() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const response = await fetch('/api/auth/account', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        role = json.data.role
        if (role == "user") {
            var newReiter = document.getElementById('new');
            newReiter.style.display = 'none'
        }
        var name = document.getElementById('name');
        name.appendChild(document.createTextNode(json.data.name))
        var botKey = document.getElementById('botKey');
        botKey.appendChild(document.createTextNode(json.data.botKey))
        if (json.data.classes == null) {
            var sel = document.getElementById('klassen');
            var opt = document.createElement('li');
            opt.appendChild(document.createTextNode("Admin"));
            sel.appendChild(opt);
        } else {
            var a = document.getElementById("telegram-link");
            /* var data = {
                token: json.data.botKey,
                classes: [json.data.classes[0]._id]
            }
            console.log(data)
            var base64 = window.btoa(JSON.stringify(data))
            console.log(base64) */
            a.className = "link"
            a.href = "https://zgk.mxis.ch/t/" + json.data.botKey //https://t.me/zgkmsgbot?startgroup=" + base64
            a.innerHTML = "https://zgk.mxis.ch/t/" + json.data.botKey
                /* for(i in json.data.classes){
                    console.log(json.data.classes[i])
                    var sel = document.getElementById('klassen');
                    var opt = document.createElement('li');
                    var checkbox = document.createElement('input')
                    checkbox.type = "checkbox"
                    checkbox.id = json.data.classes[i]
                    checkbox.value = json.data.classes[i]
                    checkbox.className = "checkbox"
                    var label = document.createElement("label")
                    label.innerHTML = "zu " + json.data.classes[i] + " hinzufügen"
                    label.for = json.data.classes[i]
                    label.className = "label"
                    opt.appendChild(checkbox);
                    opt.appendChild(label)
                    sel.appendChild(opt);
                } */
        }
        //   var text = createElement('p', 'message', 'message', "Hallo!")
        //   text.id = 'message'
        //   last.parentElement.appendChild(text)
        document.getElementById('loader').style.display = "none";
        document.getElementById('user').style.display = "block";
    } else if (json.status == 405) {
        console.log(json);
        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
        document.getElementById('loader').style.display = "none";
        document.getElementById('user').style.display = "block";
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    } else {
        document.getElementById('error').innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
        document.getElementById('loader').style.display = "none";
        document.getElementById('user').style.display = "block";
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    }
}

var retryIn = 0;

async function change() {
    document.getElementById('loader').style.display = "inline-block";
    var oldPassword = document.getElementById('oldPassword').value;
    var newPassword = document.getElementById('newPassword').value;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword })
    };
    const response = await fetch('/api/auth/change/password', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        var error = document.getElementById('error');
        error.innerHTML = "Passwort wurde geändert"
        document.getElementById('loader').style.display = "none";
        //window.location.replace('/account');
    } else if (json.status == 408) {
        var error = document.getElementById('error');
        error.innerHTML = "Falsches Passwort"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    } else if (json.status == 407) {
        var error = document.getElementById('error');
        error.innerHTML = "Bitte fülle beide Felder aus"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    } else if (json.status == 406) {
        var error = document.getElementById('error');
        error.innerHTML = "Das Passwort ist zu kurz (min 8)"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    } else if (json.status == 405) {
        var error = document.getElementById('error');
        error.innerHTML = "Das Passwort ist zu lang (max 20)"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    } else if (json.status == 402) {
        var error = document.getElementById('error');
        error.innerHTML = "Das Passwort darf keine Lücken enthalten"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    } else if (json.status == 403) {
        var error = document.getElementById('error');
        error.innerHTML = "Bitte melde dich zuerst an"
        document.getElementById('loader').style.display = "none";
        window.location.replace("/login")
        console.log(json)
    } else if (json.status == 401) {
        var error = document.getElementById('error');
        error.innerHTML = "Bitte benutze ein anderes Passwort"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    }else if (json.status == 429) {
        retryIn = json.error.retryIn;
        var error = document.getElementById('error');
        error.innerHTML = "Zu viele Login Versuche, bitte warte " + formatTime(json.error.retryIn)
        document.getElementById('changeBtn').disabled = true;
        document.getElementById('loader').style.display = "none";
        console.log(json)
        var countdown = setInterval(function() {
            retryIn = retryIn - 1000;
            if(retryIn <= 0){
                clearInterval(countdown)
                document.getElementById('changeBtn').disabled = false;
                return error.innerHTML = ""
            }
            error.innerHTML = "Zu viele Anfragen, bitte warte " + formatTime(retryIn)

        }, 1000);
    } else {
        var error = document.getElementById('error');
        error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
        document.getElementById('loader').style.display = "none";
        console.log(json)
    }

}

function formatTime(d1) {
    var a = d1 / 1000;
  	if (a >= 86400) return Math.floor(a/86400) + ' D';
  	var labels=["Sekunden","Minuten","Stunden"];
  	var p = Math.floor((Math.log(a) / Math.log(60)));
  	return Math.floor(a/Math.pow(60,p)) + " " + labels[p];
}

function copy(resp) {
    var $tempInput = document.createElement('INPUT');
    $body.appendChild($tempInput);
    $tempInput.setAttribute('value', resp)
    $tempInput.select();
    document.execCommand('copy');
    $body.removeChild($tempInput);
    copyBtn.setAttribute('class', 'btn btn--primary uppercase copy');
    copyBtn.innerHTML = 'Copied!';
}

function createElement(elem, className, id, text, title) {
    var element = document.createElement(elem);
    element.className = className;
    if (elem == 'p') {
        var node = document.createTextNode(text);
        element.appendChild(node);
    } else if (elem == 'img') {
        element.src = text
        element.title = title
    } else if (elem == 'input') {
        element.placeholder = text
    } else if (elem == 'div' && className == "device parent") {
        element.id = id;
    } else if (elem == 'a') {
        element.href = id;
        var node = document.createTextNode(text);
        element.appendChild(node);
    }
    return element
}

function AvoidSpace(event) {
    var k = event ? event.which : window.event.keyCode;
    if (k == 32) return false;
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