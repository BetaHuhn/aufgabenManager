//main.js
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