/*
later, I want it to take a calculator argument so I can have a list of different
calculators that open up
*/
function openCalculator(){
  document.getElementById("triangle").innerHTML =
  '<form id="triangleform"> ' +
  '<br>First side:  <input type="text" name="side1"><br>Second Side <input type="text" name="side2"> <br>Third Side <input type="text" name="side3"><br>'
  + '<br><input type="button" name="button" value="Click" onClick="calculateTrianglePerimeter(this.form)"></form>'
}


function calculateTrianglePerimeter(form){
  var side1 = parseInt(form.side1.value);
  var side2 = parseInt(form.side2.value);
  var side3 = parseInt(form.side3.value);
  var perimeter = (side1 + side2 + side3);
  document.getElementById("triangle").innerHTML =
  'Your triangle perimeter is ' + perimeter + '.';
}


/*
function getFormValue(form){
  var object = {
    side1: form.side1.value;
    side2: form.side2.value;
    side3: form.side3.value;
  };
  return object;
}*/
/*
function getSideValue(){
  var side2 = document.forms["triangleform"]["side2"].value;
  alert(side2);
}*/
