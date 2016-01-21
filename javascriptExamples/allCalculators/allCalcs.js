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

//this should make something appear below the dropdown menu
function showCalc(element){
  alert(element.id);
  iFrameName = document.getElementById("newContent");
  iFrameContent = iFrameName.contentDocument.body.innerHTML;
  //iFrameName.style.display="block";
  document.getElementById("originalContent").innerHTML= iFrameContent;

}
