//Initialize course session time variables
var startTimeFullFormat;
var startEpochTime;
var startTime;
var startHour;
var startMinutes;
var startSeconds;

var endTimeFullFormat;
var endEpochTime;
var endTime;
var endHour;
var endMinutes;
var endSeconds;

var totalSessionTimeInSeconds;

// read the current time on the computer clock when the SCORM launcher is opened
function initSessionTime(){

   startTimeFullFormat = new Date();
   startEpochTime = Math.round(startTimeFullFormat.getTime() / 1000);
   startHour = startTimeFullFormat.getHours();
   startMinutes = startTimeFullFormat.getMinutes();
   startSeconds = startTimeFullFormat.getSeconds();

   if(startMinutes < 10){
      startMinutes = "0" + startMinutes;
   }   
	if(startSeconds < 10){
		startSeconds = "0" + startSeconds;
	}

	startTime = startHour + ':' + startMinutes + ':' + startSeconds;
	console.log('Initializing session start time: ' + startTime);
}

function updateSessionTime() {

   var timeSpan;

   console.log('Updating total session time...');
   // first read the session time accumulated so far
   
   endTimeFullFormat = new Date();
   endEpochTime = Math.round(endTimeFullFormat.getTime() / 1000);


   endHour = endTimeFullFormat.getHours();
   endMinutes = endTimeFullFormat.getMinutes();
   endSeconds = endTimeFullFormat.getSeconds(); 
   endTime = endHour + ':' + endMinutes + ':' + endSeconds;
   
   console.log('Session start time was: ' + startTime);
   console.log('Setting session end time: ' + endTime);

   // now calculate the total elapsed time
   totalSessionTimeInSeconds = endEpochTime - startEpochTime;
   console.log('The total session time in seconds is: ' + totalSessionTimeInSeconds);
   

   // prepare the CMITimespan string
   var totalSessionTimeInSecondsParsed = parseInt(totalSessionTimeInSeconds, 10);

   var elapsedHours = Math.floor(totalSessionTimeInSecondsParsed / 3600);
   var elapsedMinutes = Math.floor((totalSessionTimeInSecondsParsed - (elapsedHours * 3600)) / 60);
   var elapsedSeconds =  totalSessionTimeInSecondsParsed - (elapsedHours * 3600) - (elapsedMinutes * 60);

   if (elapsedHours   < 10) {elapsedHours   = "0" + elapsedHours;}
   if (elapsedMinutes < 10) {elapsedMinutes = "0" + elapsedMinutes;}
   if (elapsedSeconds < 10) {elapsedSeconds = "0" + elapsedSeconds;}

   timeSpan = 'PT' + elapsedHours + 'H' + elapsedMinutes + 'M' + elapsedSeconds + 'S';
   timeSpan = '00' + elapsedHours + ':' + elapsedMinutes + ':' + elapsedSeconds + '.00';

   console.log('The total time spent it this session is: ' + timeSpan);
   return timeSpan;
}