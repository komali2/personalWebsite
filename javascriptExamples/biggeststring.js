function biggestString(sen) { 
	var buffer = "";
  	var stringArray = [];
  for(var i = 0; i < sen.length; i++){
   	if(sen.charAt(i) === ' '){
     stringArray.push(buffer);
      buffer = "";
    }
    else if ((sen.charCodeAt(i) >= 65 && sen.charCodeAt(i) <= 90) || (sen.charCodeAt(i) >= 97 && sen.charCodeAt(i) <= 122)){
  		buffer+= sen.charAt(i);
   }
  }
 stringArray.push(buffer);

  var biggest = "";
  for(var i = 0; i < stringArray.length; i++){
   	 if(biggest.length < stringArray[i].length){
     biggest = stringArray[i];
     }
  }

  return biggest;

}
