var draw = function(){
  var date = new Date();
  var canvas = document.getElementById('drawer');
  var context = canvas.getContext('2d');
  context.save();
  //context.clearRect(0,0,500,500);
  context.translate(250,250);
  context.rotate(-Math.PI/2);

  context.fillStyle = 'orange';
  context.fillRect(0,0,100,100);
};
