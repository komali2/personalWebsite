var width = 500;
var height = 500;

var draw = function(){
  var date = new Date();
  var canvas = document.getElementById('drawer');
  var context = canvas.getContext('2d');
  context.save();
  context.clearRect(0,0,width,height);
  context.translate(width/2,height/2);
  context.rotate(-Math.PI/2);
  var seconds = date.getSeconds();
  context.fillStyle = 'orange';
  context.fillRect(0, 0 ,-250,-250);

  window.requestAnimationFrame(draw);
  context.restore();
};
