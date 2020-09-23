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
