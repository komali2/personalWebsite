$(document).ready(function(){
    $.ajax({
        method: 'GET',
        url: 'https://agent.electricimp.com/wDugtnYow2tX/readings'
    }).done(function(response){
        console.log(response);
        buildElements(response);

    }).catch(function(error){

    });

    function buildElements(obj){
        $.each(obj, function(key, val){
            buildElement(key, obj);
        });
    }


    function buildElement(key, obj){
        $('#' + key).html(obj[key])
    }
});