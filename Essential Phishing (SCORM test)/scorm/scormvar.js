//creating shortcut for less verbose code
var scorm = pipwerks.SCORM;

//Define course variables object
var variables = new Object();

//Define The array that will contain the course variables
var allVariablesArray = new Array();

//Define first and last name and username variables
var firstName;
var lastName;
var username;

//Define current and last viewed page variables
var pageName;
var lastPageViewed;

function init() {
    //console.log("Initializing LMS connnection...");
    //Specify SCORM 1.2:
    scorm.version = "1.2";
    scorm.init();
}

function currentPage(param) {
    //Generate the page name
    pageName = param;
    //Update the cmi.corelesson_location SCORM variable
    set('cmi.core.lesson_location', pageName);
    return pageName;
}

function previousLocation(param) {
    //Set the last page viewed variable
    lastPageViewed = param;
    //Update the suspend data with last page viewed
    updateVariable("lastPageViewed", lastPageViewed)
    return lastPageViewed;
}

function scoreInitialize() {
    //Check score variable on load
    var initScoreCheck = scorm.get('cmi.core.score.raw');
    //If the score variable is empty, initialize to 0
    if (initScoreCheck == "") {
        updateScore(0);
    }
}

function updateScore(param) {
    var updatedScore = param;
    set('cmi.core.score.raw', updatedScore);
}

function set(param, value) {
    var temp = scorm.set(param, value);
	return temp;
}

function get(param) {
    var value = scorm.get(param);
    return value;
}

function getName() {
    var nameArray = get('cmi.core.student_name').split(",");
    //Assign values to name variable. **These are the global variables defined at the top of this file, NOT function scope variables
    firstName = nameArray[1];
    lastName = nameArray[0];
	username = get('cmi.core.student_id');
}

function complete() {
    var callSucceeded = scorm.set("cmi.core.lesson_status", "passed");
}

function end() {
	var callSucceeded = scorm.quit();
}

//This function reads the suspend data, assigns values to the course variables and adds the course variables that aren't already in the suspend data
function readSuspendData(){
	//Get the existing suspend data string
	var suspendString = get('cmi.suspend_data');

	//split the suspend data string into separate variables
	var suspendDataArray = suspendString.split(";");

	//separate each element of suspend data array into variable name and value then write into course variables array
	if (suspendDataArray != null && suspendDataArray != ""){
		for (i = 0; i < suspendDataArray.length; i++) {
			var nameAndValueArray =  suspendDataArray[i].split("=");

			if (isNaN(nameAndValueArray[1]) || nameAndValueArray[1] == "") {
				var propertyValue = nameAndValueArray[1];
			}
			else {
				propertyValue = parseInt(nameAndValueArray[1]);
			}
			variables[nameAndValueArray[0]] = propertyValue;
		}
	}
}

//This function updates the chosen course variable
function updateVariable(name,value) {

	//Update required variable in variables object
	variables[name] = value;

	//Call function to update suspend data string with new variable value
	writeSuspendData();
}

//This function updates the course suspend data string with the current values in variables object
function writeSuspendData() {
	var tempArray = Object.keys(variables);
	var updatedVariablesArray = new Array();

	for(i = 0; i < tempArray.length; i ++){
		updatedVariablesArray[i] = tempArray[i] + '=' + variables[tempArray[i]];
	}

	var updatedSuspendData = updatedVariablesArray.join();

	for (j = 0; j < updatedVariablesArray.length; j++) {
		updatedSuspendData = updatedSuspendData.replace(",", ";");
	}

	set('cmi.suspend_data', updatedSuspendData);
	var testSuspend = get('cmi.suspend_data');
	scorm.save();
}


