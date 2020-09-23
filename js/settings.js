(function ExtensionSettings(global){
	"use strict";

	var fullSiteRE = /^(?<protocol>\*|https?):\/\/(?<origin>\*|[^./:]+?(?:\.[^./:]+?)*(?::\d+)?)(?:\/(?<path>.*))?$/;

	var formEl;
	var enableExtensionEl;
	var optionsEl;
	var newSiteProtocolEl;
	var newSiteOriginEl;
	var newSitePathEl;
	var addSiteBtn;
	var resetFormBtn;
	var sitesListEl;
	var deleteSitesBtn;

	var extensionSettings = getExtensionSettings();

	document.addEventListener("DOMContentLoaded",ready);


	// ***********************************

	async function getExtensionSettings() {
		try {
			let result = await browser.storage.sync.get("HDCameraVideoCalls");
			return result.HDCameraVideoCalls || {};
		}
		catch (err) {
			return {};
		}
	}

	async function ready() {
		formEl = document.querySelectorAll("[rel*=js-extension-settings]")[0];
		enableExtensionEl = formEl.querySelectorAll("[rel*=js-enable-extension]")[0];
		optionsEl = formEl.querySelectorAll("[rel*=js-options]")[0];
		newSiteProtocolEl = formEl.querySelectorAll("[rel*=js-new-site-protocol]")[0];
		newSiteOriginEl = formEl.querySelectorAll("[rel*=js-new-site-origin]")[0];
		newSitePathEl = formEl.querySelectorAll("[rel*=js-new-site-path]")[0];
		addSiteBtn = formEl.querySelectorAll("[rel*=js-add-btn]")[0];
		resetFormBtn = formEl.querySelectorAll("[rel*=js-reset-btn]")[0];
		sitesListEl = formEl.querySelectorAll("[rel*=js-sites-list]")[0];
		deleteSitesBtn = formEl.querySelectorAll("[rel*=js-delete-sites-btn]")[0];

		// wait for settings to load from storage
		extensionSettings = await extensionSettings;

		formEl.classList.remove("hidden");

		if (extensionSettings.extensionEnabled) {
			enableExtensionEl.checked = true;
			optionsEl.classList.remove("hidden");
		}

		// populate saved sites from settings (if any)
		for (let site of (extensionSettings.sites || [])) {
			if (fullSiteRE.test(site)) {
				let opt = document.createElement("option");
				opt.innerText = site;
				sitesListEl.appendChild(opt);
			}
		}

		if (sitesListEl.options.length > 0) {
			sitesListEl.disabled = false;
		}

		enableExtensionEl.addEventListener("change",onToggleExtension,false);
		newSiteProtocolEl.addEventListener("change",onEnterNewSiteParts,false);
		newSiteOriginEl.addEventListener("change",onEnterNewSiteParts,false);
		newSiteProtocolEl.addEventListener("input",onEnterNewSiteParts,false);
		newSiteOriginEl.addEventListener("input",onEnterNewSiteParts,false);
		formEl.addEventListener("submit",onFormSubmit,false);
		resetFormBtn.addEventListener("click",resetForm,false);
		sitesListEl.addEventListener("change",onSelectSites,false);
		sitesListEl.addEventListener("click",onClickSite,false);
		deleteSitesBtn.addEventListener("click",deleteSites,false);
		newSiteOriginEl.addEventListener("keydown",onOriginKeydown,false);
	}

	async function onToggleExtension() {
		extensionSettings.extensionEnabled = enableExtensionEl.checked;
		await browser.storage.sync.set({ HDCameraVideoCalls: extensionSettings, });

		if (extensionSettings.extensionEnabled) {
			optionsEl.classList.remove("hidden");
			newSiteProtocolEl.focus();
		}
		else {
			optionsEl.classList.add("hidden");
		}
	}

	function onFormSubmit(evt) {
		evt.preventDefault();
		if (!addSiteBtn.disabled) {
			onAddSite();
		}
	}

	function resetForm() {
		// NOTE: not using formEl.reset() because we don't
		// want to affect the enable-extension toggle
		newSiteOriginEl.setCustomValidity("");
		newSiteProtocolEl.value = "";
		newSiteOriginEl.value = "";
		newSitePathEl.value = "";
		newSiteOriginEl.removeAttribute("required");
		newSiteProtocolEl.removeAttribute("required");
		addSiteBtn.disabled = true;
		newSiteProtocolEl.focus();
	}

	function isValidSite() {
		return (
			newSiteProtocolEl.value != "" &&
			newSiteProtocolEl.validity.valid &&
			newSiteOriginEl.value != "" &&
			newSiteOriginEl.validity.valid
		);
	}

	function onOriginKeydown(evt) {
		if (evt.key == "/") {
			evt.preventDefault();
			evt.stopImmediatePropagation();
			evt.stopPropagation();

			if (newSiteOriginEl.value != "") {
				newSitePathEl.focus();
			}
		}
	}

	function onEnterNewSiteParts(evt) {
		newSiteOriginEl.setCustomValidity("");

		if (evt.target.matches("[rel*=js-new-site-protocol]")) {
			if (
				evt.type == "input" &&
				newSiteProtocolEl.value.endsWith(":")
			) {
				newSiteProtocolEl.value = newSiteProtocolEl.value.slice(0,-1);
				newSiteOriginEl.focus();
			}
			// was a full site entered (by mistake)?
			else if (fullSiteRE.test(newSiteProtocolEl.value)) {
				let {
					groups: {
						protocol = "",
						origin = "",
						path = "",
					} = {},
				} = (
					newSiteProtocolEl.value.match(fullSiteRE) || {}
				);

				if (protocol) {
					newSiteProtocolEl.value = protocol;
					newSiteOriginEl.focus();
				}
				if (origin) {
					newSiteOriginEl.value = origin;
					newSitePathEl.focus();
				}
				if (path) {
					newSitePathEl.value = path;
					addSiteBtn.focus();
				}
			}
		}
		evt.target.setAttribute("required","");

		// check for wildcard + port (not allowed)
		if (
			(
				newSiteProtocolEl.value == "*" ||
				newSiteOriginEl.value.startsWith("*")
			) &&
			/:\d*$/.test(newSiteOriginEl.value)
		) {
			newSiteOriginEl.setCustomValidity("Port not allowed with wildcards");
		}

		if (isValidSite()) {
			addSiteBtn.disabled = false;
		}
		else {
			addSiteBtn.disabled = true;
		}
	}

	async function onAddSite() {
		if (isValidSite()) {
			let newSiteURL = `${
				(newSiteProtocolEl.value || "").toLowerCase()
			}://${
				(newSiteOriginEl.value || "").toLowerCase()
			}/${
				newSitePathEl.value || "*"
			}`;
			resetForm();

			// bail if this URL is already in the list?
			for (let opt of sitesListEl.options) {
				if (opt.label == newSiteURL) {
					return;
				}
			}

			let opt = document.createElement("option");
			opt.innerText = newSiteURL;
			sitesListEl.appendChild(opt);
			sitesListEl.disabled = false;

			// save settings
			extensionSettings.sites = extensionSettings.sites || [];
			extensionSettings.sites.push(newSiteURL);
			await browser.storage.sync.set({ HDCameraVideoCalls: extensionSettings, });
		}
	}

	function onSelectSites() {
		deleteSitesBtn.disabled = (sitesListEl.selectedOptions.length == 0);
	}

	function onClickSite(evt) {
		if (!evt.target.matches("option")) {
			sitesListEl.selectedIndex = -1;
			deleteSitesBtn.disabled = true;
		}
	}

	async function deleteSites() {
		var sitesToDelete = [...sitesListEl.selectedOptions];
		sitesListEl.selectedIndex = -1;
		deleteSitesBtn.disabled = true;

		for (let opt of sitesToDelete) {
			sitesListEl.removeChild(opt);
		}

		if (sitesListEl.options.length == 0) {
			sitesListEl.disabled = true;
		}

		// save settings
		extensionSettings.sites = extensionSettings.sites.filter(function removeDeletedSite(site){
			return !sitesToDelete.find(function matchOption(opt){
				return opt.label == site;
			});
		});
		await browser.storage.sync.set({ HDCameraVideoCalls: extensionSettings, });
	}

})(this);
