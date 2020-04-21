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
        }else if (json.status == 410){
            var error = document.getElementById('error');
            error.innerHTML = '<p>Diese Email wird bereits verwendet. Wenn das deine ist, setze <a href="https://zgk.mxis.ch/account/reset/">hier</a> dein Passwort zurück</p>'
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