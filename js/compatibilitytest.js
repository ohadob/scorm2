function browserCheck() {
	//Set defaults
	var value = {
		IsIE: false,
		TrueVersion: 0,
		ActingVersion: 0,
		CompatibilityMode: false
	};
	var browser = 'notIE';

	//Try to find the Trident version number
	var trident = navigator.userAgent.match(/Trident\/(\d+)/);
	if (trident) {
		value.IsIE = true;
		browser = 'IE';
		//Convert from the Trident version number to the IE version number
		value.TrueVersion = parseInt(trident[1], 10) + 4;
	} else {
		//Try to find Edge
		var edge = navigator.userAgent.indexOf('Edge/');
		if (edge > 0) {
	    value.IsIE = 'edge';
	    edgeVersion = parseInt(navigator.userAgent.substring(edge + 5, navigator.userAgent.indexOf('.', edge)), 10);
	  }
	}

  //If IE, find ActingVersion and check Compatibility Mode
  if(value.IsIE == true) {
		//Try to find the MSIE number
		var msie = navigator.userAgent.match(/MSIE (\d+)/);
		if (msie) {
			value.IsIE = true;
			browser = 'IE';
			//Find the IE version number from the user agent string
			value.ActingVersion = parseInt(msie[1]);
		} else {
			//Must be IE 11 in "edge" mode
			value.ActingVersion = value.TrueVersion;
		}

		//If we have both a Trident and MSIE version number, see if they're different
		if (value.IsIE && value.TrueVersion > 0 && value.ActingVersion > 0) {
			browser += value.ActingVersion;
			//In compatibility mode if the trident number doesn't match up with the MSIE number
			value.CompatibilityMode = value.TrueVersion != value.ActingVersion;
		}
	}

	//Redirect if in non-supported version of IE
	if (value.IsIE == true && value.ActingVersion < 11) {
		alert('SCORM Transfer is not supported by this browser.');
		return 'NotSupportedIE';
	}

	//Set Browser Version string
	if (value.IsIE == false) {
		return 'NotIE';
	} else if (value.IsIE == 'edge') {
		return 'Edge' + edgeVersion;
	} else if (value.TrueVersion == value.ActingVersion) {
		return 'IE' + value.TrueVersion;
	} else if (value.TrueVersion != value.ActingVersion) {
		return 'IE' + value.TrueVersion + ' emulating IE' + value.ActingVersion;
	}
};