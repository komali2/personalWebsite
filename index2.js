"use strict";

$(document).ready(()=>{
    $(window).scroll(()=>{
        console.log('scrolled', $(window).scrollTop());
        if($(window).scrollTop() >= 100){
            // $('.whenBig').toggle(false);
            // $('.whenSmall').toggle(true);
            // $('.banner').css('flex-basis', '100px');
            // $('.banner').addClass('small');
        } else{
            // $('.whenBig').toggle(true);
            // $('.whenSmall').toggle(false);
            // $('.banner').css('flex-basis', '400px');
        }
    })
});

//one "scroll" is 100px