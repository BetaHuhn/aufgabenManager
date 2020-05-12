//main.js
function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }


setInterval(function(){ 
    var dot = document.getElementById("dot")
    dot.className = (dot.className == 'green') ? 'blink' : 'green';
}, 1000);