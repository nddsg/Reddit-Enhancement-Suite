// if this is a jetpack addon, add an event listener like Safari's message handler...
self.on('message', function(msgEvent) {
	switch (msgEvent.name) {
		case 'readResource':
			window.RedditResearchLoadCallbacks[msgEvent.transaction](msgEvent.data);
			delete window.RedditResearchLoadCallbacks[msgEvent.transaction];
			break;
		case 'GM_xmlhttpRequest':
			// Fire the appropriate onload function for this xmlhttprequest.
			xhrQueue.onloads[msgEvent.XHRID](msgEvent.response);
			break;
		case 'compareVersion':
			var forceUpdate = false;
			if (typeof msgEvent.message.forceUpdate !== 'undefined') forceUpdate = true;
			RedditResearchUtils.compareVersion(msgEvent.message, forceUpdate);
			break;
		case 'loadTweet':
			var tweet = msgEvent.response;
			var thisExpando = modules['styleTweaks'].tweetExpando;
			$(thisExpando).html(tweet.html);
			thisExpando.style.display = 'block';
			thisExpando.classList.add('twitterLoaded');
			break;
		case 'getLocalStorage':
			// Does RedditResearchStorage have actual data in it?  If it doesn't, they're a legacy user, we need to copy
			// old school localStorage from the foreground page to the background page to keep their settings...
			if (typeof msgEvent.message.importedFromForeground === 'undefined') {
				// it doesn't exist.. copy it over...
				var thisJSON = {
					requestType: 'saveLocalStorage',
					data: localStorage
				};
				self.postMessage(thisJSON);
			} else {
				setUpRedditResearchStorage(msgEvent.message);
				//RedditResearchInit();
			}
			break;
		case 'saveLocalStorage':
			// Okay, we just copied localStorage from foreground to background, let's set it up...
			setUpRedditResearchStorage(msgEvent.message);
			break;
		case 'localStorage':
			RedditResearchStorage.setItem(msgEvent.itemName, msgEvent.itemValue, true);
			break;
		default:
			// console.log('unknown event type in self.on');
			// console.log(msgEvent.toSource());
			break;
	}
});



// GM_xmlhttpRequest for non-GM browsers
if (typeof GM_xmlhttpRequest === 'undefined') {
	// we must be in a Firefox / jetpack addon...
	GM_xmlhttpRequest = function(obj) {
		var crossDomain = (obj.url.indexOf(location.hostname) === -1);

		if ((typeof obj.onload !== 'undefined') && (crossDomain)) {
			obj.requestType = 'GM_xmlhttpRequest';
			// okay, firefox's jetpack addon does this same stuff... le sigh..
			if (typeof obj.onload !== 'undefined') {
				obj.XHRID = xhrQueue.count;
				xhrQueue.onloads[xhrQueue.count] = obj.onload;
				self.postMessage(obj);
				xhrQueue.count++;
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


BrowserStrategy.localStorageTest = function() {
	// if this is a firefox addon, check for the old lsTest to see if they used to use the Greasemonkey script...
	// if so, present them with a notification explaining that they should download a new script so they can
	// copy their old settings...

	if ((localStorage.getItem('RedditResearch.lsTest') === 'test') && (localStorage.getItem('copyComplete') !== 'true')) {
		modules['notifications'].showNotification('<h2>Important Alert for Greasemonkey Users!</h2>Hey! It looks like you have upgraded to RedditResearch 4.0, but used to use the Greasemonkey version of RedditResearch. You\'re going to see double until you uninstall the Greasemonkey script. However, you should first copy your settings by clicking the blue button. <b>After installing, refresh this page!</b> <a target="_blank" class="RedditResearchNotificationButtonBlue" href="http://redditenhancementsuite.com/gmutil/reddit_enhancement_suite.user.js">GM->FF Import Tool</a>', 15000);
		localStorage.removeItem('RedditResearch.lsTest');

		// this is the only "old school" DOMNodeInserted event left... note to readers of this source code:
		// it will ONLY ever be added to the DOM in the specific instance of former OLD RedditResearch users from Greasemonkey
		// who haven't yet had the chance to copy their settings to the XPI version of RedditResearch.  Once they've completed
		// that, this eventlistener will never be added again, nor will it be added for those who are not in this
		// odd/small subset of people.
		document.body.addEventListener('DOMNodeInserted', function(event) {
			if ((event.target.tagName === 'DIV') && (event.target.getAttribute('id') && event.target.getAttribute('id').indexOf('copyToSimpleStorage') !== -1)) {
				GMSVtoFFSS();
			}
		}, true);
	}
};

BrowserStrategy.storageSetup = function(thisJSON) {
	var transactions = 0;
	window.RedditResearchLoadCallbacks = [];
	RedditResearchLoadResourceAsText = function(filename, callback) {
		window.RedditResearchLoadCallbacks[transactions] = callback;
		self.postMessage({ requestType: 'readResource', filename: filename, transaction: transactions });
		transactions++;
	};
	// we've got firefox jetpack, get localStorage from background process
	self.postMessage(thisJSON);
};

BrowserStrategy.RedditResearchInitReadyCheck = (function() {
	var original = BrowserStrategy.RedditResearchInitReadyCheck;

	return function(RedditResearchInit) {
		// firefox addon sdk... we've included jQuery...
		// also, for efficiency, we're going to try using unsafeWindow for "less secure" (but we're not going 2 ways here, so that's OK) but faster DOM node access...
		document = unsafeWindow.document;
		window = unsafeWindow;
		if (typeof $ !== 'function') {
			console.log('Uh oh, something has gone wrong loading jQuery...');
		}

		original(RedditResearchInit);
	}
})();

BrowserStrategy.openInNewWindow = function(thisHREF) {
	var thisJSON = {
		requestType: 'keyboardNav',
		linkURL: thisHREF
	};
	self.postMessage(thisJSON);
};

BrowserStrategy.openLinkInNewTab = function(thisHREF) {
	var thisJSON = {
		requestType: 'openLinkInNewTab',
		linkURL: thisHREF
	};
	self.postMessage(thisJSON);
};

BrowserStrategy.sendMessage = function(thisJSON) {
	self.postMessage(thisJSON);
};
