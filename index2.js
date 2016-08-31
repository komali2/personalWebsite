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
        $(this).siblings().toggle();
        $(`#${$(this).data('tech')}`).toggle();
        if($(this).hasClass('full')){
            $(this).removeClass('full');
        }else{
            $(this).addClass('full');
        }
        
    });

    $('.projects li').on('click', function(event){
        $(`#${$(this).data('name')}`).toggle();
        $($(this).next().toggle());
    });
});

//one "scroll" is 100px