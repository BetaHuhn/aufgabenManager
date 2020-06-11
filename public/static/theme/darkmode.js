/* Darkmode Support */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
if(toggleSwitch != undefined){
    detectDarkMode()
}

/* Dark Mode switch logic */
function swichToLight(){
    let pictures = ['AufgabenView', 'Aufgabe', 'AufgabeLehrer', 'AufgabenMobile', 'AufgabeLehrerMobile']
    for(i in pictures){
        let image = document.getElementById(pictures[i])
        if(image) { image.src = "/static/previews/" + pictures[i] + "Light.png" }
    }
    document.documentElement.setAttribute('data-theme', 'light');
    toggleSwitch.checked = false;
    document.getElementById('checkboxIcon').className = "fas fa-adjust light"
    localStorage.setItem('darkmode', 'false');
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
    localStorage.setItem('darkmode', 'true');
}

/* Switch theme when slider changes */
function switchThemeSlider() {
    if (toggleSwitch.checked) {
        swichToDark()
    } else {
        swichToLight()
    }
}

/* Switch when prefers-color-scheme changes */
function switchThemePrefers() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        swichToDark()
    } else {
        swichToLight()
    }
}

/* Runs in the beginning. Checks if System Dark mode is on or if preference set in local storage */
function detectDarkMode() {
    const storageValue = localStorage.getItem('darkmode');
    if (storageValue == 'false') {
        swichToLight()
    } else if (storageValue == 'true') {
        swichToDark()
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        swichToDark()
    } else {
        swichToLight()
    }
    /* Attach event listeners to prefers-color-scheme and toggle */
    window.matchMedia("(prefers-color-scheme: dark)").addListener(e => e.matches && switchThemePrefers())
    window.matchMedia("(prefers-color-scheme: light)").addListener(e => e.matches && switchThemePrefers())
    toggleSwitch.addEventListener('change', switchThemeSlider, false);
}