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

    $('.tech img').on('click', function(event){
        // $('.tech img').toggle();
        $(this).siblings().addClass('goAway');
        $(this).addClass('selectMe');
        // $(this).toggle();
        // if($(this).hasClass('full')){
        //     $(this).removeClass('full');
        // }else{
        //     $(this).addClass('full');
        // }
        
    });
    var called = 0; 

    $('.tech img').on('animationend', function(){
        if(called === 0){
            $('.tech img').toggle();
            $('.selectMe').toggle();
            console.log('heard event');
            $('.selectMe').addClass('comeHere');
            called++;
        }
    })
});

//one "scroll" is 100px