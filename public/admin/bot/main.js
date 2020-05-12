/* main.js - Maximilian Schiller & Noah Till 2020 */

var c1 = document.getElementById('c1c').value;
var c2 = document.getElementById('c2c').value;
var req = "";

async function auth() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const response = await fetch('/api/auth/admin', options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        document.getElementById('loader').style.display = "none";
        document.getElementById('wrapper').style.display = "block";
    } else if(json.response == "not permitted"){
        console.log("not permitted")
        window.location.replace('/')
    } else{
        console.log("not logged in")
        window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
    }
}

function changeReq(button) {
    req = button.getAttribute("req");
    switch (req) {
        case "disctoken":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Change Discord Token";
            document.getElementById('c1txt').innerHTML = "Token";
            document.getElementById('c1').style.display = "block";
            break;
        case "teletoken":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Change Telegram Token";
            document.getElementById('c1txt').innerHTML = "Token";
            document.getElementById('c1').style.display = "block";
            break;

        case "telename":
            document.getElementById('c2').style.display = "none";
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Change Telegram Bot name";
            document.getElementById('c1txt').innerHTML = "Name";
            document.getElementById('c1').style.display = "block";
            break;

        case "post":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Post Task";
            document.getElementById('c1txt').innerHTML = "Taks ID";
            document.getElementById('c1').style.display = "block";
            break;

        case "postall":
            document.getElementById('c2').style.display = "none";
            document.getElementById('headline').innerHTML = "Post to all classes";
            document.getElementById('c1txt').innerHTML = "Message";
            document.getElementById('c1').style.display = "block";
            break;

        case "postclass":
            document.getElementById('headline').innerHTML = "Post to specific class";
            document.getElementById('c1txt').innerHTML = "Class";
            document.getElementById('c1').style.display = "block";
            document.getElementById('c2txt').innerHTML = "Message";
            document.getElementById('c2').style.display = "block";
            break;
    }
}

async function submit() {
    c1 = document.getElementById('c1c').value;
    c2 = document.getElementById('c2c').value;
    if (req == "") {
        document.getElementById('status').innerHTML = "Klicke zuerst auf eine Funktion";
        return;
    }
    if (c1 == "") {
        document.getElementById('status').innerHTML = "Bitte gib zuerst ein Argument ein";
        return;
    }
    console.log("req: " + req + ", c1: " + c1 + ", c2: " + c2);
    var options;
    document.getElementById('loader').style.display = "block";
    document.getElementById('status').innerHTML = "Sending...";
    if (req == "postclass") {
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "req": req, "c1": c1, "c2": c2 })
        };
    } else {
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "req": req, "c1": c1 })
        };
    }
    const response = await fetch('/api/admin', options);
    const json = await response.json();
    if (json.status == 200) {
        document.getElementById('loader').style.display = "none";
        document.getElementById('status').innerHTML = "status: " + json.status + " response: " + json.data;
    }else if(json.status == 405){
        window.location.href = "/login"
    }else{
        console.log(json)
        document.getElementById('loader').style.display = "none";
        document.getElementById('status').innerHTML = "Failed to reach api, maybe its offline!";
    }
}

setInterval(function() {
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);