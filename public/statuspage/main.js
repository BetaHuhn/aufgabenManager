async function checkStatus() {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const response = await fetch('/api/v1/status?page=' + window.location.pathname + window.location.search, options);
    const json = await response.json();
    if (json.status == 200) {
        console.log(json);
        var div = document.createElement('div');
        div.className = 'status-page-container';
        document.body.appendChild(div);
        var description = {
            "none": "Seite ist voll Funktionsfähigkeit",
            "maintenance": "Platform wird gewartet",
            "minor": "Es kann teilweise zu Fehlern kommen",
            "major": "Aktuell nur beschränkte Leistung",
            "critical": "Kritischer Systemausfall",
            "All Systems Operational": "Seite ist voll Funktionsfähigkeit",
            "Service Under Maintenance": "Platform wird gewartet",
            "Partially Degraded Service": "Es kann teilweise zu Fehlern kommen",
            "Minor Service Outage": "Aktuell nur beschränkte Leistung",
            "Partial System Outage": "Kritischer Systemausfall"
        }
        var indicator = {
            "Seite ist voll Funktionsfähigkeit":"none",
            "Platform wird gewartet":"maintenance",
            "Es kann teilweise zu Fehlern kommen":"minor",
            "Aktuell nur beschränkte Leistung": "major",
            "Kritischer Systemausfall":"critical"
        }
        var status = {
            investigating: "Ermitteln",
            identified: "Indentifiziert",
            monitoring: "Überwachen",
            resolved: "Gelöst"
        }
        console.log(json.data.status.description)
        console.log(description[json.data.status.description])
        console.log(indicator[description[json.data.status.description]])
        if(json.data.status.indicator == "none"){
            console.log("no status reports")
        }else{
            console.log(description[json.data.status.description])
            div.innerHTML = '<a class="status-page-link status-page-indicator-' + indicator[description[json.data.status.description]] + '" href="https://' + json.data.page.id + '.statuspage.io/" target="_blank" title="' + description[json.data.status.description] + '">' + description[json.data.status.description] + '</a>';
            var updates = ""
            var div2 = document.createElement('div')
            div2.className = 'status-page-text status-page-indicator-' + indicator[description[json.data.status.description]]
            div.appendChild(div2)
            if(json.data.scheduled_maintenances.length >= 1){
                for(i in json.data.scheduled_maintenances[0].incident_updates){
                    var body = "<p>vor " + dateDifference((new Date(json.data.scheduled_maintenances[0].incident_updates[i].updated_at)), new Date()) + " - " + json.data.scheduled_maintenances[0].incident_updates[i].body + " [" + status[json.data.scheduled_maintenances[0].incident_updates[i].status] + "]" + "</p>"
                    updates += body
                }
                var name = json.data.scheduled_maintenances[0].name;
                div2.innerHTML = `<p>Meldung: ${name}</p><p>Updates:</p>` + updates
            }else if(json.data.incidents.length >= 1){
                for(i in json.data.incidents[0].incident_updates){
                    var body = "<p>vor " + dateDifference((new Date(json.data.incidents[0].incident_updates[i].updated_at)), new Date()) + " - " + json.data.incidents[0].incident_updates[i].body + " [" + status[json.data.incidents[0].incident_updates[i].status] + "]" + "</p>"
                    updates += body
                }
                var name = json.data.incidents[0].name;
                div2.innerHTML = `<p>Meldung: ${name}</p><p>Updates:</p>` + updates
            }else if(json.data.components.filter(function(e) { return e.status != 'operational'; }).length > 0){
                console.log("found")
                if(json.data.components[i].name == 'DigitalOcean FRA1'){
                    var name = json.data.components[i].status;
                    div2.innerHTML = "<p>vor " + dateDifference((new Date(json.data.components[i].updated_at)), new Date()) + " - " + ` ${name}, unser hosing provider hat zurzeit probleme. Dadurch kann es auch bei uns zu Fehlern kommen.</p>`
                }else{
                    div2.innerHTML = `<p>Derzeit keine weiteren Informationen verfügbar</p>`
                }
            }else{
                div2.innerHTML = `<p>Derzeit keine weiteren Informationen verfügbar</p>`
            }
        }
        
    } else {
       console.log(json)
    }
}

function dateDifference(a, b){
    b.getTime() - a.getTime()
    var secondsDiff = (b.getTime() - a.getTime())/1000
    if (secondsDiff > 86400)  { 
        return Math.floor(secondsDiff/86400) + ' D'
       }
       if (secondsDiff > 3600)  { 
        return Math.floor(secondsDiff/3600) + ' h'
       }
       if (secondsDiff > 60)  { 
        return Math.floor(secondsDiff/60) + ' min'
       }
       if (secondsDiff > 0) { 
        return secondsDiff + ' sec'
       }
}

checkStatus()