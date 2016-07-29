$(".portfolio :button").click(function(){
    console.log('this data is');
    console.log($(this)[0].dataset.name);
})