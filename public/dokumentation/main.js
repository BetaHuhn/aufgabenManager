/* main.js - Maximilian Schiller 2020 */

/* Anchor point handling */

window.addEventListener('hashchange',  onHash())

$(document).ready(function () {
    onHash()
    $(document).on("scroll", onScroll);

    //smoothscroll
    $('a[href^="#"]').on('click', function (e) {
        e.preventDefault();
        $(document).off("scroll");
        
        $('a').each(function () {
            $(this).removeClass('active');
        })
        $(this).addClass('active');
      
        var target = this.hash,
            sidebar = target;
        $target = $(target);
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top+2
        }, 500, 'swing', function () {
            window.location.hash = target;
            $(document).on("scroll", onScroll);
        });
    });
});

function onHash(){
    var hash = $(location).attr('hash');
    if(hash){
        $('a').each(function () {
            $(this).removeClass('active');
        })
        $('a[href="' + hash + '"]').addClass('active');
    }
}

function onScroll(event){
    var scrollPos = $(document).scrollTop();
    $('#sidebar a').each(function () {
        var currLink = $(this);
        var refElement = $(currLink.attr("href"));
        if (refElement.position().top + 100 <= scrollPos && refElement.position().top + refElement.height() + 100 > scrollPos) {
            $('#sidebar ul li a').removeClass("active");
            currLink.addClass("active");
        }
        else{
           // currLink.removeClass("active");
        }
    });
}

function copy(e){
    console.log(e)
    var resp = "https://zgk.mxis.ch/dokumentation#" + e.id
    var $body = document.getElementsByTagName('body')[0]
    var $tempInput = document.createElement('INPUT');
    $body.appendChild($tempInput);
    $tempInput.setAttribute('value', resp)
    $tempInput.select();
    document.execCommand('copy');
    $body.removeChild($tempInput);
    var span = document.createElement('span')
    span.className = "tooltiptext"
    span.innerHTML = "Link kopiert"
    e.appendChild(span)
    setTimeout(function() {
        e.removeChild(span);
    }, 1000);
}