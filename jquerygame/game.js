

var draw = function(){
  var canvas = document.getElementById('clock');
  var context = canvas.getContext('2d');
  context.arc(75,75,50,0, 2 * Math.PI, false);
  context.fillStyle = "blue";
  context.fill();
  var step = 2*Math.PI / 12;
  var xCenter = 75;
  var yCenter = 75;
  var r = 50;
  var small = 0.8;
  var big = 1.2;
  //context.beginPath();
  for(var theta = 0; theta < 2*Math.PI; theta += step){
    var bigx = xCenter + (r*big) * Math.cos(theta);
    var bigy = yCenter - (r*big) * Math.sin(theta);
    var smallx = (xCenter + (r*small) * Math.cos(theta));
    var smally = (yCenter - (r*small) * Math.sin(theta));
    context.fillStyle = "red";
    context.beginPath();
    context.moveTo(bigx,bigy);
    context.lineTo(smallx, smally);
    context.stroke();
    context.closePath();
  }
  //context.closePath();
  //context.stroke();
};

var drawHashes = function(context){
  
};
