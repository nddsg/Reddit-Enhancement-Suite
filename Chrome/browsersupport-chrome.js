// OperaBlink loads browsersupport-chrome first, then browsersupport-operablink.js for overrides


// we need a queue of permission callback functions because of
// multiple async requests now needed... it's yucky and sad. Thanks, Chrome. :(
permissionQueue = {
	count: 0,
	onloads: []
};


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch (request.requestType) {
			case 'localStorage':
				if (typeof RedditResearchStorage.setItem !== 'function') {
					// if RedditResearchStorage isn't ready yet, wait a moment, then try setting again.
					var waitForRedditResearchStorage = function(request) {
						if ((typeof RedditResearchStorage !== 'undefined') && (typeof RedditResearchStorage.setItem === 'function')) {
							RedditResearchStorage.setItem(request.itemName, request.itemValue, true);
						} else {
							setTimeout(function() {
								waitForRedditResearchStorage(request);
							}, 50);
						}
					};
					waitForRedditResearchStorage(request);
				} else {
					RedditResearchStorage.setItem(request.itemName, request.itemValue, true);
				}
				break;
			case 'permissions':
				// TODO: maybe add a type here? right now only reason is for twitter expandos so text is hard coded, etc.
				// result will just be true/false here. if false, permission was rejected.
				if (!request.result) {
					modules['notifications'].showNotification("You clicked 'Deny'. RedditResearch needs permission to access the Twitter API at "+request.data.origins[0]+" for twitter expandos to show twitter posts in-line. Be assured RedditResearch does not access any of your information on twitter.com - it only accesses the API.", 10);
					permissionQueue.onloads[request.callbackID](false);
				} else {
					permissionQueue.onloads[request.callbackID](true);
				}
				break;
			case 'subredditStyle':
				var toggle = !modules['styleTweaks'].styleToggleCheckbox.checked;
				modules['styleTweaks'].toggleSubredditStyle(toggle, RedditResearchUtils.currentSubreddit());
				break;
			default:
				// sendResponse({status: "unrecognized request type"});
				break;
		}
	}
);




// GM_xmlhttpRequest for non-GM browsers
if (typeof GM_xmlhttpRequest === 'undefined') {
	GM_xmlhttpRequest = function(obj) {
		var crossDomain = (obj.url.indexOf(location.hostname) === -1);

		if ((typeof obj.onload !== 'undefined') && (crossDomain)) {
			obj.requestType = 'GM_xmlhttpRequest';
			if (typeof obj.onload !== 'undefined') {
				chrome.runtime.sendMessage(obj, function(response) {
					obj.onload(response);
				});
			}
		} else {
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (obj.onreadystatechange) {
					obj.onreadystatechange(request);
				}
				if (request.readyState === 4 && obj.onload) {
					obj.onload(request);
				}
			};
			request.onerror = function() {
				if (obj.onerror) {
					obj.onerror(request);
				}
			};
			try {
				request.open(obj.method, obj.url, true);
			} catch (e) {
				if (obj.onerror) {
					obj.onerror({
						readyState: 4,
						responseHeaders: '',
						responseText: '',
						responseXML: '',
						status: 403,
						statusText: 'Forbidden'
					});
				}
				return;
			}
			if (obj.headers) {
				for (var name in obj.headers) {
					request.setRequestHeader(name, obj.headers[name]);
				}
			}
			request.send(obj.data);
			return request;
		}
	};
}


BrowserStrategy.storageSetup = function(thisJSON) {
	RedditResearchLoadResourceAsText = function(filename, callback) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			if (callback) {
				callback(this.responseText);
			}
		};
		var id = chrome.i18n.getMessage("@@extension_id");
		xhr.open('GET', 'chrome-extension://' + id + '/' + filename);
		xhr.send();
	};

	// we've got chrome, get a copy of the background page's localStorage first, so don't init until after.
	chrome.runtime.sendMessage(thisJSON, function(response) {
		// Does RedditResearchStorage have actual data in it?  If it doesn't, they're a legacy user, we need to copy
		// old school localStorage from the foreground page to the background page to keep their settings...
		if (!response || typeof response.importedFromForeground === 'undefined') {
			// it doesn't exist.. copy it over...
			var ls = {};
			for (var i = 0, len = localStorage.length; i < len; i++) {
				if (localStorage.key(i)) {
					ls[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
				}
			}
			var thisJSON = {
				requestType: 'saveLocalStorage',
				data: ls
			};
			chrome.runtime.sendMessage(thisJSON, function(response) {
				setUpRedditResearchStorage(response);
			});
		} else {
			setUpRedditResearchStorage(response);
		}
	});
};


BrowserStrategy.sendMessage = function(thisJSON) {
	chrome.runtime.sendMessage(thisJSON);
};


BrowserStrategy.openInNewWindow = function(thisHREF) {
	var thisJSON = {
		requestType: 'keyboardNav',
		linkURL: thisHREF
	};
	chrome.runtime.sendMessage(thisJSON);
};

BrowserStrategy.openLinkInNewTab = function(thisHREF) {
	var thisJSON = {
		requestType: 'openLinkInNewTab',
		linkURL: thisHREF
	};
	chrome.runtime.sendMessage(thisJSON);
};

BrowserStrategy.addURLToHistory = (function() {
	var original = BrowserStrategy.addURLToHistory;

	return function(url) {
		if (chrome.extension.inIncognitoContext) {
			return;
		}

		original(url);
	};
})();

BrowserStrategy.supportsThirdPartyCookies = function() {
	if (chrome.extension.inIncognitoContext) {
		return false;
	}

	return true;
};
