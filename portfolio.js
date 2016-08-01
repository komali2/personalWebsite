$(".portfolio :button").click(function(){
    var test = $(this)[0].dataset.name;
    console.log(test);
    var test2 = $("<div>Hello</div>");
    $(`.portfolio .${test}`).append(test2);
    $('.portfolio.gitnalysis').append(test2);
    
})