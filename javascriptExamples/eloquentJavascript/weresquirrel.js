require('journalholder.js');

if (typeof module != "undefined" && module.exports)
  module.exports = JOURNAL;

var journalTest = [
  {
    events:["work","touched tree","pizza","running","television"],
    squirrel: false
  },
  {
    events:["work", "ice cream", "cauliflower","lasagna","touched tree", "brushed teeth"],
    squirrel: false
  },
  {
    events:["weekend","cycling","break","peanuts","beer"],
    squirrel: true
  }
];

function addEntry(events,didITurnIntoASquirrel){
  journalTest.push({
    events: events,
    squirrel: didITurnIntoASquirrel
  });
}

addEntry(["work","touched tree","pizza","running","television"],false);
addEntry(["work","ice cream","cauliflower","lasagna","touched tree","brushed teeth"],false);
addEntry(["weekend","cycling","break","peanuts","beer"],true);

//calculate phi based on a table
//phi = n11*n00 - n10*n01 / sqrt(n1# * n0# * n#1 * n#0)
function phi(table){
  return(table[3] * table[0] - table[2] * table[1]) /
  Math.sqrt((table[2] + table[3]) *
            (table[1] + table[0]) *
            (table[1] + table[3]) *
            (table[0] + table[2]));
}

console.log(phi([76,9,4,1]));
// 0.068

//extract a two by two table for a specific event from the journal
//do this by looping over all entries and tallying up how many times occured

//tests whether contains given event. indexof returns index found at or -1
//if not found. So if not -1 then we know it was found
//returns true if not equal to -1, returns false if not found
function hasEvent(event,entry){
  return entry.events.indexOf(event) != -1;
}

function tableFor(event,journal){
  var table = [0,0,0,0];
  for(var i = 0; i < journal.length; i++){
    var entry = journal[i], index = 0;
    if(hasEvent(event,entry))
      index+= 1;
    if(entry.squirrel)
      index += 2;
    table[index] += 1;
  }
  return table;
}

console.log(tableFor("pizza", JOURNAL));
//[76,9,4,1]

var map = {};

//this works because map[event] will chanage whatever is passed in as "event"
//or create a new "event" with the value of "phi"
function storePhi(event, phi){
  map[event] = phi;
}

storePhi("pizza", 0.069);
storePhi("touched tree", -0.081);
console.log("pizza" in map);
//true
console.log(map["touched tree"]);
//-0.081

for(var event in map)
  console.log("The correlation for '" + event + "' is " + map[event]);
//The correlation for 'pizza' is 0.069
//The correlation for 'touched tree' is -0.081

function gatherCorrelations(journal){
  var phis = {};
  for(var entry = 0; entry < journal.length; entry++){
    var events = journal[entry].events;
    for(var i = 0; i < events.length; i++){
      var event = events[i];
      if(!(event in phis))
        phis[event] = phi(tableFor(event, journal));
    }
  }
  return phis;
}

var correlations = gatherCorrelations(JOURNAL);
console.log(correlations.pizza);
//0.0685
for(var event in correlations)
  console.log(event + ": " + correlations[event]);

  for(var event in correlations){
    var correlation = correlations[event];
    if(correlation > 0.1 || correlation < -0.1)
      console.log(event + ": " + correlation);
  }

for(var i = 0; i < JOURNAL.length; i++){
  var entry = JOURNAL[i];
  if(hasEvent("peanuts", entry) && !hasEvent("brushed teeth", entry))
    entry.events.push("peanut teeth");
}
console.log(phi(tableFor("peanut teeth", JOURNAL)));
