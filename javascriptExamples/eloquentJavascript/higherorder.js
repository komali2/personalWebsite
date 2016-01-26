function logEach(array){
  for(var i = 0; i < array.length; i++)
  console.log(array[i]);

}

function forEach(array,action){
  for(var i = 0; i < array.length; i++)
  action(array[i])
}

function greaterThan(n){
  return function(m){return m > n;};
}

var is3greater = greaterThan(3);

console.log(is3greater(2));
//false

function noisy(f){
  return function(arg){
    console.log("calling with", arg);
    var val = f(arg);
    console.log("called with", arg, "- got", val);
    return val;
  };

noise(Boolean)(0);
//calling with 0
//caled wiht 0, got false

function unless(test, then){
  if(!test) then();
}

function repeat(times,body){
  for (var i = 0; i < times; i++) body(i);
}

repeat(3,function(n){
  unless(n%2, function(){
    console.log(n,"is even");
  });
});
//0 is even
//2 is even
