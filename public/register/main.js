/* main.js - Maximilian Schiller 2020 */
function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }

var url_string = window.location.href;
var url = new URL(url_string);
var token = url.searchParams.get("token")
console.log("token: " + token)
if(token == undefined || token == null){
    document.getElementById('register').style.display = 'block';
    document.getElementById('user').style.height = '90px'
    document.getElementById('error').innerHTML = 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: <a href="mailto:zgk@mxis.ch?subject=Invite Link Anfrage">zgk@mxis.ch</a>'
}else{
    var input = document.getElementById("password");
    input.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("loginBtn").click();
        }
    });
}

async function createUser(){
    if(token != undefined){
        var name = document.getElementById('name').value;
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: email, name: name, password: password, token: token})
        };
        const response = await fetch('/auth/register', options);
        const json = await response.json();
        if (json.status == 200) {
            console.log(json);
            var error = document.getElementById('error');
            error.innerHTML = "Register successfull"
            window.location.replace('/');
        } else if (json.status == 408){
            var error = document.getElementById('error');
            error.innerHTML = "Bitte fülle alle Felder aus"
            console.log(json)
        }else if (json.status == 407){
            var error = document.getElementById('error');
            error.innerHTML = "Bitte gib eine echte Email Adresse ein"
            console.log(json)
        }else if (json.status == 406){
            var error = document.getElementById('error');
            error.innerHTML = "Das Passwort ist zu kurz (min 8)"
            console.log(json)
        }else if (json.status == 405){
            var error = document.getElementById('error');
            error.innerHTML = "Das Passwort ist zu lang (max 20)"
            console.log(json)
        }else if (json.status == 404){
            var error = document.getElementById('error');
            error.innerHTML = "Das Passwort darf keine Lücken enthalten"
            console.log(json)
        }else if (json.status == 401){
            var error = document.getElementById('error');
            error.innerHTML = "Der Invite Link ist abgelaufen oder wurde zu oft benutzt"
            console.log(json)
        }else if (json.status == 403){
            var error = document.getElementById('error');
            error.innerHTML = "Der Invite Link existiert nicht"
            console.log(json)
        }else {
            var error = document.getElementById('error');
            error.innerHTML = "Es ist ein Fehler aufgetreten, bitte warte kurz"
            console.log(json)
        }
    }
}


setInterval(function(){ 
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);