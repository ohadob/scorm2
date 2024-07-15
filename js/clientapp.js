var scormVarMapping = getScormVarMapping();
console.log("Retrieving scorm variables mapping");
var scormVersion;
var foundAPI = 0; 
var scormVersionSetOnPage = false;
var launchPageScormVersion = '';
var gotDetails = false;

//Set default Pipwerks wrapper value for scorm version
scorm.version = "1.2";

//If API has been found, initialize SCORM API connction and session-wide functions on course open
var initAPI = false;
var initAttempt = 1;

try{
	console.log('Checking for SCORM version set on launch page');
	launchPageScormVersion = setScormVersion();
	scorm.version = launchPageScormVersion;
	scormVersionSetOnPage = true;
}catch(err){
	console.log('Error: ' + err);
	console.log('No SCORM version set on launch page');
	scorm.version = "1.2";
}

if(scormVersionSetOnPage === true){
	console.log('SCORM version set on launch page: ' + launchPageScormVersion);
}
else{
	console.log('SCORM version not set on launch page');
}

console.log('Getting firm and course details from launch page');
try{
var packageScormFirmID = document.getElementsByTagName('script')[7].innerHTML.split(";")[0].split(',')[1].split('"')[1];
var packageCourseID = parseInt(document.getElementsByTagName('script')[7].innerHTML.split(";")[1].split(",")[1].split(")")[0].split('"')[0].replace(" ", ""));
console.log('Found SCORM Firm ID: ' + packageScormFirmID);
console.log('Found course ID: ' + packageCourseID);	
gotDetails = true;
}
catch(err){
	console.log('Error: ' + err);
}

if(gotDetails === true){
console.log('Checking for scorm version override');
try{
	var overrideScormVersion = scormVersionOverride(packageScormFirmID, packageCourseID);
}
catch(err){
	console.log('Error: ' + err);
}
if(overrideScormVersion !== false){
	console.log('Found SCORM version override: ' + overrideScormVersion);
	scorm.version = overrideScormVersion;
}
else{
	console.log('No SCORM version override found');
}
}

//Check for SCORM API
console.log('Checking for SCORM API...');
console.log('Attempting to initialize SCORM API...');


retrieveName();	//Retrieve the user name
initScore();	//Initialize the course score	
readSuspendData();	//Read the course suspend data
var userLaunchData = setUserLaunchData();	//Create object that will store end-user data to pass to remote scorm launcher page
initSessionTime();
launchCourse();

