function stringReverse(str) {
  var stringOut = "";
  for(var i = 0; i < str.length; i++){
   stringOut += str.substr(str.length - 1 - i, 1);

  }
  return stringOut;

}
