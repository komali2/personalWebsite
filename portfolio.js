$(".portfolio :button").click(function(){
    var name = $(this)[0].dataset.name;
    $(`.portfolio.${name}`).append($(`.info.${name}`));
    $(`.info.${name}`).toggle();
    
})