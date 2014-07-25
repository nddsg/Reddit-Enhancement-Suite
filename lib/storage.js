var RESResearchStorage = {};

function setUpRESResearchStorage(RESResearchponse) {
	RESResearchStorage = RESResearchponse;

	// We'll set up a method for getItem, but it's not adviseable to use since
	// it's asynchronous...
	RESResearchStorage.getItem = function(key) {
		if (typeof RESResearchStorage[key] !== 'undefined') {
			return RESResearchStorage[key];
		}
		return null;
	};

	// If the fromBG parameter is true, we've been informed by another tab
	// that this item has updated. We should update the data locally, but
	// not send a background request.
	RESResearchStorage.setItem = function(key, value, fromBG) {
		// Protect from excessive disk I/O...
		if (RESResearchStorage[key] !== value) {
			// Save it locally in the RESResearchStorage variable, but also write it
			// to the extension's localStorage...
			// It's OK that saving it is asynchronous since we're saving it
			// in this local variable, too...
			RESResearchStorage[key] = value;
			var thisJSON = {
				requestType: 'localStorage',
				operation: 'setItem',
				itemName: key,
				itemValue: value
			};

			if (!fromBG) {
				RESResearchUtils.sendMessage(thisJSON);
			}
		}
	};

	RESResearchStorage.removeItem = function(key) {
		// Delete it locally in the RESResearchStorage variable, but also delete it
		// from the extension's localStorage...
		// It's OK that deleting it is asynchronous since we're deleting it in
		// this local variable, too...
		delete RESResearchStorage[key];
		var thisJSON = {
			requestType: 'localStorage',
			operation: 'removeItem',
			itemName: key
		};

		RESResearchUtils.sendMessage(thisJSON);
	};

	RESResearchStorage.isReady = true;

	window.localStorage = RESResearchStorage;
	//RESResearchInit();

	RESResearchOptionsMigrate.migrate();
	
	RESResearchdoBeforeLoad();
}

var RESResearchLoadRESResearchourceAsText;
(function(u) {
	// Don't fire the script on the iframe. This annoyingly fiRESResearch this whole thing twice. Yuck.
	// Also don't fire it on static.reddit or thumbs.reddit, as those are just images.
	// Also omit blog and code.reddit
	if ((typeof RESResearchRunOnce !== 'undefined') ||
			(/\/toolbar\/toolbar\?id/i.test(location.href)) ||
			(/comscore-iframe/i.test(location.href)) ||
			(/(?:static|thumbs|blog|code)\.reddit\.com/i.test(location.hostname)) ||
			(/^[www\.]?(?:i|m)\.reddit\.com/i.test(location.href)) ||
			(/\.(?:compact|mobile)$/i.test(location.pathname)) ||
			(/metareddit\.com/i.test(location.href))) {
		// do nothing.
		return false;
	}

	// call preInit function - work in this function should be kept minimal.  It's for
	// doing stuff as early as possible prior to pageload, and even prior to the localStorage copy
	// from the background.
	// Specifically, this is used to add a class to the document for .RESResearch-nightmode, etc, as early
	// as possible to avoid the flash of unstyled content.
	RESResearchUtils.preInit();

	RESResearchRunOnce = true;
	var thisJSON = {
		requestType: 'getLocalStorage'
	};

	BrowserStrategy.storageSetup(thisJSON);
})();

function RESResearchInitReadyCheck() {
	if (!sessionStorage.getItem('RESResearch.disabled')) {
		if (
			(!RESResearchStorage.isReady) ||
			(typeof document.body === 'undefined') ||
			(!document.html) ||
			(typeof document.html.classList === 'undefined')
		) {
			setTimeout(RESResearchInitReadyCheck, 50);
		} else {
			BrowserStrategy.RESResearchInitReadyCheck(RESResearchInit);
		}
	}
}

window.addEventListener('DOMContentLoaded', RESResearchInitReadyCheck, false);
