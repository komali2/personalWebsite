var xCenter = 75;
var yCenter = 75;
var r = 50;
var now = new Date();

var draw = function(){
  var canvas = document.getElementById('clock');
  var context = canvas.getContext('2d');
  context.arc(75,75,50,0, 2 * Math.PI, false);
  context.fillStyle = "blue";
  context.fill();
  drawHashes(context);
  drawHours(context);

  window.requestAnimationFrame(draw)
};

var drawHashes = function(context){
  var step = 2*Math.PI / 12;
  var small = 0.8;
  var big = 1.2;
  for(var theta = 0; theta < 2*Math.PI; theta += step){
    var bigx = xCenter + (r*big) * Math.cos(theta);
    var bigy = yCenter - (r*big) * Math.sin(theta);
    var smallx = (xCenter + (r*small) * Math.cos(theta));
    var smally = (yCenter - (r*small) * Math.sin(theta));
    context.beginPath();
    context.moveTo(bigx,bigy);
    context.lineTo(smallx, smally);
    context.stroke();
    context.closePath();
  };
 /*
  context.save();
  context.lineWidth = 2;
  for(var i = 0; i < 60; i++){
    if(i%5 !== 0){
      context.beginPath();
      context.moveTo
    }
  } */
};

var drawHours = function (context){
  var step = 2*Math.PI/12;
  var hour = now.getHours();
  hour = hour >= 12 ? hour - 12 : hour;
  hour = hour * step;

  var newx = (xCenter + r * Math.cos(hour));
  var newy = (yCenter - r * Math.sin(hour));

  context.beginPath();
  context.moveTo(xCenter, yCenter);
  context.lineTo(newx, newy);
  context.stroke();
  context.closePath();
}
