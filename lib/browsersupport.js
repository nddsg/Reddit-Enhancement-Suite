var BrowserStrategy = {
	sanitizeJSON: function(data) {
		return data;
	},
	localStorageTest: function() {
		// return nothing
	},
	storageSetup: function(thisJSON) {
		// return nothing
	},
	RedditResearchInitReadyCheck: function() {
		if (typeof $ !== 'function') {
			console.log('Uh oh, something has gone wrong loading jQuery...');
		}

		$(document).ready(RedditResearchInit);
		// return nothing
	},
	sendMessage: function(thisJSON) {
		// return nothing
	},
	getOutlineProperty: function() {
		// return string or nothing
	},
	openNewWindow: function(thisHREF) {
		window.open(thisHREF);
	},
	addURLToHistory: function(url) {
		var thisJSON = {
			requestType: 'addURLToHistory',
			url: url
		};

		BrowserStrategy.sendMessage(thisJSON);

		// return nothing
	},
	_addURLToHistory: (function() {
		// NOTE TO REVIEWERS: Not used by Chrome or Firefox
		// This is the poor man's implementation of browser.history.push()

		var frame;
		var urls = [];

		function addURLToHistory(url) {
			if (url) {
				urls.push(url);
			}
			handleUrls();
			// return nothing
		}

		function handleUrls() {
			setup();
			var url;
			while (url = urls.shift()) {
				if (!url) return;

				sendMessage(url);
			}
		}

		function setup() {
			BrowserStrategy._addURLToHistoryViaForeground = loadInFrame;
			if (frame) return;

			frame = document.createElement('iframe');
			function onload() {
				setTimeout(handleUrls, 300);
				frame.removeEventListener('load', onload, false);
				frame.contentWindow.location.replace('about:blank');
			}
			frame.addEventListener('load', onload, false);
			frame.style.display = 'none';
			frame.style.width = '0px';
			frame.style.height = '0px';
			document.body.appendChild(frame);
		}

		function sendMessage(url) {
			var thisJSON = {
				requestType: 'addURLToHistory',
				url: url
			};

			BrowserStrategy.sendMessage(thisJSON);
		}

		function loadInFrame(url) {
			frame.contentWindow.location.replace(url);
		}

		return addURLToHistory;
	})(),
	supportsThirdPartyCookies: function() {
		return true;
	},
};

var BrowserDetect = {
	init: function() {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent) ||
			this.searchVersion(navigator.appVersion) ||
			"an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";

		// set up MutationObserver variable to take whichever is supported / existing...
		// unfortunately, this doesn't (currently) exist in Opera.
		// this.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;
		// At the time of writing WebKit's mutation observer leaks entire pages on refRedditResearchh so it needs to be disabled.
		this.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;

		// null out MutationObserver to test legacy DOMNodeInserted
		// this.MutationObserver = null;
	},
	searchString: function(data) {
		for (var i = 0; i < data.length; i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) !== -1) {
					return data[i].identity;
				}
			} else if (dataProp) {
				return data[i].identity;
			}
		}
	},
	searchVersion: function(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index === -1) {
			return;
		}
		return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
	},
	isChrome: function() {
		return typeof chrome !== 'undefined';
	},
	isFirefox: function() {
		return typeof self.on === 'function';
	},
	isOperaBlink: function() {
		return typeof chrome !== 'undefined' && BrowserDetect.browser === "Opera";
	},
	isOpera: function() {
		return typeof opera !== 'undefined';
	},
	isSafari: function() {
		return typeof safari !== 'undefined';
	},
	dataBrowser: [{
		string: navigator.userAgent,
		subString: "OPR/",
		identity: "Opera"
	}, {
		string: navigator.userAgent,
		subString: "Chrome",
		identity: "Chrome"
	}, {
		string: navigator.userAgent,
		subString: "OmniWeb",
		versionSearch: "OmniWeb/",
		identity: "OmniWeb"
	}, {
		string: navigator.vendor,
		subString: "Apple",
		identity: "Safari",
		versionSearch: "Version"
	}, {
		prop: window.opera,
		identity: "Opera",
		versionSearch: "Version"
	}, {
		string: navigator.vendor,
		subString: "iCab",
		identity: "iCab"
	}, {
		string: navigator.vendor,
		subString: "KDE",
		identity: "Konqueror"
	}, {
		string: navigator.userAgent,
		subString: "Firefox",
		identity: "Firefox"
	}, {
		string: navigator.vendor,
		subString: "Camino",
		identity: "Camino"
	}, { // for newer Netscapes (6+)
		string: navigator.userAgent,
		subString: "Netscape",
		identity: "Netscape"
	}, {
		string: navigator.userAgent,
		subString: "MSIE",
		identity: "Explorer",
		versionSearch: "MSIE"
	}, {
		string: navigator.userAgent,
		subString: "Gecko",
		identity: "Mozilla",
		versionSearch: "rv"
	}, {
		// for older Netscapes (4-)
		string: navigator.userAgent,
		subString: "Mozilla",
		identity: "Netscape",
		versionSearch: "Mozilla"
	}],
	dataOS: [{
		string: navigator.platform,
		subString: "Win",
		identity: "Windows"
	}, {
		string: navigator.platform,
		subString: "Mac",
		identity: "Mac"
	}, {
		string: navigator.userAgent,
		subString: "iPhone",
		identity: "iPhone/iPod"
	}, {
		string: navigator.platform,
		subString: "Linux",
		identity: "Linux"
	}]

};
BrowserDetect.init();


// This object will store xmlHTTPRequest callbacks for Safari because Safari's extension architecture seems stupid.
// This really shouldn't be necessary, but I can't seem to hold on to an onload function that I pass to the background page...
xhrQueue = {
	count: 0,
	onloads: []
};


// this function copies localStorage (from the GM import script) to FF addon simplestorage...

function GMSVtoFFSS() {
	var console = unsafeWindow.console;
	for (var key in localStorage) {
		RedditResearchStorage.setItem(key, localStorage[key]);
	}
	localStorage.setItem('copyComplete', 'true');
	localStorage.removeItem('RedditResearch.lsTest');
	modules['notifications'].showNotification('Data transfer complete. You may now uninstall the Greasemonkey script');
}