//Add event listener that listens for update messages from SCORM launcher page and updates the client LMS accordingly.
window.addEventListener('message', function(updateMessage) {

	console.log('The full posted message data: ' + updateMessage.data.toString());

	try{

		var messageData = updateMessage.data.toString();
		var messageType = messageData.split('?')[0];
		var messageParameters = messageData.split('?')[1];

		console.log('The message parameters are: ' + messageParameters);

		switch(messageType){

			case 'startSessionTime':
				console.log('Starting session time.');
			  initSessionTime();  			
			break;

			case 'setMinScore':
			  var minScore = messageParameters.split('&')[0].split('=')[1];  			
				console.log('Updating min score to ' + minScore + ' (v3)');
			  set(scormVarMapping.scoreMin[scormVersion], parseInt(minScore));		  		
			break;

			case 'setMaxScore':
				var maxScore = messageParameters.split('&')[0].split('=')[1];		
				console.log('Updating max score to ' + maxScore + ' (v3)');
			  set(scormVarMapping.scoreMax[scormVersion], parseInt(maxScore));
			break;

			default: 
			  var scoreToUpdate = parseInt(messageParameters.split('&')[0].split('=')[1]);
			  var statusToUpdate = messageParameters.split('&')[1].split('=')[1]; 
			  var clientStatusToUpdate = 'incomplete';
				console.log('Updating raw score to ' + scoreToUpdate);
			  set(scormVarMapping.scoreRaw[scormVersion], scoreToUpdate);
			  if(scormVersion === '2004'){ 
				var scaledScore = getScaledScore(scoreToUpdate, get(scormVarMapping.scoreMin[scormVersion]), get(scormVarMapping.scoreMax[scormVersion]));
				console.log('SCORM 2004: Updating scaled score to ' + scaledScore);   
				set(scormVarMapping.scoreScaled[scormVersion], scaledScore);
			  }
			  console.log('Score has been updated.');
			  
			  if(statusToUpdate === 'passed' || statusToUpdate === 'completed'){
				  clientStatusToUpdate = getSuccessStatus();
				  console.log('Checked client status to update. Check returned ' + clientStatusToUpdate);
			  }	

			  console.log('Updating completion status to ' + clientStatusToUpdate);
			  set(scormVarMapping.completionStatus[scormVersion], clientStatusToUpdate);
			  console.log('Completion status has been updated.');
			  
			  var sessionLength = updateSessionTime().toString();
			  set(scormVarMapping.sessionTime[scormVersion], sessionLength);

			  if(scormVersion === '2004'){
				var successStatus = 'unknown';
				if(statusToUpdate === 'passed' || statusToUpdate === 'completed'){
					successStatus = "passed";
				  }
				  console.log('SCORM 2004 course: updating success status to ' + successStatus);
				  set(scormVarMapping.successStatus[scormVersion], successStatus);
				  console.log('Success status has been updated.')
			  }
			  if(scorm.save() == false){
			  	console.log('WARNING: LMSCommit failed. Could not save course session data.');
			  }
			  else{
			  	scorm.save();
			  }									 				
		} 
  }
  catch(err){
	  console.log('updateClientLMS: Invalid postMessage Data. Ignoring posted message.');
	  console.log(err.message);
  }

});

///////////////////////////
///Launch page functions///
///////////////////////////

function getScormVarMapping() {

	return {

		studentID:{
			"1.2":"cmi.core.student_id",
			"2004":"cmi.learner_id"
		},
		studentName:{
			"1.2":"cmi.core.student_name",
			"2004":"cmi.learner_name"
		},
		completionStatus:{
			"1.2":"cmi.core.lesson_status",
			"2004":"cmi.completion_status"
		},
		successStatus:{
			"1.2":null,
			"2004":"cmi.success_status"
		},
		scoreRaw:{
			"1.2":"cmi.core.score.raw",
			"2004":"cmi.score.raw"
		},
		scoreScaled:{
			"1.2":null,
			"2004":"cmi.score.scaled"
		},                
		scoreMax:{
			"1.2":"cmi.core.score.max",
			"2004":"cmi.score.max"
		},
		scoreMin:{
			"1.2":"cmi.core.score.min",
			"2004":"cmi.score.min"
		},
		totalTime:{
			"1.2":"cmi.core.total_time",
			"2004":"cmi.total_time"
		},
		exit:{
			"1.2":"cmi.core.exit",
			"2004":"cmi.exit"
		},
		sessionTime:{
			"1.2":"cmi.core.session_time",
			"2004":"cmi.session_time"
		},
		suspendData:{
			"1.2":"cmi.suspend_data",
			"2004":"cmi.suspend_data"
		}
	 }
 }

function displayError(message){
  $('#errormessage').html(message);
}
  
function checkAPI(){
  //Check if SCORM API exists
  if(!scorm.API.isFound){
	  return 'APInotFound';
  }
  else if(!scorm.connection.isActive){
	  return 'initFailed';
  }

  else return '';	
}

function clientUsername() {

  console.log("Retrieving username...The username for this session is " + get(scormVarMapping.studentID[scormVersion]));
  var clientUsername = get(scormVarMapping.studentID[scormVersion]); 
  clientUsername = clientUsername.replace(/\uFFFD/g, '?');
  updateVariable('clientUsername', clientUsername);
  return clientUsername;
}

