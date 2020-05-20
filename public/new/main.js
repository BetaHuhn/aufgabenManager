/*  main.js - Maximilian Schiller 2020 */
const out = document.getElementById('out'),
    signin = document.getElementById('signin'),
    textBtn = document.getElementById('textBtn'),
    urlBtn = document.getElementById('urlBtn'),
    fileBtn = document.getElementById('fileBtn'),
    textDiv = document.getElementById('textDiv'),
    urlDiv = document.getElementById('urlDiv'),
    fileDiv = document.getElementById('fileDiv'),
    selectDiv = document.getElementById('selectDiv'),
    uploadBtn = document.getElementById('uploadBtn'),
    submitBtn = document.getElementById('submitBtn'),
    title = document.getElementById('title'),
    copyBtn = document.getElementById('copyBtn'),
    shareBtn = document.getElementById('shareBtn'),
    copyOut = document.getElementById('copyOut'),
    progressDiv = document.getElementById('progressDiv')
var $body = document.getElementsByTagName('body')[0];

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

var last = document.getElementById('fileDiv')

var role;
let activeTab = "aufgabe";

async function authenticate() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const response = await fetch('/api/auth/new', options);
    const json = await response.json();
    if (json.status == 200) {
        role = json.data.role
        if (json.data.classes == null) {
            var el = document.getElementById('klasse');
            var newEl = document.createElement('input');
            newEl.id = 'klasse';
            newEl.placeholder = "klasse";
            newEl.className = 'klasse'
            el.parentNode.replaceChild(newEl, el);
            var el2 = document.getElementById('klasseMeeting');
            var newEl2 = document.createElement('input');
            newEl2.id = 'klasseMeeting';
            newEl2.placeholder = "klasse";
            newEl2.className = 'klasse'
            el2.parentNode.replaceChild(newEl2, el2);
        } else {
            if (json.data.classes.length >= 1) {
                for (i in json.data.classes) {
                    var sel = document.getElementById('klasse');
                    var opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(json.data.classes[i]));
                    opt.value = json.data.classes[i];
                    sel.appendChild(opt);
                    var sel2 = document.getElementById('klasseMeeting');
                    var opt2 = document.createElement('option');
                    opt2.appendChild(document.createTextNode(json.data.classes[i]));
                    opt2.value = json.data.classes[i];
                    sel2.appendChild(opt2);
                }
            } else {
                alert("Fehler: Du bist nicht Mitglied einer Klasse. Bitte melde dich erneut an")
                var message = createElement('div', 'message', 'message')
                last.parentElement.appendChild(message)
                message.innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
                window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
            }
        }
        loadTab();
    } else if (json.status == 405) {
        var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
        document.getElementById('loader').style.display = "none";
        document.getElementById('user').style.display = "block";
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    } else {
        var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
        document.getElementById('loader').style.display = "none";
        document.getElementById('user').style.display = "block";
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    }
}

