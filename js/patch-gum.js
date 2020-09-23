(function PatchGUM(global){
	"use strict";

	var origFn = global.navigator.mediaDevices.getUserMedia;
	try {
		Object.defineProperty(global.navigator.mediaDevices,"getUserMedia",{
			value: getUserMedia,
			writable: false,
			configurable: false,
		});
	}
	catch (err) {
		global.navigator.mediaDevices.getUserMedia = getUserMedia;
	}


	// **********************************

	async function getUserMedia(constraints){
		if (constraints && constraints.video && constraints.video.width && constraints.video.height) {
			let editedConstraints = JSON.parse(JSON.stringify(constraints));
			editedConstraints.video.width = 1280;
			editedConstraints.video.height = 720;

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
