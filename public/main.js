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
    const response = await fetch('/api/get/home', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        user_id = json.user._id;
        console.log(user_id)
        role = json.user.role
        if (role == 'user') {
            console.log("user")
            var newReiter = document.getElementById('new');
            newReiter.style.display = 'none'
        }
        if (json.data.length >= 1) {
            var numAufgaben = json.data.length;
            for (i in json.data) {
                var aufgabe = json.data[i]
                    //console.log(aufgabe.files)
                var abgabe = new Date(aufgabe.deadline)
                var row = createRow(aufgabe._id, aufgabe.subject, aufgabe.class, abgabe.toLocaleDateString(), aufgabe.text, aufgabe.downloads, aufgabe.files, aufgabe.user_id)
                last.parentElement.appendChild(row);
                last = row;
            }
            console.log(numAufgaben + " aufgaben")
        } else {
            var text = createElement('p', 'message', 'message', "Aktuell keine Aufgaben")
            text.id = 'message'
            last.parentElement.appendChild(text)
        }
        if (role != 'user') {
            var button = document.createElement('button')
            button.className = 'addButton';
            button.onclick = function() { window.location.replace('/new') };
            button.innerHTML = 'Aufgabe erstellen';
            button.id = "addBtn"
            last.parentElement.appendChild(button);
        }
    } else if (json.status == 405) {
        console.log(json);
        var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    } else {
        var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    }
}

function createRow(id, fach, klasse, abgabe, text, downloads, file, aufgabeUserId) {
    //console.log(file)
    var div = createElement('div', 'device parent', id)
    div.onclick = function() { window.location.replace("/aufgabe?id=" + id); }
    div.style.cursor = "pointer";
    var pName = createElement('p', 'child text name', id, fach + ' (' + klasse + ')')
    pName.onclick = function(e) { e.stopPropagation(); }
    pName.style.cursor = "text";
    div.appendChild(pName)

    var abgabe = createElement('p', 'child text', id, abgabe)
    abgabe.onclick = function(e) { e.stopPropagation(); }
    abgabe.style.cursor = "text";
    pName.parentElement.appendChild(abgabe)

    var text = createElement('p', 'child aufgabe', id, text)
    text.onclick = function(e) { e.stopPropagation(); }
    text.style.cursor = "text";
    abgabe.parentElement.appendChild(text)

    var downloads = createElement('span', 'child downloads', id, downloads + " Downloads")
    downloads.onclick = function(e) { e.stopPropagation(); }
    downloads.style.cursor = "text";
    text.parentElement.appendChild(downloads)

    var files = createElement('div', 'child stack', id)
    files.onclick = function(e) { e.stopPropagation(); }
    files.style.cursor = "text";
    downloads.parentElement.appendChild(files)
    if (file.count == 1) {
        var count = file.count + " Datei:";
        var name = file.fileName + '.' + file.type;
    } else if (file.count == 0) {
        var count = file.count + " Dateien:"
        var name = "keine Dateien"
    } else {
        var count = file.count + " Dateien:"
        var name = file.fileName + '.' + file.type;
    }
    files.innerHTML = `
  <p class="blue" id="${id}">${count}</p>
  <p class="grey" id="${id}">${name}</p>`
    var buttonStack = createElement('div', 'child buttons', id)
    files.parentElement.appendChild(buttonStack)
    buttonStack.innerHTML = `
  <button onclick="download(this);" id="${id}">Download</button>
  <a id="link_${id}" href="${file.fileUrl}" style="pointer-events: none;" hidden="">Download</a>`
    console.log("Aufgabe von: " + aufgabeUserId + " User ID: " + user_id + " Role: " + role)
    if (role != 'user') {
        if (user_id == aufgabeUserId || role == 'admin') {
            console.log(true)
            var removeDiv = createElement('div', 'child deleteButton', id)
            removeDiv.onclick = function(e) {
                remove(id);
                e.stopPropagation();
                window.event.cancelBubble = true;
            };
            buttonStack.parentElement.appendChild(removeDiv)
            removeDiv.innerHTML = `<span id="${id}" class="fas fa-trash deleteIcon"></span>`
        }
    }
    return div;
}

function createElement(elem, className, id, text, title) {
    var element = document.createElement(elem);
    element.className = className;
    if (elem == 'p' || elem == 'span') {
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

async function remove(id) {
    console.log(id)
    var check = confirm('Bist du sicher, dass du die Aufgabe löschen willst?');
    if (check) {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        };
        const response = await fetch('/api/delete/exercise?id=' + id, options);
        const json = await response.json();
        if (json.status == 200) {
            numAufgaben = numAufgaben - 1;
            var div = document.getElementById(id)
            div.parentNode.removeChild(div);
            if (numAufgaben == 0) {
                last = document.getElementById('legend')
                var text = createElement('p', 'message', 'message', "Aktuell keine Aufgaben")
                text.id = 'message'
                document.getElementById('dashboard').insertBefore(text, document.getElementById('addBtn'))
            }
        } else {
            var text = createElement('p', 'message', 'message', "Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal")
            text.id = 'message'
            document.getElementById('dashboard').insertBefore(text, document.getElementById('addBtn'))
        }
    }
}

function download(e) {
    console.log(e.id)
    event.cancelBubble = true;
    if (event.stopPropagation) event.stopPropagation();
    console.log("Donwloading: " + e.id)
    var link = document.getElementById('link_' + e.id).href;
    if (link != undefined) {
        window.open(link, "_blank");
    }
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