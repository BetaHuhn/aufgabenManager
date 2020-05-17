/* main.js - Maximilian Schiller 2020 */

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

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

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
        document.getElementById('user').style.display = "block";
    }
}

auth()

var url_string = window.location.href;
var url = new URL(url_string);
var token = url.searchParams.get("token")
if (token == undefined || token == null) {
    document.getElementById('register').style.display = 'block';
    document.getElementById('user').style.height = '90px'
    document.getElementById('error').innerHTML = 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: <a href="mailto:zgk@mxis.ch?subject=Invite Link Anfrage">zgk@mxis.ch</a>'
} else {
    var input = document.getElementById("password");
    input.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("loginBtn").click();
        }
    });
}

var retryIn = 0;

async function createUser() {
    if (token != undefined) {
        document.getElementById('loader').style.display = "inline-block"
        var name = document.getElementById('name').value;
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, name: name, password: password, token: token })
        };
        const response = await fetch('/auth/register', options);
        const json = await response.json();
        if (json.status == 200) {
            var error = document.getElementById('error');
            error.innerHTML = "Register successfull"
            document.getElementById('loader').style.display = "none"
            window.location.replace('/dashboard');
        } else if (json.status == 408) {
            var error = document.getElementById('error');
            error.innerHTML = "Bitte fülle alle Felder aus"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 407) {
            var error = document.getElementById('error');
            error.innerHTML = "Bitte gib eine echte Email Adresse ein"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 410) {
            var error = document.getElementById('error');
            error.innerHTML = '<p>Diese Email wird bereits verwendet. Wenn das deine ist, setze <a href="https://zgk.mxis.ch/account/reset/">hier</a> dein Passwort zurück</p>'
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 406) {
            var error = document.getElementById('error');
            error.innerHTML = "Das Passwort ist zu kurz (min 8)"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 405) {
            var error = document.getElementById('error');
            error.innerHTML = "Das Passwort ist zu lang (max 20)"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 404) {
            var error = document.getElementById('error');
            error.innerHTML = "Das Passwort darf keine Lücken enthalten"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 401) {
            var error = document.getElementById('error');
            error.innerHTML = "Der Invite Link ist abgelaufen oder wurde zu oft benutzt"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 403) {
            var error = document.getElementById('error');
            error.innerHTML = "Der Invite Link existiert nicht"
            document.getElementById('loader').style.display = "none"
        }else if (json.status == 429) {
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
                error.innerHTML = "Zu viele Anfragen, bitte warte " + formatTime(retryIn)
            }, 1000);
        } else {
            var error = document.getElementById('error');
            error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
            document.getElementById('loader').style.display = "none"
        }
    }
}

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