"use strict";

var extensionSettings = getExtensionSettings();

setupController();


// ***************************

async function getExtensionSettings() {
	try {
		let result = await browser.storage.sync.get("HDCameraVideoCalls");
		return result.HDCameraVideoCalls || {};
	}
	catch (err) {
		return {};
	}
}

async function extensionSettingsChanged() {
	console.log("(controller) extension settings changed");

	var prevSettings = extensionSettings;
	extensionSettings = await getExtensionSettings();

	// extension now enabled?
	if (extensionSettings.extensionEnabled && !prevSettings.extensionEnabled) {
		await setupController();
	}
	// extension now disabled?
	else if (!extensionSettings.extensionEnabled && prevSettings.extensionEnabled) {
		browser.runtime.onInstalled.removeListener(onFirstInstall);
		browser.tabs.onUpdated.removeListener(onTabNavigation);

		console.log("(controller) finished, ready for shutdown");
	}
}

async function setupController() {
	console.log("(controller) starting initial setup");

	browser.runtime.onInstalled.addListener(onFirstInstall);
	browser.tabs.onUpdated.addListener(onTabNavigation);

	browser.storage.onChanged.addListener(extensionSettingsChanged);
	extensionSettings = await extensionSettings;

	if (extensionSettings.extensionEnabled) {
		console.log("(controller) extension enabled");
	}
	else {
		console.log("(controller) extension disabled, skipping initialization");
	}
}

async function onFirstInstall(evt) {
	if (evt.reason == "install") {
		if (isPromise(extensionSettings)) {
			await extensionSettings;
		}

		// pre-populate these settings on first install
		extensionSettings.extensionEnabled = true;
		extensionSettings.sites = [
			"https://zoom.us/*",
			"https://*.zoom.us/*",
			"https://whereby.com/*",
			"https://*.whereby.com/*",
			"https://meet.google.com/*"
		];
		await browser.storage.sync.set({ HDCameraVideoCalls: extensionSettings, });
	}
}

async function onTabNavigation(tabID,changeInfo,tab) {
	try {
		if (changeInfo.status == "loading") {
			if (isPromise(extensionSettings)) {
				await extensionSettings;
			}

			if (extensionSettings.sites.length > 0) {
				let pageURL = changeInfo.url || tab.url;
				let pageRE = /^(?<pageProtocol>https?):\/\/(?<pageOrigin>[^./:]+?(?:\.[^./:]+?)*(?::\d+)?)(?:\/(?<pagePath>.*))?$/;
				let pageURLGroups = splitStringREGroups(pageURL,pageRE);
				if (pageURLGroups.pageOrigin) {
					let pageOriginRE = /^(?<pageDomain1>[^./:]+?)(?<pageDomain2>(?:\.[^./:]+?)*)?(?<pagePort>:\d+)?$/
					let pageOriginGroups = splitStringREGroups(pageURLGroups.pageOrigin,pageOriginRE);
					pageURLGroups.pageOrigin = pageOriginGroups;

					for (let sitePattern of extensionSettings.sites) {
						if (matchURL(sitePattern,pageURLGroups)) {
							await browser.tabs.executeScript(tabID,{
								file: "/js/external/webextension-polyfill.min.js",
							});
							await browser.tabs.executeScript(tabID,{
								file: "/js/inject-gum-patch.js",
							});
							return;
						}
					}
				}
			}
		}
	}
	catch (err) {
		console.log(err);
	}
}

function matchURL(sitePattern,{
	pageProtocol,
	pageOrigin: {
		pageDomain1,
		pageDomain2,
		pagePort
	} = {},
	pagePath,
} = {}) {
	var URLPatternRE = /^(?<patternProtocol>\*|https?):\/\/(?<patternOrigin>\*|[^./:]+?(?:\.[^./:]+?)*(?::\d+)?)(?:\/(?<patternPath>.*))?$/;
	var patternOriginRE = /^(?:(?<patternDomain1Wildcard>\*)|(?<patternDomain1>[^./:]+?))(?<patternDomain2>(?:\.[^./:]+?)*)?(?<patternPort>:\d+)?$/
	var { patternProtocol, patternOrigin = "", patternPath, } = splitStringREGroups(sitePattern,URLPatternRE);
	var {
		patternDomain1Wildcard,
		patternDomain1,
		patternDomain2,
		patternPort,
	} = splitStringREGroups(patternOrigin,patternOriginRE);

	var protocolMatches = (
		(patternProtocol == "*") ||
		(patternProtocol === pageProtocol)
	);
	var originMatches = (
		(
			(patternDomain1Wildcard == "*") ||
			(patternDomain1 === pageDomain1)
		) &&
		(
			(patternDomain1Wildcard == "*" && !patternDomain2) ||
			(!patternDomain2 && !pageDomain2) ||
			(patternDomain2 === pageDomain2)
		) &&
		(
			(!patternPort && !pagePort) ||
			(patternPort === pagePort)
		)
	);
	var pathMatches = (
		(patternPath == "*") ||
		(patternPath === pagePath)
	);

	return (protocolMatches && originMatches && pathMatches);
}

function splitStringREGroups(str,RE) {
	var { groups = {}, } = (str.match(RE) || {});
	return groups;
}

function handleAck(ack,bridgeEntry) {
	if (ack) {
		bridgeEntry.bridge.postMessage({ type: `ack:${ack}`, });
	}
}

function isPromise(v) {
	return (v && typeof v == "object" && typeof v.then == "function");
}
