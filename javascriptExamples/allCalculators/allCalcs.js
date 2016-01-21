function showDropdown(){
  document.getElementById("calcChooser").classList.toggle("show");
}

window.onclick = function(event){
  if(!event.target.matches('.dropbtn')){
    var dropdowns= document.getElementsByClassName("dropdown-content");
    var i;
    for(i = 0; i < dropdowns.length; i++){
      var openDropdown = dropdowns[i];
      if(openDropdown.classList.contains('show'))
      {
        openDropdown.classList.remove('show');
      }
    }
  }
}

//have the chosen calculator appear below the dropdown menu
function showCalc(element){
  iFrameName = document.getElementById(String(element.id) + "Calculator");
  iFrameContent = iFrameName.contentDocument.body.innerHTML;
  document.getElementById("originalContent").innerHTML= iFrameContent;
}

//TODO: find a way to split apart the "printing" part of these functions
function calculateTrianglePerimeter(form){
  var side1 = parseInt(form.side1.value);
  var side2 = parseInt(form.side2.value);
  var side3 = parseInt(form.side3.value);

  var perimeter = (side1 + side2 + side3);
  document.getElementById("originalContent").innerHTML = 'Your triangle perimeter is ' + perimeter + '.';
}


function calculateSquareArea(form){
  var side1 = parseInt(form.side1.value);
  var side2 = parseInt(form.side2.value);
  var area = (side1 * side2);

  document.getElementById("originalContent").innerHTML = 'Your square area is ' + area + '.';
}
