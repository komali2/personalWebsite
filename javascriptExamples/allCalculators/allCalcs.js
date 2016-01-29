function showDropdown(){
  document.getElementById("calcChooser").classList.toggle("show");
}

window.onclick = function(event){
  if(!event.target.matches('.dropbtn')){
    var dropdowns= document.getElementsByClassName("dropdown-content");
    var i;
    for(i = 0; i < dropdowns.length; i++){
      var openDropdown = dropdowns[i];
      if(openDropdown.classList.contains('show'))
      {
        openDropdown.classList.remove('show');
      }
    }
  }
}

//have the chosen calculator appear below the dropdown menu
function showCalc(element){
  iFrameName = document.getElementById(String(element.id) + "Calculator");
  iFrameContent = iFrameName.contentDocument.body.innerHTML;
  document.getElementById("originalContent").innerHTML= iFrameContent;
}

//TODO: find a way to split apart the "printing" part of these functions
function calculateTrianglePerimeter(form){
  var side1 = parseInt(form.side1.value);
  var side2 = parseInt(form.side2.value);
  var side3 = parseInt(form.side3.value);

  var perimeter = (side1 + side2 + side3);
  document.getElementById("originalContent").innerHTML = 'Your triangle perimeter is ' + perimeter + '.';
}


function calculateSquareArea(form){
  var side1 = parseInt(form.side1.value);
  var side2 = parseInt(form.side2.value);
  var area = (side1 * side2);

  document.getElementById("originalContent").innerHTML = 'Your square area is ' + area + '.';
}

function showDateTime(){
  var date = new Date();
  var day = date.getDate();
  var month = date.getMonth();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var week = date.getDay();
  var year = date.getFullYear();
  var weekList = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monthList = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  month = monthList[month];
  week = weekList[week];

  document.getElementById("originalContent").innerHTML = "The date is " + month + " the " + day + ", " + year + ". The time is " + hour + ":" + minute + ".";
}

function printScreen(){
  window.print();
}

function reverseString(form){
  reverseMe = form.stringIn.value;
  var reversed= "";

  for(var i = reverseMe.length - 1; i >= 0; i--){
    reversed += reverseMe[i];
  }

  document.getElementById("originalContent").innerHTML = reversed;
}

function guessRandom(form){
  var guess = parseInt(form.guessRandomBox.value);
  var computerGuess = Math.floor(Math.random() * 6) + 1;
  var output = "";
  if(guess === computerGuess){
    output = "You guessed right!";
  }
  else{
    output = "You guessed wrong! Correct answer was " + computerGuess+ ".";
  }

  document.getElementById("originalContent").innerHTML = output;
}

function holidayCalc(form){
  var date = new Date();
  var currDay = date.getDate();
  var currMonth = date.getMonth();
  var holidayIn = form.holidayName.value.toUpperCase();
  var monthDayCount = [31,28,31,30,31,30,31,31,30,31,30,31];
  var modifier = 0;
  var holidayList = [
    {
      name: "CHRISTMAS",
      month: 11,
      day: 5
    },
    {
      name:"NEW YEARS",
      month: 0,
      day: 1
    },
    {
      name:"MLK DAY",
      month: 0,
      day: 18
    },
    {
      name:"CHINESE NEW YEAR",
      month: 1,
      day: 8
    },
    {
      name:"VALENTINES DAY",
      month: 1,
      day: 14
    },
    {
      name:"THANKSGIVING",
      month: 10,
      day: 24
    },
    {
      name:"PEARL HARBOR DAY",
      month: 11,
      day: 7
    },
  ];
  var dayOfYear = 0;
  var dayOfHoliday = 0;
  var difference = 0;
  var output = "";

  var toDoHoliday = holidayList.filter(function(x){
    return x.name === holidayIn;
    });
  var toDoHoliday = toDoHoliday[0];

  function calculateDaysIntoYear(monthArray,month,dayModifier){
      var daysInYear = 0;
      daysInYear = monthArray.reduce(function(prev,curr,index){
        if(month === 0)
        	return 0;
        if(month > index)
          return prev += curr;
        else if(month = index)
          return prev;
      });
      return daysInYear + dayModifier;
    }

    function getDifference(yearday,holidayday){
      if(yearday <= holidayday)
        return holidayday-yearday;
      else{
        return (365 - yearday) + holidayday;
      }
    }

    dayOfYear = calculateDaysIntoYear(monthDayCount,currMonth,currDay);
    dayOfHoliday = calculateDaysIntoYear(monthDayCount,toDoHoliday.month,toDoHoliday.day);
    difference = getDifference(dayOfYear, dayOfHoliday);
    output = "You entered " + toDoHoliday.name + ", which is " + difference + " days away!";


    document.getElementById("originalContent").innerHTML = output;
}
