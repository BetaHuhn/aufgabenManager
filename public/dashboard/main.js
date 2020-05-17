/* main.js - Maximilian Schiller 2020 */

function checkCookie() {
    // Quick test if browser has cookieEnabled host property
    if (navigator.cookieEnabled) return true;
    // Create cookie
    document.cookie = "cookietest=1";
    var ret = document.cookie.indexOf("cookietest=") != -1;
    // Delete cookie
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
    return ret;
}

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/service-worker.js'); }

var check = checkCookie();
console.log(check)
if (!check) {
    console.log("Cookies not enabled")
    document.getElementById('login').style.display = "none"
    var error = document.getElementById('error');
    error.innerHTML = '<p>Fehler, Cookies sind blockiert. <a href="https://enablecookies.info/de/">Hier</a> ist eine Anleitung wie du sie aktivierst</p>'
    alert("Hinweis: Damit wir dich anmelden können musst du Cookies erlauben.")
}

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

let data;
let numAufgaben = 0;
let aufgaben = [];
let activeTab = "aufgaben";
let activeDisplay = "tag";
let currentDay;
let currentWeek;
let meetings = {};
let meetingsWeek = {};
const tage = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]

let role;
let user_id;

async function authenticate() {
    try{
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        };
        const response = await fetch('/api/auth/dashboard', options);
        const json = await response.json();
        if (json.status == 200) {
            console.log(json);
            user_id = json.data._id;
            console.log(user_id)
            role = json.data.role
            currentDay = new Date(json.data.isoDateTime)
            if(Number.isNaN(currentDay.getMonth())) {
                let arr = json.data.isoDateTime.split(/[- :]/);
                currentDay = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]);
            }
            if(currentDay.getDay() == 0){
                currentDay.setDate(currentDay.getDate() + 1);
            }else if(currentDay.getDay() == 6){
                currentDay.setDate(currentDay.getDate() + 2);
            }
            if (role == 'user') {
                console.log("user")
                var newReiter = document.getElementById('new');
                newReiter.
                style.display = 'none'
            }
            loadTab();
        } else if (json.status == 405) {
            console.log(json);
            let message = document.getElementById('error');
            message.style.display = "block";
            message.innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
            document.getElementById('dashboard').style.display = "block";
            document.getElementById('loader').style.display = "none";
            window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
        } else {
            let message = document.getElementById('error');
            message.style.display = "block";
            message.innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
            document.getElementById('dashboard').style.display = "block";
            document.getElementById('loader').style.display = "none";
            window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
        }
    }catch(err){
        alert(err)
    }
}

async function getAufgaben() {
    let last = document.getElementById('legend')
    if(aufgaben.length < 1){
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
            aufgaben = json.data;
        } else if (json.status == 405) {
            console.log(json);
            window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
            let message = document.getElementById('error');
            message.style.display = "block";
            message.innerHTML = `<p class="message" id="message">Nicht angemeldet. Wenn du nicht automatisch weiter geleitet wirst, klicke <a href="/login">hier</a></p>`
            document.getElementById('dashboard').style.display = "block";
            document.getElementById('loader').style.display = "none";
        } else {
            let message = document.getElementById('error');
            message.style.display = "block";
            message.innerHTML = `<p class="message" id="message">Shit... Es scheint ein Fehler aufgetreten zu sein. Lade bitte die Seite nochmal.</p>`
            document.getElementById('dashboard').style.display = "block";
            document.getElementById('loader').style.display = "none";
            window.location.replace('/login?ref=' + window.location.pathname + window.location.search)
        }
    }
    let par = document.getElementById("aufgaben");
    console.log(par.children)
    while(par.children.length > 1){
        console.log(par.lastChild)
        par.removeChild(par.lastChild)
    }
    if (aufgaben.length >= 1) {
        numAufgaben = aufgaben.length;
        for (i in aufgaben) {
            let aufgabe = aufgaben[i]
            let abgabe = new Date(aufgabe.deadline)
            let row = createRow(aufgabe._id, aufgabe.subject, aufgabe.class, abgabe.toLocaleDateString(), aufgabe.text, aufgabe.downloads, aufgabe.files, aufgabe.user_id)
            last.parentElement.appendChild(row);
            last = row;
        }
        console.log(numAufgaben + " aufgaben")
        if (role != 'user') {
            var button = document.createElement('button')
            button.className = 'addButton';
            button.onclick = function() { window.location.replace('/new') };
            button.innerHTML = 'Aufgabe erstellen';
            button.id = "addBtn"
            last.parentElement.appendChild(button);
        }
    } else {
        var text = createElement('p', 'message', 'message', "Aktuell keine Aufgaben")
        text.id = 'message'
        last.parentElement.appendChild(text)
    }
    document.getElementById('dashboard').style.display = "block";
    document.getElementById('loader').style.display = "none";
}

