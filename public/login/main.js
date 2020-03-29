//main.js
function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

var url_string = window.location.href; //window.location.href
var url = new URL(url_string);
var ref = url.searchParams.get("ref")
console.log("Ref: " + ref)

async function login() {
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
    } else if (json.status == 402) {
        var error = document.getElementById('error');
        error.innerHTML = "Sorry, den Benutzer gibt's nicht"
    } else if (json.status == 200) {
        console.log(json);
        var error = document.getElementById('error');
        error.innerHTML = "Login erfolgreich"
        if (ref != undefined) {
            console.log(ref)
            window.location.replace(ref)
        } else {
            window.location.replace('/')
        }
    } else {
        var error = document.getElementById('error');
        error.innerHTML = "Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal."
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