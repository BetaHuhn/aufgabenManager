/* main.js - Maximilian Schiller 2020 */

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }


var data;
var last = document.getElementById('legend')
var numAufgaben = 0;

var role;
var user_id;

async function auth(){
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
    user_id = json.user.user_id;
    console.log(user_id)
    role = json.user.role
    if(role == 'user'){
      console.log("user")
      var newReiter = document.getElementById('new');
      newReiter.style.display = 'none'
    }
    if(json.data.length >= 1){
        var numAufgaben = json.data.length;
        for(i in json.data){
            var aufgabe = json.data[i]
            //console.log(aufgabe.files)
            var abgabe = new Date(aufgabe.abgabe)
            var row = createRow(aufgabe.aufgaben_id, aufgabe.fach, aufgabe.klasse, abgabe.toLocaleDateString(), aufgabe.text, aufgabe.downloads, aufgabe.files, aufgabe.user_id )
            last.parentElement.appendChild(row);
            last = row;
        }
        console.log(numAufgaben + " aufgaben")
      }
    else{
        var text = createElement('p', 'message', 'message', "Aktuell keine Aufgaben")
        text.id = 'message'
        last.parentElement.appendChild(text)
    }
    if(role != 'user'){
      var button = document.createElement('button')
      button.className = 'addButton';
      button.onclick = function(){window.location.replace('/new')};
      button.innerHTML = 'Aufgabe erstellen';
      button.id = "addBtn"
      last.parentElement.appendChild(button);
    }
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
function createRow(id, fach, klasse, abgabe, text, downloads, file, aufgabeUserId){
    //console.log(file)
  var div = createElement('div', 'device parent', id)
  var pName = createElement('p', 'child text name', id, fach + ' (' + klasse + ')')
  div.appendChild(pName)

  var abgabe = createElement('p', 'child text', id, abgabe)
  pName.parentElement.appendChild(abgabe)

  var text = createElement('p', 'child aufgabe', id, text)
  abgabe.parentElement.appendChild(text)

  var downloads = createElement('span', 'child downloads', id, downloads + " Downloads")
  text.parentElement.appendChild(downloads)

  var files = createElement('div', 'child stack', id)
  downloads.parentElement.appendChild(files)
  if(file.count == 1){
    var count = file.count + " Datei:";
    var name = file.fileName + '.' + file.type;
  }else if(file.count == 0){
    var count = file.count + " Dateien:"
    var name = "keine Dateien"
  }else{
    var count = file.count + " Dateien:"
    var name = file.fileName + '.' + file.type;
  }
  files.innerHTML = `
  <p class="blue" id="${id}">${count}</p>
  <p class="grey" id="${id}">${name}</p>`

  var buttonStack = createElement('div', 'child buttons', id)
  files.parentElement.appendChild(buttonStack)
  buttonStack.innerHTML = `
  <button onclick="document.getElementById('${'link_' + id}').click()" id="${id}">Download</button>
  <a id="link_${id}" href="${file.fileUrl}" download="${name}.conf" hidden="">Download</a>`
  console.log("Aufgabe von: " + aufgabeUserId + " User ID: " + user_id + " Role: " + role)
  if(role != 'user'){
    if(user_id == aufgabeUserId || role == 'admin'){
      console.log(true)
      var removeDiv = createElement('div', 'child deleteButton', id)
      removeDiv.onclick = function(){remove(id)};
      buttonStack.parentElement.appendChild(removeDiv)
      removeDiv.innerHTML = `<span id="${id}" class="fas fa-trash deleteIcon"></span>`
    }
  }
  return div;
}

function createElement(elem, className, id, text, title){
  var element = document.createElement(elem);
  element.className = className;
  if(elem == 'p' || elem == 'span'){
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
        const response = await fetch('/api/delete/aufgabe?id=' + id, options);
        const json = await response.json();
        if (json.status == 200) {
            numAufgaben = numAufgaben - 1;
            var div = document.getElementById(id)
            div.parentNode.removeChild(div);
            if(numAufgaben == 0){
                last = document.getElementById('legend')
                var text = createElement('p', 'message', 'message', "Aktuell keine Aufgaben")
                text.id = 'message'
                document.getElementById('dashboard').insertBefore(text, document.getElementById('addBtn'))
            }
        }else{
            var text = createElement('p', 'message', 'message', "Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal")
            text.id = 'message'
            document.getElementById('dashboard').insertBefore(text, document.getElementById('addBtn'))
        }
  }
}

function download(btn){
  console.log(btn.id)
  document.getElementById('link_' + btn.id).click()
}

function keys(){
  alert("Show Keys")
}

setInterval(function(){ 
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);