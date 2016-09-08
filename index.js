"use strict";

$(document).ready(() => {

  $('.tech i').on('click', function (event) {
    $(this).siblings().toggle();
    $(`#${$(this).data('tech')}`).toggle();
    if ($(this).hasClass('big')) {
      $(this).removeClass('big');
    }
    else {
      $(this).addClass('big');
    }
  });

  $('.projects li').on('click', function (event) {
    $('.info').hide();
    $('.projectItem').hide();
    $(`#${$(this).data('name')}`).toggle();
    $($(this).next().toggle());
    
  });
});