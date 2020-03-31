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
    }else{
        //console.log(true)
        return true
    }
}

async function authenticate(){
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
        if(role == "user"){
            var newReiter = document.getElementById('new');
            newReiter.style.display = 'none'
        }
        var name = document.getElementById('name');
        name.appendChild(document.createTextNode(json.data.name))
        var botKey = document.getElementById('botKey');
        botKey.appendChild(document.createTextNode(json.data.botKey))
        if(json.data.klassen == null){
            var sel = document.getElementById('klassen');
            var opt = document.createElement('li');
            opt.appendChild(document.createTextNode("Admin"));
            sel.appendChild(opt);
        }else{
            for(i in json.data.klassen){
                console.log(json.data.klassen[i])
                var sel = document.getElementById('klassen');
                var opt = document.createElement('li');
                opt.appendChild( document.createTextNode(json.data.klassen[i]) );
                sel.appendChild(opt);
            }
        }
        //   var text = createElement('p', 'message', 'message', "Hallo!")
        //   text.id = 'message'
        //   last.parentElement.appendChild(text)
    } else if (json.status == 405) {
        console.log(json);
        document.getElementById('error').innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
        window.location.replace('/login')
    }else {
        document.getElementById('error').innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
        window.location.replace('/login')
    }
}

async function change(){
    var oldPassword = document.getElementById('oldPassword').value;
    var newPassword = document.getElementById('newPassword').value;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({oldPassword: oldPassword, newPassword: newPassword})
    };
    const response = await fetch('/api/auth/change/password', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        var error = document.getElementById('error');
        error.innerHTML = "Passwort wurde geändert"
        window.location.replace('/');
    } else if (json.status == 408){
        var error = document.getElementById('error');
        error.innerHTML = "Falsches Passwort"
        console.log(json)
    }else if (json.status == 407){
        var error = document.getElementById('error');
        error.innerHTML = "Bitte fülle beide Felder aus"
        console.log(json)
    }else if (json.status == 406){
        var error = document.getElementById('error');
        error.innerHTML = "Das Passwort ist zu kurz (min 8)"
        console.log(json)
    }else if (json.status == 405){
        var error = document.getElementById('error');
        error.innerHTML = "Das Passwort ist zu lang (max 20)"
        console.log(json)
    }else if (json.status == 402){
        var error = document.getElementById('error');
        error.innerHTML = "Das Passwort darf keine Lücken enthalten"
        console.log(json)
    }else if (json.status == 403){
        var error = document.getElementById('error');
        error.innerHTML = "Bitte melde dich zuerst an"
        window.location.replace("/login")
        console.log(json)
    }else if (json.status == 401){
        var error = document.getElementById('error');
        error.innerHTML = "Bitte benutze ein anderes Passwort"
        console.log(json)
    }else {
        var error = document.getElementById('error');
        error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
        console.log(json)
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

function createElement(elem, className, id, text, title){
    var element = document.createElement(elem);
    element.className = className;
    if(elem == 'p'){
      var node = document.createTextNode(text);
      element.appendChild(node);
    }else if(elem == 'img'){
      element.src = text
      element.title = title
    }
    else if(elem == 'input'){
      element.placeholder = text
    }else if(elem == 'div' && className == "device parent"){
      element.id = id;
    }else if(elem == 'a'){
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

setInterval(function(){ 
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);


