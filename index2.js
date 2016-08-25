"use strict";

$(document).ready(()=>{
    $(window).scroll(()=>{
        console.log('scrolled', $(window).scrollTop());
        if($(window).scrollTop() >= 200){
            $('.whenBig').toggle(false);
            $('.whenSmall').toggle(true);
        } else{
            $('.whenBig').toggle(true);
            $('.whenSmall').toggle(false);
        }
    })
});

//one "scroll" is 100px