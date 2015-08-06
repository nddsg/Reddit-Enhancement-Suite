var RedditResearchStorage = {};

function setUpRedditResearchStorage(RedditResearchponse) {
	RedditResearchStorage = RedditResearchponse;

	// We'll set up a method for getItem, but it's not adviseable to use since
	// it's asynchronous...
	RedditResearchStorage.getItem = function(key) {
		if (typeof RedditResearchStorage[key] !== 'undefined') {
			return RedditResearchStorage[key];
		}
		return null;
	};

	// If the fromBG parameter is true, we've been informed by another tab
	// that this item has updated. We should update the data locally, but
	// not send a background request.
	RedditResearchStorage.setItem = function(key, value, fromBG) {
		// Protect from excessive disk I/O...
		if (RedditResearchStorage[key] !== value) {
			// Save it locally in the RedditResearchStorage variable, but also write it
			// to the extension's localStorage...
			// It's OK that saving it is asynchronous since we're saving it
			// in this local variable, too...
			RedditResearchStorage[key] = value;
			var thisJSON = {
				requestType: 'localStorage',
				operation: 'setItem',
				itemName: key,
				itemValue: value
			};

			if (!fromBG) {
				RedditResearchUtils.sendMessage(thisJSON);
			}
		}
	};

	RedditResearchStorage.removeItem = function(key) {
		// Delete it locally in the RedditResearchStorage variable, but also delete it
		// from the extension's localStorage...
		// It's OK that deleting it is asynchronous since we're deleting it in
		// this local variable, too...
		delete RedditResearchStorage[key];
		var thisJSON = {
			requestType: 'localStorage',
			operation: 'removeItem',
			itemName: key
		};

		RedditResearchUtils.sendMessage(thisJSON);
	};

	RedditResearchStorage.isReady = true;

	window.localStorage = RedditResearchStorage;
	//RedditResearchInit();

	RedditResearchOptionsMigrate.migrate();
	
	RedditResearchdoBeforeLoad();
}

var RedditResearchLoadRedditResearchourceAsText;
(function(u) {
	// Don't fire the script on the iframe. This annoyingly fiRedditResearch this whole thing twice. Yuck.
	// Also don't fire it on static.reddit or thumbs.reddit, as those are just images.
	// Also omit blog and code.reddit
	if ((typeof RedditResearchRunOnce !== 'undefined') ||
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
	// Specifically, this is used to add a class to the document for .RedditResearch-nightmode, etc, as early
	// as possible to avoid the flash of unstyled content.
	RedditResearchUtils.preInit();

	RedditResearchRunOnce = true;
	var thisJSON = {
		requestType: 'getLocalStorage'
	};

	BrowserStrategy.storageSetup(thisJSON);
})();

function RedditResearchInitReadyCheck() {
	if (!sessionStorage.getItem('RedditResearch.disabled')) {
		if (
			(!RedditResearchStorage.isReady) ||
			(typeof document.body === 'undefined') ||
			(!document.html) ||
			(typeof document.html.classList === 'undefined')
		) {
			setTimeout(RedditResearchInitReadyCheck, 50);
		} else {
			BrowserStrategy.RedditResearchInitReadyCheck(RedditResearchInit);
		}
	}
}

window.addEventListener('DOMContentLoaded', RedditResearchInitReadyCheck, false);
