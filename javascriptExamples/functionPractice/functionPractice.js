function showDropdown(){
  document.getElementById("functionChooser").classList.toggle("show");
}

window.onclick = function(event){
  if(!event.target.matches('.dropbtn')){
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for(var i = 0; i < dropdowns.length; i++){
      var openDropdown = dropdowns[i];
      if(openDropdown.classList.contains('show')){
        openDropdown.classList.remove('show');
      }
    }
  }
}

function showFunction(element){
  var iFrameName = document.getElementById(element.id) + "iFrame");
  var iFrameContent = iFrameName.contentDocument.body.innerHTML;
  document.getElementById("originalContent").innerHTML = iFrameContent;

}
