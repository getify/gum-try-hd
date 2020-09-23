(function InjectGUMPatch(global){
	"use strict"

	if (document.readyState == "loading") {
		document.addEventListener("DOMContentLoaded",ready);
	}
	else {
		ready();
	}


	// **********************************

	function ready(){
		var s = document.createElement("script");
		s.src = browser.runtime.getURL("js/patch-gum.js");
		document.head.prepend(s);
	}
})();
