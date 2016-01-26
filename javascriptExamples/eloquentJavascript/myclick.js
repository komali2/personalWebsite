function forEach(array, callback){
 for(var item in array){
 callback(array[item]);
 }
}

function reduce(array, callback, resultOrStart){
 var result = resultOrStart;
  forEach(array,function(element){
   result = callback(element);
 });
	return result;
}

function filterReduce(array,test){
 var newArray = [];
  reduce(array, function(element){
  	if(test(element))
      newArray.push(element);
  },false);
  return newArray;
}



function filter(array, test) {
  var passed = [];
  for (var i = 0; i < array.length; i++) {
    if (test(array[i]))
      passed.push(array[i]);
  }
  return passed;
}

console.log(filterReduce(ancestry, function(person){
	return person.born > 1900 && person.born < 1925;}));
console.log(filter(ancestry, function(person) {
  return person.born > 1900 && person.born < 1925;
}));
// → [{name: "Philibert Haverbeke", …}, …]

function reduce(array, combine, start) {
  var current = start;
  for (var i = 0; i < array.length; i++)
    current = combine(current, array[i]);
  return current;
}

function filter(array, test){
 var passed = [];
  reduce(array, function(current, arrayi){
  if(test(arrayi))
    passed.push(arrayi);
  },false);
  return passed;
}

myarray = [1, 2, 3, 5,];
console.log(filter(myarray, function(x){return x > 2}));

console.log(reduce([1, 2, 3, 4], function(a, b) {
  return a + b;
}, 0));
// → 10
