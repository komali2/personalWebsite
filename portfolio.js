$(".portfolio :button").click(function(){
    var name = $(this)[0].dataset.name;
    $(`.portfolio.${name}`).append('hello');
    
})