async function upload() {
    var filledOut = validateForm();
    if (filledOut) {
        const fi = document.getElementById('select-button');
        // Check if any file is selected.
        var ran = false;
        if (fi.files.length > 0) {
            for (i in fi.files) {
                var fsize = fi.files.item(i).size;
                var file = Math.round(fsize);
                if (file >= 52428800) { //50mb
                    if (!ran) {
                        alert("Alter was'n das für ne Datei... max 50mb bitte!");
                        ran = true;
                        return;
                    }
                }
            }
            progressDiv.style.display = "block";
            document.getElementById('error').innerHTML = `<h1>Hochladen...</h1>`;
            document.getElementById('form').style.display = "none";
            var form = document.getElementById('upload');
            var xhr = new XMLHttpRequest(); // create XMLHttpRequest
            var data = new FormData(form); // create formData object
            data.append("filename", document.getElementById('name').value);
            data.append("text", document.getElementById('text').value);
            data.append("fach", document.getElementById('fach').value)
            data.append("abgabe", document.getElementById('abgabe').value)
            var e = document.getElementById("klasse");
            if (role == "admin") {
                var klasse = e.value;
            } else {
                var klasse = e.options[e.selectedIndex].value;
            }
            data.append("klasse", klasse)
            xhr.upload.addEventListener("progress", function(event) {
                if (event.lengthComputable) {

                    var complete = (event.loaded / event.total * 100 | 0);
                    moveBar(complete)
                    var loaded = formatBytes(event.loaded).split(" ")[0];
                    var total = formatBytes(event.total);
                    document.getElementById("status").innerHTML = `<p>${loaded}/${total}</p>`;
                }
            });
            xhr.onload = function(Event) {
                progressDiv.style.display = "none";
                document.getElementById('status').style.display = "none";
                if (xhr.status == 200) {
                    var json = JSON.parse(this.responseText)
                    if (json.status == 200) {
                        document.getElementById('heading').style.display = "none";
                        document.getElementById('error').innerHTML = `Aufgabe erfolgreich erstellt!`;
                        window.location.href = "/aufgabe?id=" + json.data._id
                        //document.getElementById('form').style.display = "block";
                    } else if (json.status == 405) {
                        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
                        window.location.replace('/login?ref=new')
                    } else if (json.status == 421) {
                        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt.</p>`
                        document.getElementById('form').style.display = "block";
                    } else if (json.status == 404) {
                        document.getElementById('error').innerHTML = `<p class="message" id="message">Diese Klasse gibt es nicht.</p>`
                        document.getElementById('form').style.display = "block";
                    } else {
                        document.getElementById('error').innerHTML = `Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.`;
                    }
                } else {
                  document.getElementById('error').innerHTML = `Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.`;
                }

            }
            xhr.open("post", form.action); // open connection
            xhr.send(data);
        } else {
            document.getElementById('error').innerHTML = `<p class="message" id="message">Hochladen...</h1>`;
            document.getElementById('form').style.display = "none";
            var e = document.getElementById("klasse");
            if (role == "admin") {
                var klasse = e.value;
            } else {
                var klasse = e.options[e.selectedIndex].value;
            }
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: document.getElementById('text').value, filename: document.getElementById('name').value, fach: document.getElementById('fach').value, abgabe: document.getElementById('abgabe').value, klasse: klasse })
            };
            const response = await fetch('/api/new/exercise', options);
            const json = await response.json();
            if (json.status == 200) {
                //(id, name, ip, send, receive, lastHandshake, createdAt, pub, priv){
                document.getElementById('heading').style.display = "none";
                document.getElementById('error').innerHTML = `Aufgabe erfolgreich erstellt!`;
                window.location.href = "/aufgabe?id=" + json.data._id
            } else if (json.status == 405) {
                document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
                window.location.replace('/login?ref=new')
            } else if (json.status == 421) {
                document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
                document.getElementById('form').style.display = "block";
            } else if (json.status == 404) {
                document.getElementById('error').innerHTML = `<p class="message" id="message">Diese Klasse gibt es nicht.</p>`
                document.getElementById('form').style.display = "block";
            } else {
                document.getElementById('error').innerHTML = `Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.`;
            }
        }
    } else {
        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
        var a = document.getElementById('fach');
        var b = document.getElementById('klasse');
        var c = document.getElementById('text');
        var d = document.getElementById('abgabe');
        var e = document.getElementById('name');
        var array = [a, b, c, d]
        for(i in array){
            if(array[i].value == null || array[i].value == ""){
                array[i].style.border = "1px solid var(--red)"
            }else{
                array[i].style.border = "none"
            }
        }
        alert("Bitte Fülle alle Felder aus (Datei und Datei Name Optional): Fach: " + a.value + " Klasse: " + ((b.value == "Klasse") ? undefined : b.value) + " Text: " + c.value + " Abgabe: " + d.value + " Dateiname: " + e.value);
    }

}

function validateForm() {
    var a = document.getElementById('fach').value;
    var b = document.getElementById('klasse').value;
    var c = document.getElementById('text').value;
    var d = document.getElementById('abgabe').value;
    if ((a == null || a == "") || (b == null || b == "") || (c == null || c == "") || (d == null || d == "") || b == "Klasse") {
        return false;
    } else {
        return true
    }
}

function moveBar(progress) {
    var elem = document.getElementById("progressBar");
    if (progress < 100) {
      elem.style.width = progress + '%';
      elem.innerHTML = progress * 1 + '%';
    }

}

function Filevalidation() {
    const fi = document.getElementById('select-button');
    // Check if any file is selected. 
    if (fi.files.length > 0) {
        var file = 0;
        for (var i = 0; i < fi.files.length; i++) {
            file += Math.round(fi.files.item(i).size)
        }
        // The size of the file.
        if (file >= 52428800) {
            document.getElementById('size').innerHTML = '<b>' +
                formatBytes(file) + '</b> (max. 50MB)';
        } else {
            document.getElementById('size').innerHTML = '<b>' +
                formatBytes(file) + '</b>';
        }
    }
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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

function loadTab(){
    let url = new URL(window.location.href);
    let tab = url.searchParams.get("tab");
    document.getElementById('loader').style.display = "none";
    document.getElementById('user').style.display = "block";
    if(tab != undefined && tab != activeTab){
        switchTab();
    }
}

function switchTab(){
    if(activeTab == "aufgabe"){
        document.getElementById('form').style.display = "none";
        document.getElementById('meeting').style.display = "block";
        document.getElementById('aufgabenTab').classList.remove("activeTab");
        document.getElementById('meetingsTab').classList.add("activeTab");
        activeTab = "meeting";
    }else{
        document.getElementById('form').style.display = "block";
        document.getElementById('meeting').style.display = "none";
        document.getElementById('aufgabenTab').classList.add("activeTab");
        document.getElementById('meetingsTab').classList.remove("activeTab");
        activeTab = "aufgabe";
    }
    let url = new URL(window.location.href);
    let search_params = url.searchParams;
    search_params.set('tab', activeTab);
    url.search = search_params.toString();
    window.history.replaceState(null, null, url)
}

async function createMeeting(){
    var filledOut = validateMeeting();
    if (filledOut) {
        document.getElementById('error').innerHTML = `<p class="message" id="message">Hochladen...</h1>`;
        document.getElementById('meeting').style.display = "none";
        var e = document.getElementById("klasseMeeting");
        if (role == "admin") {
            var klasse = e.value;
        } else {
            var klasse = e.options[e.selectedIndex].value;
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: document.getElementById('showCally').value, subject: document.getElementById('fachMeeting').value, klasse: klasse })
        };
        const response = await fetch('/api/new/meeting', options);
        const json = await response.json();
        if (json.status == 200) {
            //(id, name, ip, send, receive, lastHandshake, createdAt, pub, priv){
            document.getElementById('heading').style.display = "none";
            document.getElementById('error').innerHTML = `Meeting erfolgreich erstellt!`;
            //window.location.href = "/dashboard?tab=meetings";
        } else if (json.status == 405) {
            document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
            window.location.replace('/login?ref=new')
        } else if (json.status == 421) {
            document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
            document.getElementById('meeting').style.display = "block";
        } else if (json.status == 404) {
            document.getElementById('error').innerHTML = `<p class="message" id="message">Diese Klasse gibt es nicht.</p>`
            document.getElementById('meeting').style.display = "block";
        } else {
            document.getElementById('error').innerHTML = `Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.`;
        }
        
    } else {
        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
        var a = document.getElementById('fachMeeting');
        var b = document.getElementById('klasseMeeting');
        var c = document.getElementById('showCally');
        var array = [a, b, c]
        for(i in array){
            if(array[i].value == null || array[i].value == ""){
                array[i].style.border = "1px solid var(--red)"
            }else{
                array[i].style.border = "none"
            }
        }
        alert("Bitte Fülle alle Felder aus (Datei und Datei Name Optional): Fach: " + a.value + " Klasse: " + ((b.value == "Klasse") ? undefined : b.value) + " Termin: " + c.value);
    }
}

function validateMeeting() {
    console.log(document.getElementById('klasseMeeting'))
    var a = document.getElementById('fachMeeting').value;
    var b = document.getElementById('klasseMeeting').value;
    var c = document.getElementById('showCally').value;
    if ((a == null || a == "") || (b == null || b == "") || (c == null || c == "") || b == "Klasse") {
        return false;
    } else {
        return true
    }
}

let cally;
(function(window, document) {
    cally = new Calendary({ lang: "de" });
    let cali = document.getElementById("showCally");
    cally.setCally(new Date());
})(window, document);
  

function AvoidSpace(event) {
    var k = event ? event.which : window.event.keyCode;
    if (k == 32) return false;
}

setInterval(function() {
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);