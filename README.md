# Aufgaben Manager
Ein auf Node.js basierender Aufgaben Manager für Schulen.

Vorschau: [zgk.mxis.ch](https://zgk.mxis.ch)

![Home Page](https://zgk.mxis.ch/static/previews/MockupLight.png)
## Features
- Unterstützt mehrere Schulen/Klassen
- Rollenverteilung nach Lehrern und Schülern
- Jeder User hat eigenen eigenen Account mit dem er nur auf bestimmte Aufgaben zugriff hat
- Lehrer können Aufgaben für ihr Fach und eine bestimmte Klasse erstellen (mit Abgabetermin)
- Aufgaben unterstützen sowohl Text als auch Dateien
- Schüler sehen in einem übersichtlichem Dashboard alle Aufgaben ihrer Klasse
- Schüler können ihre Lösung für eine Aufgabe direkt über die Platform hochladen (Auch mehrere Lösungen)
- Lehrer sehen in einer übersichtlichen Tabelle welcher Schüler eine Lösung abgegeben hat und wer nicht und kann diese dann herunterladen
- Schüler können sich über einen Klassen-Invite-Link registrieren, es müssen also lediglich Klassen und Lehrer Accounts angelegt werden
- Zusätzlich kann ein Discord und Telegram Bot eingerichtet werden welcher die Schüler bei neuen Aufgaben benachrichtigt
- Umfassende REST API für Anbindung an andere Dienste

## Geplannt
- Übersichtliches Admin Panel für die Verwaltung von Klassen und Usern
- Erstellen von Schüler Accounts im vorraus mit temporären Passwörtern

## Anforderungen
- Node.js (v12.13.0 oder neuer)
- MongoDB

## Dokumention 
[zgk.mxis.ch/dokumentation](https://zgk.mxis.ch/dokumentation)

## API
### Alle aktuellen Aufgaben holen
```
GET https://zgk.mxis.ch/api/v1/get/aufgabe
```
```json
{
    "status": "200",
    "response": "success",
    "type": "data",
    "data": [{
        "aufgaben_id": "ID",
        "text": "Aufgabe 5-6 auf Seite 10",
        "fach": "Deutsch",
        "abgabe": "2020-03-23T14:59:07.000Z",
        "klasse":"TG11I",
        "files": {
            "count": 0,
            "type": "zip",
            "fileName": "aufgaben",
            "fileUrl": "https://zgk.mxis.ch/api/v1/download/ID"
        },
        "user_id": "ID",
        "createdAt": "2020-03-23T16:14:39.000Z",
        "downloads": 0
      },
      {
        "aufgaben_id": "ID",
        "text": "Aufgabe 5-6 auf Seite 10",
        "fach": "Deutsch",
        "abgabe": "2020-03-23T14:59:07.000Z",
        "klasse":"TG11I",
        "files": {
            "count": 0,
            "type": "zip",
            "fileName": "aufgaben",
            "fileUrl": "https://zgk.mxis.ch/api/v1/download/ID"
        },
        "user_id": "ID",
        "createdAt": "2020-03-23T16:14:39.000Z",
        "downloads": 0
      }]
}
```

### Eine bestimmte Aufgabe holen
Entweder mit aufgaben_id, user_id, klasse oder abgabe (in UTC Zeit bsp: 2020-03-25T00:00:00.000Z)
```
GET https://zgk.mxis.ch/api/v1/get/aufgabe?id=ID
```
```json
{
    "status": "200",
    "response": "success",
    "type": "data",
    "data": {
        "aufgaben_id": "ID",
        "text": "Aufgabe 5-6 auf Seite 10",
        "fach": "Deutsch",
        "abgabe": "2020-03-23T14:59:07.000Z",
        "klasse":"TG11I",
        "files": {
            "count": 0,
            "type": "zip",
            "fileName": "aufgaben",
            "fileUrl": "https://zgk.mxis.ch/api/v1/download/ID"
        },
        "user_id": "ID",
        "createdAt": "2020-03-23T16:14:39.000Z",
        "downloads": 0
    }
}
```

### Alle User holen
```
GET https://zgk.mxis.ch/api/v1/get/user
```
```json
{
    "status": "200",
    "response": "success",
    "type": "data",
    "data": [{
        "user_id": "ID",
        "name": "name",
        "email": "email",
        "klassen":["TG11I"],
        "role":"lehrer",
        "registeredAt":"DATE",
        "lastLogin": "DATE"
      },
      {
        "user_id": "ID",
        "name": "name",
        "email": "email",
        "klassen":["TG11I"],
        "role":"user",
        "registeredAt":"DATE",
        "lastLogin": "DATE"
      }]
}
```

### Bestimmte User holen
Entweder mit user_id, klasse, role oder email
```
GET https://zgk.mxis.ch/api/v1/get/user?role=ROLLE
```
```json
{
    "status": "200",
    "response": "success",
    "type": "data",
    "data": [{
        "user_id": "ID",
        "name": "name",
        "email": "email",
        "klassen":["TG11I"],
        "role":"lehrer",
        "registeredAt":"DATE",
        "lastLogin": "DATE"
      },
      {
        "user_id": "ID",
        "name": "name",
        "klassen":["TG11I"],
        "email": "email",
        "role":"lehrer",
        "registeredAt":"DATE",
        "lastLogin": "DATE"
      }]
}
```


### Aufgabe erstellen OHNE DATEIEN
```
POST https://zgk.mxis.ch/api/v1/create/aufgabe
```
POST body:
```json
{
    "text": "Aufgabe 5-6 auf Seite 10",
    "fach": "Deutsch",
    "abgabe": "2020-03-23T14:59:07.000Z",
    "filename":"NAME",
    "user_id": "ID",
}
```
Antwort:
```json
{
    "status": "200",
    "response": "success",
    "type": "data",
    "data": {
        "aufgaben_id": "ID",
        "createdAt": "2020-03-23T16:14:39.000Z",
        "downloads": 0
    }
}
```

### Aufgabe löschen
```
GET https://zgk.mxis.ch/api/v1/delete/aufgabe?id=ID
```

```json
{
    "status": "200",
    "response": "success"
}
```


### Invites holen
Entweder mit invite_id, token, klasse, role, type, name oder alle wenn kein Paramter geschickt wird
```
GET https://zgk.mxis.ch/api/v1/get/invites?token=TOKEN
```
```json
{
    "status": 200,
    "response": "success",
    "type": "data",
    "data": [
        {
            "name": "INVITE NAME",
            "token": "TOKEN",
            "role": "user",
            "type": "klasse",
            "klasse": "TG11I",
            "used": 2,
            "active": true,
            "max": 20,
            "inviteUrl": "https://zgk.mxis.ch/register?token=TOKEN"
        }
    ]
}
```


