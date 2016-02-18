/*
Using the JavaScript language, have the function
LetterChanges(str) take the str parameter being
 passed and modify it using the following algorithm.
  Replace every letter in the string with the letter
   following it in the alphabet (ie. c becomes d, z
   becomes a). Then capitalize every vowel in this new
    string (a, e, i, o, u) and finally return this
     modified string. 
*/

function LetterChanges(str) {
   var stringArray = str.split("");

  stringArray = stringArray.map(function(char){
  	if(((char.charCodeAt(0) >= 65) && (char.charCodeAt(0) <= 90)) || ((char.charCodeAt(0) >= 97) && (char.charCodeAt(0) <= 122))){
      return String.fromCharCode(char.charCodeAt(0) + 1);}
    else{return char};
  }).map(function(char){
  	var charUp = char.toUpperCase();
    if(charUp === 'A' || charUp === 'E' || charUp === 'I' || charUp === 'O' || charUp === 'U'){
    	return charUp;
    }
    else{return char;}
  });
  return stringArray.join("");

}