function createRow(id, fach, klasse, abgabe, text, downloads, file, aufgabeUserId) {
    //console.log(file)
    var div = createElement('div', 'device parent', id)
    div.onclick = function() { window.location.href = "/aufgabe?id=" + id; }
    div.style.cursor = "pointer";
    div.title = "Klicke um zu den Lösugen zu gelangen"
    var pName = createElement('p', 'child text name', id, fach + ' (' + klasse + ')')
        //pName.onclick = function(e) { e.stopPropagation(); }
        //pName.style.cursor = "text";
    div.appendChild(pName)

    var abgabe = createElement('p', 'child text', id, abgabe)
        //abgabe.onclick = function(e) { e.stopPropagation(); }
        //abgabe.style.cursor = "text";
    pName.parentElement.appendChild(abgabe)

    var exercise = document.createElement('div')
    exercise.id = id;
    exercise.className = "child";
    exercise.innerHTML = (text.length > 100) ? `<p class="aufgabe">${text.substring(0, 100)}...<a href="/aufgabe?id=${id}">mehr</a></p>` : `<p class="aufgabe">${text}</p>`;
    exercise.onclick = function(e) { e.stopPropagation(); }
    exercise.style.cursor = "text";
    abgabe.parentElement.appendChild(exercise)

    var downloads = createElement('span', 'child downloads', id, downloads + " Downloads")
        //downloads.onclick = function(e) { e.stopPropagation(); }
        //downloads.style.cursor = "text";
        exercise.parentElement.appendChild(downloads)

    var files = createElement('div', 'child stack', id)
        //files.onclick = function(e) { e.stopPropagation(); }
        //files.style.cursor = "text";
    downloads.parentElement.appendChild(files)
    if (file.count == 1) {
        var count = file.count + " Datei";
        var name = file.fileName + '.' + file.type;
    } else if (file.count == 0) {
        var count = file.count + " Dateien"
        var name = "keine Dateien"
    } else {
        var count = file.count + " Dateien"
        var name = file.fileName + '.' + file.type;
    }
    files.innerHTML = `
  <p class="blue" id="${id}">${count}</p>
  <button class="buttons" onclick="download(this);" title="Klicke um die Aufgabe herunterzuladen" id="${id}">Download</button>
  <a id="link_${id}" href="${file.fileUrl}" style="pointer-events: none;" hidden="">Download</a>
  `
    var div2 = document.createElement('div')
    div2.className = "solutionDiv"
    var arrow = document.createElement('i')
    arrow.className = "child fas fa-arrow-right arrow" //fa-clipboard-list
    div2.onclick = function(e) {
        e.stopPropagation();
        window.event.cancelBubble = true;
        window.location.href = "/aufgabe?id=" + id;
    }
    div2.appendChild(arrow)
    var p = document.createElement('p')
    p.className = "blue"
    p.style.margin = "2px"
    p.innerHTML = (role == "user") ? "Mehr" : "Lösungen"
    div2.appendChild(p)
    files.parentElement.appendChild(div2)

    console.log("Aufgabe von: " + aufgabeUserId + " User ID: " + user_id + " Role: " + role)
    if (role != 'user') {
        if (user_id == aufgabeUserId || role == 'admin') {
            console.log(true)
            var removeDiv = createElement('div', 'child deleteButton', id)
            removeDiv.id = id
            removeDiv.title = "Klicke um die Aufgabe zu löschen"
            removeDiv.onclick = function(e) {
                remove(id);
                e.stopPropagation();
                window.event.cancelBubble = true;
            };
            div2.parentElement.appendChild(removeDiv)
            removeDiv.innerHTML = `<span class="trash child"><span></span></span>`
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

function loadTab(){
    let url = new URL(window.location.href);
    let tab = url.searchParams.get("tab");
    if(tab != undefined && tab != activeTab){
        switchTab();
    }else{
        getAufgaben();
    }
}

function switchTab(){
    if(activeTab == "aufgaben"){
        document.getElementById('aufgabenTab').classList.remove("activeTab");
        document.getElementById('meetingsTab').classList.add("activeTab");
        document.getElementById('aufgaben').style.display = "none";
        document.getElementById('meetings').style.display = "block";
        document.getElementById('tabs').classList.add("withBtn");
        document.getElementById('filterBtn').style.display = "block";
        activeTab = "meetings";
        getMeetings();
    }else{
        document.getElementById('aufgabenTab').classList.add("activeTab");
        document.getElementById('meetingsTab').classList.remove("activeTab");
        document.getElementById('aufgaben').style.display = "block";
        document.getElementById('meetings').style.display = "none";
        document.getElementById('tabs').classList.remove("withBtn");
        document.getElementById('filterBtn').style.display = "none";
        activeTab = "aufgaben";
        getAufgaben();
    }
    let url = new URL(window.location.href);
    let search_params = url.searchParams;
    search_params.set('tab', activeTab);
    url.search = search_params.toString();
    window.history.replaceState(null, null, url)
}

function switchMeetingDisplay(){
    if(activeDisplay == "tag"){
        document.getElementById('filterBtn').innerHTML = '<i class="btnIcon fa fa-calendar-day"></i>Tag';
        document.getElementById('meetingsListWeek').style.display = "block";
        document.getElementById('meetingsListDay').style.display = "none";
        activeDisplay = "woche";
        getMeetings();
    }else{
        document.getElementById('filterBtn').innerHTML = '<i class="btnIcon fa fa-calendar-week"></i>Woche';
        document.getElementById('meetingsListWeek').style.display = "none";
        document.getElementById('meetingsListDay').style.display = "block";
        activeDisplay = "tag";
        currentDay = new Date()
        getMeetings();
    }
}

window.addEventListener('keydown', function(e) {
    if (e.keyCode == 37) {
        e.preventDefault()
        previous();
    }else if (e.keyCode == 39) {
        e.preventDefault()
        next();
    }else if (e.keyCode == 32) {
        e.preventDefault()
        switchMeetingDisplay();
    }
});

async function getMeetings(){
    if(activeDisplay == "tag"){
        let list = document.getElementById('meetingsListDay');
        list.innerHTML = "";
        let loadingDiv = document.createElement("div");
        loadingDiv.id = "loadingMeeting";
        loadingDiv.className = "meetingDay loadingMeetingDay";
        list.appendChild(loadingDiv)
        if(meetings[isoToDate(currentDay)] == undefined){
            try{
                const options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                };
                const response = await fetch(`/api/get/meetings?date=${currentDay.toISOString()}`, options);
                const json = await response.json();
                if (json.status == 200) {
                    console.log(json.data)
                    meetings[isoToDate(currentDay)] = json.data;
                }else{
                    console.log(json.data)
                    let message = document.getElementById('error');
                    message.style.display = "block";
                    message.innerHTML = "Es ist ein Fehler aufgetreten"
                }
            }catch(err){
                alert(err)
            }
            
        }

        document.getElementById('dashboard').style.display = "block";
        document.getElementById('loader').style.display = "none";
        let parent = document.getElementById('meetingsListDay');
        let currentMeetings =  meetings[isoToDate(currentDay)];
        setTimeout( function(){
            document.getElementById('loadingMeeting').style.display = "none"
            if(currentMeetings.length < 1){
                document.getElementById('meetingsListDay').innerHTML = "";
                let p = document.createElement('p');
                p.style.textAlign = "center"
                p.innerHTML = "Keine Meetings"
                parent.appendChild(p)
            }else{
                for(i in currentMeetings){
                    let div = document.createElement('div');
                    let dateObj = new Date(currentMeetings[i].date);
                    let hour = ('0' + dateObj.getHours()).slice(-2);
                    let minute = ('0' + dateObj.getMinutes()).slice(-2);
                    div.id = currentMeetings[i]._id;
                    div.className = "meetingDay";
                    div.innerHTML = `
                        <p class="meetingText fach">${currentMeetings[i].subject}</p>
                        <p class="meetingText datetime">${hour}:${minute} Uhr</p>
                        <button data-id="${currentMeetings[i]._id}" data-date="${currentMeetings[i].date}" data-subject="${currentMeetings[i].subject}" data-class="${currentMeetings[i].class}" class="buttons msBtn" onclick="createTermin(this);">Als Termin speichern</button>
                    `
                    parent.appendChild(div)
                }
            }
        }, 200);
        
        document.getElementById('currentDate').innerHTML = tage[currentDay.getDay()] + ", " + isoToDate(currentDay);
    }else{
        var parent = document.getElementById('thead').parentElement;
        let table = document.getElementById('meetingTable');
        while (table.children.length > 1) {
            table.removeChild(table.lastChild);
        }
        for(var i = 0; i < 3; i++){
            let tr = document.createElement("tr");
            tr.className = "loadingMeetings"
            for(var a = 0; a < 5; a++){
                let td = document.createElement("td");
                td.className = "meetingWeek";
                //td.style.height = "63px"
                tr.appendChild(td);
            }
            parent.appendChild(tr)
        }
        let date = currentDay;
        let day = date.getDay();
        let diff = date.getDate() - day + (day == 0 ? -6:1);
        let week = new Date(date.setDate(diff));
        console.log(week)
        console.log(meetingsWeek[isoToDate(week)])
        if(meetingsWeek[isoToDate(week)] == undefined){
            const options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };
            const response = await fetch(`/api/get/meetings?week=${week.toISOString()}`, options);
            const json = await response.json();
            if (json.status == 200) {
                console.log(json.data)
                meetingsWeek[isoToDate(week)] = json.data;
            }else{
                console.log(json.data)
                let message = document.getElementById('error');
                message.style.display = "block";
                message.innerHTML = "Es ist ein Fehler aufgetreten"
            }
        }
        document.getElementById('dashboard').style.display = "block";
        document.getElementById('loader').style.display = "none";

        let currentMeetings =  meetingsWeek[isoToDate(week)];
        let maxLen = 0;
        for(i in currentMeetings){
            if(currentMeetings[i].length > maxLen){
                maxLen = currentMeetings[i].length;
            }
        }
        console.log(maxLen)
        table = document.getElementById('meetingTable');
        if(maxLen < 1){
            console.log("keine meetings")
            for(var i = 0; i < 4; i++){
                if(i >= 1){
                    for(a in parent.children[i].children){
                       parent.children[i].children[a].className = "meetingWeek noMeeting"
                    }
                }
            }
            setTimeout( function(){
                for(var i = 0; i < 4; i++){
                    parent.children[i].classList.remove("loadingMeetings")
                }
            }, 300);
        }else{
            setTimeout(function(){
                while(maxLen < 3){
                    maxLen += 1;
                }
                while(maxLen < parent.children[i] - 1){
                    console.log("remove")
                    parent.removeChild(parent.children[i])
                }
                for(var i = 0; i < maxLen; i++){
                    console.log("1 run")
                    if(parent.children[i + 1] == undefined){
                        let tr = document.createElement("tr");
                        for(elem in currentMeetings){
                            let td = document.createElement("td")
                            if(currentMeetings[elem][i] != undefined){
                                let date = new Date(currentMeetings[elem][i].date)
                                let hour = ('0' + date.getHours()).slice(-2);
                                let minute = ('0' + date.getMinutes()).slice(-2);
                                if(date > new Date()){
                                    td.className = "meetingWeek futureMeeting";
                                }else{
                                    td.className = "meetingWeek";
                                }
                                td.id = currentMeetings[elem][i]._id
                                td.innerHTML = `
                                    <span>${currentMeetings[elem][i].subject}</span>
                                    <span>${hour}:${minute} Uhr</span>
                                `
                                td.setAttribute("data-subject", currentMeetings[elem][i].subject);
                                td.setAttribute("data-date", currentMeetings[elem][i].date);
                                td.setAttribute("data-id", currentMeetings[elem][i]._id);
                                td.title = "Klicke um das Meeting zu deinem Kalender hinzuzufügen"
                                td.onclick = function(){ createTermin(this); }
                            }else{
                                td.className = "meetingWeek noMeeting";
                            }
                            tr.appendChild(td);
                        }
                        parent.appendChild(tr)
                    }else{
                        for(elem in currentMeetings){
                            let td = parent.children[i + 1].children[elem];
                            if(currentMeetings[elem][i] != undefined){
                                let date = new Date(currentMeetings[elem][i].date)
                                let hour = ('0' + date.getHours()).slice(-2);
                                let minute = ('0' + date.getMinutes()).slice(-2);
                                console.log("meeting: " + date + " jetzt: " + new Date())
                                if(date > new Date()){
                                    console.log("future")
                                    td.className = "meetingWeek futureMeeting";
                                }else{
                                    console.log("past")
                                    td.className = "meetingWeek";
                                }
                                td.id = currentMeetings[elem][i]._id
                                td.innerHTML = `
                                    <span>${currentMeetings[elem][i].subject}</span>
                                    <span>${hour}:${minute} Uhr</span>
                                `
                                td.setAttribute("data-subject", currentMeetings[elem][i].subject);
                                td.setAttribute("data-date", currentMeetings[elem][i].date);
                                td.setAttribute("data-id", currentMeetings[elem][i]._id);
                                td.onclick = function(){ createTermin(this); }
                                td.title = "Klicke um das Meeting zu deinem Kalender hinzuzufügen"
                            }else{
                                td.className = "meetingWeek noMeeting";
                            }
                        
                        }
                    }
                }
            }, 300);
            setTimeout( function(){
                for(var i = 0; i < 4; i++){
                    parent.children[i].classList.remove("loadingMeetings")
                }
            }, 300);
        }
        let endDate = new Date(week);    
        endDate.setTime( endDate.getTime() + 7 * 86400000 )
        document.getElementById('currentDate').innerHTML =  isoToDate(week) + " - " + isoToDate(endDate);
    }
}

function createTermin(e){
    let id = e.getAttribute('data-id');
    var date = new Date(e.getAttribute('data-date'));
    let hour = ('0' + date.getHours()).slice(-2);
    let minute = ('0' + date.getMinutes()).slice(-2);
    let subject = e.getAttribute('data-subject');
    var myCalendar = createCalendar({
        options: {
            class: 'calendar',
            id: id + "meeting"
        },
        data: {
          title: subject + " Teams Meeting",
          start: date,
          duration: 45, //minutes
          description: subject + " Teams Meeting am " + isoToDate(date) + " um " + hour + ":" + minute + " Uhr"
        }
    });
    let modal = document.getElementById("modal");
    modal.style.display = "block";
    let modalContent = document.getElementById("modalContent")
    modalContent.innerHTML = `
        <span class="close" id="close">&times;</span>
        <h1>Zum Kalender hinzufügen</h1>
        <ul class="calendarList">
            <li><a target="_blank" href="${myCalendar.google}"><i class="fab fa-google"></i>Google</a></li>
            <li><a target="_blank" href="${myCalendar.ical}"><i class="fab fa-apple"></i>Apple</a></li>
            <li><a target="_blank" href="${myCalendar.outlook}"><i class="fab fa-microsoft"></i>Microsoft</a></li>
            <li><a target="_blank" href="${myCalendar.yahoo}"><i class="fab fa-yahoo"></i>Yahoo</a></li>
            <li><a target="_blank" href="${myCalendar.ical}"><i class="fas fa-calendar"></i>Andere (iCal)</a></li>
        </ul>
    `
    document.getElementById('close').onclick = function() {
        document.getElementById("modal").style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == document.getElementById("modal")) {
            document.getElementById("modal").style.display = "none";
        }
    }
}

function next(){
    if(activeDisplay == "tag"){
        if(currentDay.getDay() + 1 == 0){
            currentDay.setDate(currentDay.getDate() + 2);
        }else if(currentDay.getDay() + 1 == 6){
            currentDay.setDate(currentDay.getDate() + 3);
        }else{
            currentDay.setDate(currentDay.getDate() + 1);
        }
    }else{
        currentDay.setDate(currentDay.getDate() + 7);
    }
    getMeetings();
}

function previous(){
    if(activeDisplay == "tag"){
        if(currentDay.getDay() - 1 == 0){
            currentDay.setDate(currentDay.getDate() - 3);
        }else if(currentDay.getDay() - 1 == 6){
            currentDay.setDate(currentDay.getDate() - 2);
        }else{
            currentDay.setDate(currentDay.getDate() - 1);
        }
    }else{
        currentDay.setDate(currentDay.getDate() - 7);
    }
    getMeetings();
}

function isoToDate(d){
    let day = ('0' + d.getDate()).slice(-2);
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

setInterval(function() {
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);

