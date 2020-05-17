/* Darkmode Support */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
if(toggleSwitch != undefined){
    detectDarkMode()
}

/* Dark Mode switch logic */

//Gets a cookie by key
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}

function swichToLight(){
    let pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    for(i in pictures){
        let image = document.getElementById(pictures[i])
        if(image) { image.src = "/static/previews/" + pictures[i] + "Light.png" }
    }
    document.documentElement.setAttribute('data-theme', 'light');
    toggleSwitch.checked = false;
    document.getElementById('checkboxIcon').className = "fas fa-adjust light"
    document.cookie = "darkmode=false;path=/;domain=zgk.mxis.ch";
}

function swichToDark(){
    let pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    for(i in pictures){
        let image = document.getElementById(pictures[i])
        if(image) { image.src = "/static/previews/" + pictures[i] + "Dark.png" }
    }
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleSwitch.checked = true;
    document.getElementById('checkboxIcon').className = "fas fa-adjust dark"
    document.cookie = "darkmode=true;path=/;domain=zgk.mxis.ch";
}

//Switch theme when slider changes
function switchThemeSlider() {
    if (toggleSwitch.checked) {
        swichToDark()
    } else {
        swichToLight()
    }
}

//Switch between light and dark theme
function switchTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        swichToDark()
    } else {
        swichToLight()
    }
}

//Runs in the beginning. Checks if System Dark mode is on or if preference set in cookie
function detectDarkMode() {
    if (getCookie('darkmode') == 'false') {
        swichToLight()
    } else if (getCookie('darkmode') == 'true') {
        swichToDark()
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        swichToDark()
    } else {
        swichToLight()
    }
    window.matchMedia("(prefers-color-scheme: dark)").addListener(e => e.matches && switchTheme())
    window.matchMedia("(prefers-color-scheme: light)").addListener(e => e.matches && switchTheme())
    toggleSwitch.addEventListener('change', switchThemeSlider, false);
}