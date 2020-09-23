(function PatchGUM(global){
	"use strict";

	defineProperty(toString,"name","f");
	defineProperty(toString,"toString",toString);
	defineProperty(getUserMedia,"name","f");
	defineProperty(getUserMedia,"toString",toString);
	defineProperty(getUserMedia,Symbol("getUserMedia-patched"),true);

	var origFn = global.navigator.mediaDevices.getUserMedia;
	try {
		defineProperty(global.navigator.mediaDevices,"getUserMedia",getUserMedia);
	}
	catch (err) {
		global.navigator.mediaDevices.getUserMedia = getUserMedia;
	}


	// **********************************

	function defineProperty(obj,name,val) {
		return Object.defineProperty(obj,name,{
			value: val,
			enumerable: false,
			configurable: false,
			writable: false,
		});
	}

	function toString() {
		return "() { [native code] }";
	}

	async function getUserMedia(constraints){
		var editedConstraints = JSON.parse(JSON.stringify(constraints));

		if (constraints && constraints.video) {
			let editedConstraints = JSON.parse(JSON.stringify(constraints));

			if (
				editedConstraints.video.width &&
				editedConstraints.video.height
			) {
				editedConstraints.video.width = 1280;
				editedConstraints.video.height = 720;
			}
			else if (Array.isArray(editedConstraints.video.advanced)) {
				for (let constraint of editedConstraints.video.advanced) {
					if (constraint && constraint.width) {
						constraint.width = 1280;
					}
					else if (constraint && constraint.height) {
						constraint.height = 720;
					}
				}
			}

			try {
				let result = await origFn.call(navigator.mediaDevices,editedConstraints);
				if (result) {
					return result;
				}
			}
			catch (err) {}
		}

		return origFn.call(navigator.mediaDevices,constraints);
	}

})(this);
