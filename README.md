# ZGK Aufgaben Planer
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


