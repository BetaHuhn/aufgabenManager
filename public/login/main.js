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
if (!check) {
    document.getElementById('login').style.display = "none"
    var error = document.getElementById('error');
    error.innerHTML = '<p>Fehler, Cookies sind blockiert. <a href="https://enablecookies.info/de/">Hier</a> ist eine Anleitung wie du sie aktivierst</p>'
    alert("Hinweis: Damit wir dich anmelden können musst du Cookies erlauben.")
}

var url_string = window.location.href; //window.location.href
var url = new URL(url_string);
var ref = url.searchParams.get("ref")

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
        window.location.href = "/dashboard"
        document.getElementById('loader').style.display = "none";
    } else {
        document.getElementById('loader').style.display = "none";
        document.getElementById('container').style.display = "block";
    }
}

auth()

var retryIn = 0;

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
    } else if (json.status == 416) {
        var error = document.getElementById('error');
        error.innerHTML = "Diesen Benutzer gibt es nicht"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 429) {
        retryIn = json.error.retryIn;
        var error = document.getElementById('error');
        error.innerHTML = "Zu viele Login Versuche, bitte warte " + formatTime(json.error.retryIn)
        document.getElementById('loginBtn').disabled = true;
        document.getElementById('loader').style.display = "none";
        var countdown = setInterval(function() {
            retryIn = retryIn - 1000;
            if(retryIn <= 0){
                clearInterval(countdown)
                document.getElementById('loginBtn').disabled = false;
                return error.innerHTML = ""
            }
            error.innerHTML = "Zu viele Login Versuche, bitte warte " + formatTime(retryIn)

        }, 1000);
    } else if (json.status == 200) {
        var error = document.getElementById('error');
        error.innerHTML = "Login erfolgreich"
        document.getElementById('loader').style.display = "none";
        if (ref != undefined) {
            window.location.replace(ref)
        } else {
            window.location.replace('/dashboard')
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

function formatTime(d1) {
    var a = d1 / 1000;
  	if (a >= 86400) return Math.floor(a/86400) + ' D';
  	var labels=["Sekunden","Minuten","Stunden"];
  	var p = Math.floor((Math.log(a) / Math.log(60)));
  	return Math.floor(a/Math.pow(60,p)) + " " + labels[p];
}

setInterval(function() {
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);