function retrieveName(){
  console.log("Retrieving LMS student ID variable: " + scormVarMapping.studentID[scormVersion]);
  username = get(scormVarMapping.studentID[scormVersion]);

  console.log('Sanitizing student ID');
  username = username.replace(/\uFFFD/g, '?');

  console.log("LMS sttudent name set to: " + username);

  console.log("Retrieving student name variable: " + scormVarMapping.studentName[scormVersion]);
  var fullUserName = get(scormVarMapping.studentName[scormVersion]);
  console.log("Student name variable is: " + fullUserName);

  console.log("Getting the student name (first and last)... the student name is: " + fullUserName);
  //Assign values to name variable. **These are the global variables defined at the top of this file, NOT function scope variables

  if(fullUserName.indexOf(",") != -1){
	  console.log('Found comma, using it to split');
	  tempUserName = fullUserName.split(",");
	  firstName = tempUserName[1];
	  lastName = tempUserName[0];
  }
  else if(fullUserName.indexOf(" ") != -1){
	  console.log('Found space, using it to split');
	  tempUserName = fullUserName.split(" ");
	  firstName = tempUserName[0];
	  lastName = tempUserName[1];
  }
  else{
	  console.log('Populating firstName and lastName with single username string');
	  firstName = fullUserName;
	  lastName = fullUserName;		
  }

  firstName = firstName.replace(/\uFFFD/g, '?');
  lastName = lastName.replace(/\uFFFD/g, '?');
  console.log('Set first name to ' + firstName);
  console.log('Set last name to ' + lastName);
}

function initScore() {
	console.log("Initializing score");
    //Check score variable on load
    var initScoreCheck = get(scormVarMapping.scoreRaw[scormVersion]);
    console.log("Retrieved score: " + initScoreCheck);
	//If the score variable is empty, initialize to 0
    if (initScoreCheck == "") {
		console.log("Retrieved score is empty. Setting to 0");
        //updateRawScore(0);
		set(scormVarMapping.scoreRaw[scormVersion], 0);
		if(scormVersion === '2004'){
			set(scormVarMapping.scoreScaled[scormVersion], 0);
		}
    }
}

function getScaledScore(rawscore, minscore, maxscore){
	return rawscore/(maxscore - minscore);
}

function updateRawScore(param) {
    var updatedScore = param;
    set(scormVarMapping.scoreRaw[scormVersion], updatedScore);
}

function getSuccessStatus(){
  console.log('Received a status of passed. Checking for correct completion status to send to the client LMS');

  var completionStatus = 'passed';

  //check if this course reports a score. If maxscore is set to zero, this course is assumed to not be reporting a score and successful completion status is changed to 'completed' instead of 'passed'
  //var checkMaxScore = parseInt(get('cmi.core.score.max'));
  var checkMaxScore = parseInt(get(scormVarMapping.scoreMax[scormVersion]));

  console.log('Max Score is ' + checkMaxScore);
  
  if(checkMaxScore !== 0){
	console.log('This course has a test');
	if(scormVersion === '2004'){
		console.log('SCORM 2004. Setting completion status to "completed"')
		completionStatus = 'completed';
	}
  }
  else{
	  console.log('This course does not have a test')
	  console.log('Returning a status of completed');
	  completionStatus = 'completed';
  }

  return completionStatus;
}

function clientLessonStatus() {

  console.log("Retrieving lesson status...The lesson status for this session is " + get(scormVarMapping.completionStatus[scormVersion]));
  var clientLessonStatus = get(scormVarMapping.completionStatus[scormVersion]);

  if(scormVersion === '2004'){
	var clientSuccessStatus =  get(scormVarMapping.successStatus[scormVersion]);
  }	

  updateVariable('clientLessonStatus', clientLessonStatus);

  if(clientLessonStatus === 'passed' || clientLessonStatus === 'completed' || clientLessonStatus === 'complete'){
	if(scormVersion === '1.2'){
		return 'passed';
	}
	else{
		if(clientSuccessStatus === 'passed'){
			return 'passed';
		}
	}	
  }
  else{
	  return clientLessonStatus;
  }
}

