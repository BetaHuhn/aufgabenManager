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
        console.log(json);
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
            //el2.parentNode.replaceChild(newEl, el2);
        } else {
            if (json.data.classes.length >= 1) {
                for (i in json.data.classes) {
                    console.log(json.data.classes[i])
                    var sel = document.getElementById('klasse');
                    var sel2 = document.getElementById('klasseMeeting');
                    var opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(json.data.classes[i]));
                    opt.value = json.data.classes[i];
                    sel.appendChild(opt);
                    sel2.appendChild(opt);
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
        console.log(json);
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
                progressDiv.style.display = "none";
                document.getElementById('status').style.display = "none";
                if (xhr.status == 200) {
                    var json = JSON.parse(this.responseText)
                    console.log(json);
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
                document.getElementById('heading').style.display = "none";
                document.getElementById('error').innerHTML = `Aufgabe erfolgreich erstellt!`;
                window.location.href = "/aufgabe?id=" + json.data._id
            } else if (json.status == 405) {
                console.log(json);
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
    console.log("a: " + a + " b: " + b + " c: " + c + " d: " + d)
    if ((a == null || a == "") || (b == null || b == "") || (c == null || c == "") || (d == null || d == "") || b == "Klasse") {
        //console.log(false)
        return false;
    } else {
        //console.log(true)
        return true
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
        var file = 0;
        for (var i = 0; i < fi.files.length; i++) {
            console.log(fi.files[i])
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
    console.log(filledOut)
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
            console.log(json);
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
    console.log("a: " + a + " b: " + b + " c: " + c)
    if ((a == null || a == "") || (b == null || b == "") || (c == null || c == "") || b == "Klasse") {
        //console.log(false)
        return false;
    } else {
        //console.log(true)
        return true
    }
}

class Calendary {
    constructor(cfg) {
      this.today = new Date();
      this.lang = cfg.lang || "en";
      this.dayNames = {
        en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "So"],
        de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
      };
      
      this.monthNames = {
        en: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ],
        de: [
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember"
        ]
      };
      
      this.containers = {
        month: this.cE(["flexcol", "monthName"], "monthDspl"),
        year: this.cE("flexcol", "yearDspl"),
        minute: this.cE("timeVal", null, "00"),
        hour: this.cE("timeVal", null, "00")
      };
      this.values = {
        day: cfg.day || this.today.getDate(),
        month: cfg.month || this.today.getMonth(),
        year: cfg.year || this.today.getFullYear(),
        minute: cfg.minute || this.today.getMinutes(),
        hour: cfg.hour || this.today.getHours()
      };
      this.timezoneOffset = -1 *(this.today.getTimezoneOffset()) / 60;
      this.buildWidget();
    }
  
    /**
    * Creates the main container and the panels inside
    */
    buildWidget() {
      this.container = this.cE(["cal-container", "flexrow"]);
  
      this.time = this.cE("panel", "time");
      this.buildTimeCtrls();
    
      
      this.date = this.cE("panel", "date");
      this.buildDateCtrls();
  
      
      for (let week = 0; week < 6; week++) {
        let row = this.cE("flexrow");
        for (let day = 0; day < 7; day++) {
          let col = this.cE(["flexcol", "day"], "d" + week + ":" + day, "");
          col.setAttribute("onclick", "cally.setDay(this.innerHTML)");
          row.appendChild(col);
        }
        this.date.appendChild(row);
      }
  
      this.container.appendChild(this.date);
  
      document.getElementsByClassName('cally-modal')[0].appendChild(this.container);
    }
    
    /**
    * Sets a new day when user clicks on the calendar
    */
    setDay(idx) {
      this.values.day = parseInt(idx);
      this.redraw();
    }
  
    /**
    * Change the hour value
    */
    toggleHours(sign) {
      switch(sign){
        case "+": {
          this.values.hour++;
          if (this.values.hour === 24) {
            this.values.hour = 0;
          }
          break;
        }
        case "-": {
          this.values.hour--;
          if (this.values.hour === -1) {
            this.values.hour = 23;
          }
          break;
        }
        default: break;
      }
      this.redraw();
    }
  
    /**
    * Change the minute value
    */
    toggleMinutes(sign) {
      switch(sign){
        case "+" :{
          this.values.minute++;
          if (this.values.minute === 60) {
            this.values.minute = 0;
          }
          break;
        }
        case "-" :{
          this.values.minute--;
          if (this.values.minute === -1) {
            this.values.minute = 59;
          }
          break;
        }
        default: break;
      }
      this.redraw();
    }
  
    /**
    * Change the active month
    */
    toggleMonths(sign) {
      switch (sign) {
        case "-" : {
          this.values.month--;
          if (this.values.month == -1) {
            this.values.month = 11;
            this.values.year--;
          }
          if(this.values.day > 28){
            this.values.day = 28;
          }
          break;
        }
        case "+" :{
          this.values.month++;
          if (this.values.month === 12) {
            this.values.month = 0;
           this.values.year++;
          }
          break;
        }
        default: break;
      }
      this.redraw();
    }
  
    redraw(){
      /**
      * Create a Dateobject with the active values
      */
      let dT = new Date(
        this.values.year,
        this.values.month,
        this.values.day,
        this.values.hour,
        this.values.minute,
        0
      );
      
      /** 
      * The string for the datetime-local input field
      * Could be splitted if two seperate inputs are used
      */
      this.iso = 
        this.values.year +
        '-' +
        ((this.values.month + 1 < 10) ? '0' + (this.values.month + 1) : (this.values.month + 1) ) +
        '-' +
        ((this.values.day < 10) ? '0' + (this.values.day) : this.values.day) +
        'T' +
        ((this.values.hour < 10) ? '0' + this.values.hour : this.values.hour) +
        ':' +
        ((this.values.minute < 10) ? '0' + this.values.minute : this.values.minute) +
        ':00'
      ;
      
      /**
      * Just for setting the datetime-local
      * Extend it with placeholders for target containers
      * to serve multiple inputs
      */
      this.setValue();
      
      /**
      * Refresh the display
      */
      this.setCally(dT);
    }
  
    /**
    * Method for the construction of the date panel and the
    * controls inside
    */
    buildDateCtrls() {
      /**
      * Container for the month controls
      */
      let row = this.cE("flexrow", "monthCtrl");
      
      /**
      * Button to decrease the active month
      */
      let arrLeft = this.cE("flexcol", "subMonth", "◀");
      arrLeft.addEventListener('click', function(){
        cally.toggleMonths("-");
      });
      
      /**
      * Button to increase the active month
      */
      let arrRight = this.cE("flexcol", "addMonth", "▶");
      arrRight.addEventListener('click', function(){
        cally.toggleMonths("+");
      });
  
      
      row.appendChild(arrLeft);
      row.appendChild(this.containers.month);
      row.appendChild(this.containers.year);
      row.appendChild(arrRight);
      this.date.appendChild(row);
      
      let weekdays = this.cE("flexrow", "weekdays");
      for (let i = 0; i < this.dayNames[this.lang].length; i++) {
        let day = this.cE(
          ["flexcol", "dayName"],
          "",
          this.dayNames[this.lang][i]
        );
        weekdays.appendChild(day);
      }
      this.date.appendChild(weekdays);
    }
    
    /**
    * Method for the construction of the time panel and the
    * controls inside
    */
    buildTimeCtrls() {
      /**
      * Time controls for adding hours and minutes
      */
      let upperCtrls = this.cE(["flexrow", "even"]);
      
      /**
      * Button to increase the hour value
      */
      let nextHour = this.cE("timeCtrlBtn", null, "+");
      nextHour.setAttribute("onclick", "cally.toggleHours('+');");
      upperCtrls.appendChild(nextHour);
      
      /*
      * Button to increase the minute value
      */
      let nextMinute = this.cE("timeCtrlBtn", null, "+");
      nextMinute.setAttribute("onclick", "cally.toggleMinutes('+');");
      upperCtrls.appendChild(nextMinute);
  
      /**
      * Display for the time values
      */
      let timeDspl = this.cE(["flexrow", "even"]);
      
      /**
      * The divs for the visible hour and minute values
      */
      timeDspl.appendChild(this.containers.hour);
      timeDspl.appendChild(this.containers.minute);
  
      /**
      * The lower time-controls
      */
      let lowerCtrls = this.cE(["flexrow", "even"]);
      
      /**
      * Button decrease lower the hour value 
      */
      let prevHour = this.cE("timeCtrlBtn", null, "-");
      prevHour.setAttribute("onclick", 'cally.toggleHours("-");');
      lowerCtrls.appendChild(prevHour);
      
      /**
      * Button to decrease the minute value
      */
      let prevMinute = this.cE("timeCtrlBtn", null, "-");
      prevMinute.setAttribute("onclick", 'cally.toggleMinutes("-");');
      lowerCtrls.appendChild(prevMinute);

      /**
      * Push it all to the time container 
      */
      this.time.appendChild(upperCtrls);
      this.time.appendChild(timeDspl);
      this.time.appendChild(lowerCtrls);
      
      /**
      * And the time panel to the container;
      */
      this.container.appendChild(this.time);
      
      return true;
    }
  
    /**
     * Creates a DIV Elements with given properties
     *
     * @param array|string clss a string or array with classnames
     * @param string id the id of the element
     * @param string txt - text
     *
     * @return HTMLDivElement
     */
    cE(clss = null, id = null, txt = null) {
      let el = document.createElement("div");
      if (clss !== null) {
        if (Array.isArray(clss)) {
          for (let i = 0; i < clss.length; i++) {
            el.classList.add(clss[i]);
          }
        } else {
          el.classList.add(clss);
        }
      }
      if (id !== null) {
        el.setAttribute("id", id);
      }
      if (txt !== null) {
        let txtNode = document.createTextNode(txt);
        el.appendChild(txtNode);
      }
      return el;
    }
  
    /**
     * Returns the amount of days for a given month and year
     *
     * @param int month (1 - Jan to 12 - Dec)
     * @param int year
     *
     * @return int
     */
    amountOfDays(month, year) {
      return new Date(year, month, 0).getDate();
    }
  
    /**
     * Returns the index of weekday for a given month and year
     *
     * @param int month (1 - Jan to 12 - Dec)
     * @param int year
     *
     * @return int (0 - Sun to 6 - Sat)
     */
    firstDayIdx(month, year) {
      return new Date(year, month, 1).getDay();
    }
    clearCally() {
      let days = document.getElementsByClassName("day");
      if (days[0] != undefined) {
        for (let i = 0; i < days.length; i++) {
          days[i].innerHTML = "";
           if (days[i].classList.contains("marked")) {
            days[i].classList.remove("marked");
          }
          if (days[i].classList.contains("hoverable")) {
            days[i].classList.remove("hoverable");
          }
        }
      }
    }
    setCally(date = null) {
      if (date === null) {
        date = this.today;
      } else {
        this.values.day = date.getDate();
        this.values.month = date.getMonth();
        this.values.year = date.getFullYear();
        this.values.minute = date.getMinutes();
        this.values.hour = date.getHours();
      }
      /** Stunden setzen */
      this.containers.hour.innerHTML =
        this.values.hour < 10 ? "0" + this.values.hour : this.values.hour + "";
  
      /** Minuten Setzen */
      this.containers.minute.innerHTML =
        this.values.minute < 10
          ? "0" + this.values.minute
          : this.values.minute + "";
      this.containers.year.innerHTML = this.values.year;
      this.containers.month.innerHTML = this.monthNames[this.lang][
        this.values.month
      ];
      this.clearCally();
      let numDays = this.amountOfDays(this.values.month + 1, this.values.year);
      let weekCnt = 0;
      /**
       * First day of a month is a ... 0 == Mo , 6 == Su 
       * (native is 0 == Su, 6 == Sa)
       */
      let dayCnt = this.firstDayIdx(this.values.month, this.values.year);
      dayCnt = dayCnt === 0 ? 6 : dayCnt - 1;
      for (let i = 0; i < numDays; i++) {
        let col = document.getElementById("d" + weekCnt + ":" + dayCnt);
        col.classList.add("hoverable");
        col.appendChild(document.createTextNode(i + 1));
        col.classList.remove("marked");
        if (i + 1 === this.values.day) {
          col.classList.add("marked");
        }
        dayCnt++;
        if (dayCnt == 7) {
          weekCnt++;
          dayCnt = 0;
        }
      }
    }
    setValue(tar = null){
        if(tar === null){
          document.getElementById("showCally").value=this.iso;
          return;
        }
        document.getElementById(tar).value = this.iso;
    }
  }


let cally;
(function(window, document) {
    cally = new Calendary({ lang: "de" });
    // A random date
    //today.setCally(new Date("December 17, 1995 03:24:00"));
    // Value of a datetime input
    let cali = document.getElementById("showCally");
    //today.setCally(new Date(cali.value));
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