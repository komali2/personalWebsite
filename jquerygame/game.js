

var draw = function(){
  var canvas = document.getElementById('clock');
  var context = canvas.getContext('2d');
  context.arc(75,75,50,0, 2 * Math.PI, false);
  context.fillStyle = "blue";
  context.fill();
}
