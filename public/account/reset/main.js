/*  main.js - Maximilian Schiller 2020 */
let copyBtn = document.getElementById('copyBtn');
let copyOut = document.getElementById('copyOut');
let $body = document.getElementsByTagName('body')[0];

let last = document.getElementById('fileDiv')

let role;

async function change() {
    let email = document.getElementById('email').value;
    if (email) {
        let error = document.getElementById('error');
        error.innerHTML = "prüfen..."
        document.getElementById('loader').style.display = "inline-block"
        document.getElementById('form').style.display = "none"
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        };
        const response = await fetch('/api/auth/reset/password/request', options);
        const json = await response.json();
        if (json.status == 200) {
            let error = document.getElementById('error');
            error.innerHTML = "Wir haben dir eine Email geschickt"
            document.getElementById('loader').style.display = "none"
        } else if (json.status == 407) {
            let error = document.getElementById('error');
            error.innerHTML = "Bitte fülle alle Felder aus"
            document.getElementById('loader').style.display = "none"
            document.getElementById('form').style.display = "block"
        } else if (json.status == 404) {
            let error = document.getElementById('error');
            error.innerHTML = "Diese Email gibt es nicht"
            document.getElementById('loader').style.display = "none"
            document.getElementById('form').style.display = "block"
        } else {
            let error = document.getElementById('error');
            error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
            document.getElementById('loader').style.display = "none"
            document.getElementById('form').style.display = "block"
        }
    } else {
        let error = document.getElementById('error');
        error.innerHTML = "Bitte fülle alle Felder aus"
    }

}

function AvoidSpace(event) {
    let k = event ? event.which : window.event.keyCode;
    if (k == 32) return false;
}

setInterval(function() {
    let dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);