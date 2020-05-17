/*  main.js - Maximilian Schiller 2020 */
let copyBtn = document.getElementById('copyBtn');
let copyOut = document.getElementById('copyOut');
let $body = document.getElementsByTagName('body')[0];

function myFunction() {
    let x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

let last = document.getElementById('fileDiv')

let role;
let activeTab = "password"

function validateForm() {
    let a = document.getElementById('fach').value;
    let b = document.getElementById('klasse').value;
    let c = document.getElementById('text').value;
    let d = document.getElementById('abgabe').value;
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
        role = json.data.role
        if (role == "user") {
            let newReiter = document.getElementById('new');
            newReiter.style.display = 'none'
        }
        let name = document.getElementById('name');
        name.appendChild(document.createTextNode(json.data.name))
        let botKey = document.getElementById('botKey');
        botKey.appendChild(document.createTextNode(json.data.botKey))
        if (json.data.classes == null) {
            let sel = document.getElementById('klassen');
            let opt = document.createElement('li');
            opt.appendChild(document.createTextNode("Admin"));
            sel.appendChild(opt);
        } else {
            let a = document.getElementById("telegram-link");
            /* let data = {
                token: json.data.botKey,
                classes: [json.data.classes[0]._id]
            }
            console.log(data)
            let base64 = window.btoa(JSON.stringify(data))
            console.log(base64) */
            a.className = "link"
            a.href = "https://zgk.mxis.ch/t/" + json.data.botKey //https://t.me/zgkmsgbot?startgroup=" + base64
            a.innerHTML = "https://zgk.mxis.ch/t/" + json.data.botKey
                /* for(i in json.data.classes){
                    console.log(json.data.classes[i])
                    let sel = document.getElementById('klassen');
                    let opt = document.createElement('li');
                    let checkbox = document.createElement('input')
                    checkbox.type = "checkbox"
                    checkbox.id = json.data.classes[i]
                    checkbox.value = json.data.classes[i]
                    checkbox.className = "checkbox"
                    let label = document.createElement("label")
                    label.innerHTML = "zu " + json.data.classes[i] + " hinzufügen"
                    label.for = json.data.classes[i]
                    label.className = "label"
                    opt.appendChild(checkbox);
                    opt.appendChild(label)
                    sel.appendChild(opt);
                } */
        }
        //   let text = createElement('p', 'message', 'message', "Hallo!")
        //   text.id = 'message'
        //   last.parentElement.appendChild(text)
        loadTab();
        document.getElementById('loader').style.display = "none";
        document.getElementById('user').style.display = "block";
    } else if (json.status == 405) {
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

let retryIn = 0;

async function change() {
    document.getElementById('loader').style.display = "inline-block";
    let oldPassword = document.getElementById('oldPassword').value;
    let newPassword = document.getElementById('newPassword').value;
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
        let error = document.getElementById('error');
        error.innerHTML = "Passwort wurde geändert"
        document.getElementById('loader').style.display = "none";
        //window.location.replace('/account');
    } else if (json.status == 408) {
        let error = document.getElementById('error');
        error.innerHTML = "Falsches Passwort"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 407) {
        let error = document.getElementById('error');
        error.innerHTML = "Bitte fülle beide Felder aus"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 406) {
        let error = document.getElementById('error');
        error.innerHTML = "Das Passwort ist zu kurz (min 8)"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 405) {
        let error = document.getElementById('error');
        error.innerHTML = "Das Passwort ist zu lang (max 20)"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 402) {
        let error = document.getElementById('error');
        error.innerHTML = "Das Passwort darf keine Lücken enthalten"
        document.getElementById('loader').style.display = "none";
    } else if (json.status == 403) {
        let error = document.getElementById('error');
        error.innerHTML = "Bitte melde dich zuerst an"
        document.getElementById('loader').style.display = "none";
        window.location.replace("/login")
    } else if (json.status == 401) {
        let error = document.getElementById('error');
        error.innerHTML = "Bitte benutze ein anderes Passwort"
        document.getElementById('loader').style.display = "none";
    }else if (json.status == 429) {
        retryIn = json.error.retryIn;
        let error = document.getElementById('error');
        error.innerHTML = "Zu viele Login Versuche, bitte warte " + formatTime(json.error.retryIn)
        document.getElementById('changeBtn').disabled = true;
        document.getElementById('loader').style.display = "none";
        let countdown = setInterval(function() {
            retryIn = retryIn - 1000;
            if(retryIn <= 0){
                clearInterval(countdown)
                document.getElementById('changeBtn').disabled = false;
                return error.innerHTML = ""
            }
            error.innerHTML = "Zu viele Anfragen, bitte warte " + formatTime(retryIn)

        }, 1000);
    } else {
        let error = document.getElementById('error');
        error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
        document.getElementById('loader').style.display = "none";
    }

}

function formatTime(d1) {
    let a = d1 / 1000;
  	if (a >= 86400) return Math.floor(a/86400) + ' D';
  	let labels=["Sekunden","Minuten","Stunden"];
  	let p = Math.floor((Math.log(a) / Math.log(60)));
  	return Math.floor(a/Math.pow(60,p)) + " " + labels[p];
}

function copy(resp) {
    let $tempInput = document.createElement('INPUT');
    $body.appendChild($tempInput);
    $tempInput.setAttribute('value', resp)
    $tempInput.select();
    document.execCommand('copy');
    $body.removeChild($tempInput);
    copyBtn.setAttribute('class', 'btn btn--primary uppercase copy');
    copyBtn.innerHTML = 'Copied!';
}

function createElement(elem, className, id, text, title) {
    let element = document.createElement(elem);
    element.className = className;
    if (elem == 'p') {
        let node = document.createTextNode(text);
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
        let node = document.createTextNode(text);
        element.appendChild(node);
    }
    return element
}

function loadTab(){
    let url = new URL(window.location.href);
    let tab = url.searchParams.get("tab");
    if(tab != undefined && tab != activeTab){
        switchTab();
    }
}

function switchTab(){
    if(activeTab == "password"){
        document.getElementById('passwordTab').classList.remove("activeTab");
        document.getElementById('botTab').classList.add("activeTab");
        document.getElementById('password').style.display = "none";
        document.getElementById('bot').style.display = "block";
        activeTab = "bot";
    }else{
        document.getElementById('passwordTab').classList.add("activeTab");
        document.getElementById('botTab').classList.remove("activeTab");
        document.getElementById('password').style.display = "block";
        document.getElementById('bot').style.display = "none";
        activeTab = "password";
        
    }
    let url = new URL(window.location.href);
    let search_params = url.searchParams;
    search_params.set('tab', activeTab);
    url.search = search_params.toString();
    window.history.replaceState(null, null, url)
}

function AvoidSpace(event) {
    let k = event ? event.which : window.event.keyCode;
    if (k == 32) return false;
}

setInterval(function() {
    let dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);