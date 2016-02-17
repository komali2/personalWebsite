

var draw = function(){
  var canvas = document.getElementById('clock');
  var context = canvas.getContext('2d');
  context.arc(75,75,50,0, 2 * Math.PI, false);
  context.fillStyle = "blue";
  context.fill();
  var step = 2*Math.PI / 12;
  var xCord = 75;
  var yCord = 75;
  var r = 50;
  var small = 0.5;
  //context.beginPath();
  for(var theta = 0; theta < 2*Math.PI; theta += step){
    var x = xCord + r * Math.cos(theta);
    var y = yCord - r * Math.sin(theta);
    context.moveTo(x,y);
    var smallx = (xCord + (r*small) * Math.cos(theta));
    var smally = (yCord - (r*small) * Math.sin(theta));
    context.fillStyle = "red";
    context.fillRect(smallx, smally, 10, 10);
    context.beginPath();
    context.lineTo(smallx, smally);
    context.closePath();
    context.stroke();
  }
  //context.closePath();
  //context.stroke();
};

var drawHashes = function(context){
  context.moveTo(125,75);
};
