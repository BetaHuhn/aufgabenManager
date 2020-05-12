/* main.js - Maximilian Schiller 2020 */

function myFunction() {
    let x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/service-worker.js'); }

let data;
let last = document.getElementById('legend')
let numAufgaben = 0;

let role;
let user_id;

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
        const login = document.getElementById('login');
        login.href = "/logout"
        login.innerHTML = "Logout"
        const hero = document.getElementById('heroBtn');
        hero.href = "/aufgaben"

    } else {
        console.log("not logged in")
        /* let message = createElement('div', 'message', 'message')
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