function setUserLaunchData(){

	  console.log("Setting user launch data...");
	  //Retrieve end-user LMS client's user data and store 
	  var launchData = {};
	  
	  getLinkURL();
	  
	  launchData.client_username = clientUsername();
	  launchData.LinkENV = variables.LinkENV;
	  launchData.LinkURL = variables.LinkURL;
	  launchData.lessonstatus = clientLessonStatus();
	  launchData.firstname = firstName.trim();
	  launchData.lastname = lastName;
	  launchData.useragentstring = navigator.userAgent;
	  launchData.browserversion = browserVersion;
	  launchData.courselocation = window.location.href.split("courselauncher.html")[0];
	  launchData.parameters = 'scormfirmid=' + launchData.scormfirmid  + '&client_username=' + launchData.client_username + '&firstname=' + launchData.firstname + '&lastname=' + launchData.lastname + '&courseid=' + launchData.courseid + '&lessonstatus=' + launchData.lessonstatus + '&eu_location=' + launchData.courselocation + '&userAgentString=' + launchData.useragentstring + '&browserversion=' + launchData.browserversion;
	  launchData.parameters = {
		  scormfirmid: launchData.scormfirmid,
		  client_username: launchData.client_username,
		  firstname: launchData.firstname,
		  lastname: launchData.lastname,
		  courseid: launchData.courseid,
		  lessonstatus: launchData.lessonstatus,
		  eu_location: launchData.courselocation,
		  userAgentString: launchData.useragentstring,
		  browserversion: launchData.browserversion
	  }
	  launchData.redirecturl = launchData.LinkENV + '/View/SCORMCourse?' + launchData.LinkURL +'&params=' + Base64.encode(encodeURI(JSON.stringify(launchData.parameters)));
			  
	  console.log("Finished setting user launch data.");								

	  return launchData;
}

function scormVersionOverride(scormfirmid, courseid){
 
	var overrides = [
		{
			scormfirmid:'8BDBAB06-5EF3-49C4-805D-B6031D368488',
			courseid: 901,
			scormversion: '2004'
		}
	]

	for(n = 0; n < overrides.length; n++){
		if(overrides[n].scormfirmid === scormfirmid && overrides[n].courseid === courseid){
			return overrides[n].scormversion;
		}
	}

	return false;
}

function launchCourse(){
  console.log("Launching course...");
  
  //Check if browser is IE9 or less. If so, show message to get a better browser
  if ($("html").hasClass("ie8") || $("html").hasClass("ie9")) {
	  $('#errormessage').html("Your browser is not supported","VinciWorks GateWay supports courseware using the latest web technologies. You are using Internet Explorer version 9 or earlier which is no longer supported by Microsoft.<br /><br />Please try re-launching this course in a newer version of Internet Explorer, Google Chrome or Mozilla Firefox.");
	  return;
  }
  
  else{
	$("#launchframe").attr("src", userLaunchData.redirecturl);
  }
}

//Terminate connection on page exit and set exist status appropriately
window.onbeforeunload = function (){
	var cmiExit = 'suspend';  
	var sessionLength = updateSessionTime().toString();
	set(scormVarMapping.sessionTime[scormVersion], sessionLength);
	  
	if(get(scormVarMapping.completionStatus[scormVersion]) === 'passed' || get(scormVarMapping.completionStatus[scormVersion]) === 'completed'){
		if(scormVersion === '1.2'){
			cmiExit = 'logout';
		}
	}
	set(scormVarMapping.exit[scormVersion], cmiExit);
	  
	end();
}

window.onunload = function (){
	var cmiExit = 'suspend';  
	var sessionLength = updateSessionTime().toString();
	set(scormVarMapping.sessionTime[scormVersion], sessionLength);
		
	if(get(scormVarMapping.completionStatus[scormVersion]) === 'passed' || get(scormVarMapping.completionStatus[scormVersion]) === 'completed'){
		if(scormVersion === '1.2'){
		  cmiExit = 'logout';
		}
	}
	set(scormVarMapping.exit[scormVersion], cmiExit);
		
	end();
}
