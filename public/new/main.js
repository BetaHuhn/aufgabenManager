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

document.getElementById("loader").style.display = "none";

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

async function upload() {
    var filledOut = validateForm();
    console.log(filledOut)
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
            //document.getElementById("loader").style.display = "block";
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
            console.log(klasse)
            data.append("klasse", klasse)
            console.log(data)
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
                //document.getElementById("loader").style.display = "none";
                progressDiv.style.display = "none";
                document.getElementById('status').style.display = "none";
                if (xhr.status == 200) {
                    var json = JSON.parse(this.responseText)
                    console.log(json);
                    if (json.status == 200) {
                        document.getElementById('heading').style.display = "none";
                        document.getElementById('error').innerHTML = `Aufgabe erfolgreich erstellt! <a href="/new">Noch eine erstellen</a>`;
                        //document.getElementById('form').style.display = "block";
                    } else if (json.status == 405) {
                        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
                        window.location.replace('/login')
                    } else if (json.status == 421) {
                        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
                        document.getElementById('form').style.display = "block";
                    } else {
                        document.getElementById('error').innerHTML = `Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.`;
                    }
                } else {
                    console.log(xhr.status)
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
                document.getElementById('error').innerHTML = `Aufgabe erfolgreich erstellt! <a href="/new">Noch eine erstellen</a>`;
                document.getElementById('heading').style.display = "none";
            } else if (json.status == 405) {
                console.log(json);
                document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
                window.location.replace('/login')
            } else if (json.status == 421) {
                document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
                document.getElementById('form').style.display = "block";
            } else {
                document.getElementById('error').innerHTML = `Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.`;
            }
        }
    } else {
        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht alle Felder ausgefüllt</p>`
        alert("Bitte Fülle alle Felder aus (Datei und Datei Name Optional)");
    }

}

function moveBar(progress) {
    var elem = document.getElementById("progressBar");
    if (progress >= 100) {
        console.log("finished")
    } else {
        elem.style.width = progress + '%';
        elem.innerHTML = progress * 1 + '%';
    }

}

function Filevalidation() {
    const fi = document.getElementById('select-button');
    // Check if any file is selected. 
    if (fi.files.length > 0) {
        console.log(fi.files)
        for (i in fi.files) {
            var fsize = fi.files.item(i).size;
            var file = Math.round(fsize);
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
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


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
        console.log(json);
        role = json.data.role
        if (json.data.classes == null) {
            var el = document.getElementById('klasse');
            var newEl = document.createElement('input');
            newEl.id = 'klasse';
            newEl.placeholder = "klasse";
            newEl.className = 'klasse'
                // replace el with newEL
            el.parentNode.replaceChild(newEl, el);
        } else {
            for (i in json.data.classes) {
                console.log(json.data.classes[i])
                var sel = document.getElementById('klasse');
                var opt = document.createElement('option');
                opt.appendChild(document.createTextNode(json.data.classes[i]));
                opt.value = json.data.classes[i];
                sel.appendChild(opt);
            }
        }
        //   var text = createElement('p', 'message', 'message', "Hallo!")
        //   text.id = 'message'
        //   last.parentElement.appendChild(text)
    } else if (json.status == 405) {
        console.log(json);
        var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
        window.location.replace('/login')
    } else {
        var message = createElement('div', 'message', 'message')
        last.parentElement.appendChild(message)
        message.innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
        window.location.replace('/login')
    }
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