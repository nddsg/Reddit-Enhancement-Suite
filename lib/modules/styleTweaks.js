modules['styleTweaks'] = {
	moduleID: 'styleTweaks',
	moduleName: 'Style Tweaks',
	description: 'Provides a number of style tweaks to the Reddit interface. Also allow you to disable specific subreddit style (the <a href="/prefs/#show_stylesheets">global setting</a> must be on).',
	options: {
		subredditStyleBrowserToolbarButton: {
			type: 'boolean',
			value: true,
			description: 'Add an icon in the omnibar (where the page adress is written) to disable/enable current subreddit style. <i>Google Chrome only</i>',
			noconfig: true // only show for chrome
		},
	},
	isEnabled: function() {
		return RedditResearchConsole.getModulePrefs(this.moduleID);
	},
	include: [
		'all'
	],
	isMatchURL: function() {
		return RedditResearchUtils.isMatchURL(this.moduleID);
	},
	loadDynamicOptions: function() {
		if (BrowserDetect.isChrome()) {
			modules['styleTweaks'].options.subredditStyleBrowserToolbarButton.noconfig = false;
		}
	},
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			if (RedditResearchUtils.currentSubreddit()) {
				this.curSubReddit = RedditResearchUtils.currentSubreddit().toLowerCase();
			}

			this.styleCBName = RedditResearchUtils.randomHash();

			RedditResearchUtils.addCSS('body.res .side .spacer .titlebox div #' + this.styleCBName + ':before { display: none !important;  }');
			RedditResearchUtils.addCSS('body.res .side .spacer .titlebox div #label-' + this.styleCBName + ':before { display: none !important; }');
			RedditResearchUtils.addCSS('body.res .side .spacer .titlebox div #' + this.styleCBName + ':after { display: none !important;  }');
			RedditResearchUtils.addCSS('body.res .side .spacer .titlebox div #label-' + this.styleCBName + ':after { display: none !important; }');

			// In firefox, we need to style tweet expandos because they can't take advantage of twitter.com's widget.js
			if (BrowserDetect.isFirefox()) {
				RedditResearchUtils.addCSS('.res blockquote.twitter-tweet { padding: 15px; border-left: 5px solid #ccc; font-size: 14px; line-height: 20px; }');
				RedditResearchUtils.addCSS('.res blockquote.twitter-tweet p { margin-bottom: 15px; }');
			}
		}
	},
	go: function() {
	},
	floatSideBar: function() {
		this.sideBarElement = document.querySelector('.listing-chooser');
		if (this.sideBarElement) {
			window.addEventListener('scroll', modules['styleTweaks'].handleScroll, false);
		}
	},
	handleScroll: function(e) {
		if (modules['styleTweaks'].scrollTimer) {
			clearTimeout(modules['styleTweaks'].scrollTimer);
		}
		modules['styleTweaks'].scrollTimer = setTimeout(modules['styleTweaks'].handleScrollAfterTimer, 300);
	},
	handleScrollAfterTimer: function(e) {
		if (RedditResearchUtils.elementInViewport(modules['styleTweaks'].sideBarElement)) {
			modules['styleTweaks'].sideBarElement.setAttribute('style', '');
		} else {
			modules['styleTweaks'].sideBarElement.setAttribute('style', 'position: fixed; top: 0; z-index: 100; height: 100%; overflow-y: auto;');
		}
	},
	toggleTweetExpando: function(e) {
		var thisExpando = e.target.nextSibling.nextSibling.nextSibling;
		if (e.target.classList.contains('collapsedExpando')) {
			$(e.target).removeClass('collapsedExpando collapsed').addClass('expanded');
			if (thisExpando.classList.contains('twitterLoaded')) {
				thisExpando.style.display = 'block';
				return;
			}
			var twitterLink = e.target.previousSibling.querySelector('.title');
			if (twitterLink) twitterLink = twitterLink.getAttribute('href').replace('/#!', '');
			var match = twitterLink.match(/twitter.com\/[^\/]+\/(?:status|statuses)\/([\d]+)/i);
			if (match !== null) {
				// var jsonURL = 'http://api.twitter.com/1/statuses/show/'+match[1]+'.json';
				var jsonURL = 'https://api.twitter.com/1/statuses/oembed.json?id=' + match[1],
					thisJSON = {
						requestType: 'loadTweet',
						url: jsonURL
					};
				if (BrowserDetect.isChrome()) {
					// we've got chrome, so we need to hit up the background page to do cross domain XHR

					// first, we need to see if we have permissions for the twitter API...
					var permissionsJSON = {
						requestType: 'permissions',
						callbackID: permissionQueue.count,
						data: {
							origins: ['https://api.twitter.com/*'],
						}
					}
					// save a function call that'll run the expando if our permissions request
					// comes back with a result of true
					permissionQueue.onloads[permissionQueue.count] = function(hasPermission) {
						if (hasPermission) {
							chrome.runtime.sendMessage(thisJSON, function(response) {
								// send message to background.html
								var tweet = response;
								$(thisExpando).html(tweet.html);
								thisExpando.style.display = 'block';
								thisExpando.classList.add('twitterLoaded');
							});
						} else {
							// close the expando since we don't have permission.
							$(e.target).removeClass('expanded').addClass('collapsed collapsedExpando');
						}
					}
					permissionQueue.count++;

					// we do a noop in the callback here because we can't actually get a
					// response - there's multiple async calls going on...
					chrome.runtime.sendMessage(permissionsJSON, function(response) {});

				} else if (BrowserDetect.isSafari()) {
					// we've got safari, so we need to hit up the background page to do cross domain XHR
					modules['styleTweaks'].tweetExpando = thisExpando;
					safari.self.tab.dispatchMessage(thisJSON.requestType, thisJSON);
				} else if (BrowserDetect.isOpera()) {
					// we've got opera, so we need to hit up the background page to do cross domain XHR
					modules['styleTweaks'].tweetExpando = thisExpando;
					opera.extension.postMessage(JSON.stringify(thisJSON));
				} else if (BrowserDetect.isFirefox()) {
					// we've got a jetpack extension, hit up the background page...
					// we have to omit the script tag and all of the nice formatting it brings us in Firefox
					// because AMO does not permit externally hosted script tags being pulled in from
					// oEmbed like this...
					jsonURL += '&omit_script=true';
					modules['styleTweaks'].tweetExpando = thisExpando;
					self.postMessage(thisJSON);
				}
			}
		} else {
			$(e.target).removeClass('expanded').addClass('collapsedExpando').addClass('collapsed');
			thisExpando.style.display = 'none';
		}

	},
	navTop: function() {
		RedditResearchUtils.addCSS('#header-bottom-right { top: 19px; border-radius: 0 0 0 3px; bottom: auto;  }');
		RedditResearchUtils.addCSS('.beta-notice { top: 48px; }');
		$('body, #header-bottom-right').addClass('res-navTop');
	},
	commentBoxes: function() {
		document.html.classList.add('res-commentBoxes');
		if (this.options.commentRounded.value) {
			document.html.classList.add('res-commentBoxes-rounded');
		}
		if (this.options.continuity.value) {
			document.html.classList.add('res-continuity');
		}
		if (this.options.commentHoverBorder.value) {
			document.html.classList.add('res-commentHoverBorder');
		}
		if (this.options.commentIndent.value) {
			// this should override the default of 10px in commentboxes.css because it's added later.
			RedditResearchUtils.addCSS('.res-commentBoxes .comment { margin-left:' + this.options.commentIndent.value + 'px !important; }');
		}
	},
	subredditStyles: function() {
		if (!RedditResearchUtils.currentSubreddit() || !modules['styleTweaks'].options.subredditStyleBrowserToolbarButton.value) {
			// Chrome pageAction
			if (BrowserDetect.isChrome()) {
				RedditResearchUtils.sendMessage({
					requestType: 'pageAction',
					action: 'hide'
				});
			}
		}

		this.ignoredSubReddits = [];
		var getIgnored = RedditResearchStorage.getItem('RedditResearchmodules.styleTweaks.ignoredSubredditStyles'),
			subredditTitle, subredditStylesWhitelist, index;

		if (getIgnored) {
			this.ignoredSubReddits = safeJSON.parse(getIgnored, 'RedditResearchmodules.styleTweaks.ignoredSubredditStyles');
		}
		subredditTitle = document.querySelector('.titlebox h1');
		this.styleToggleContainer = document.createElement('div');
		this.styleToggleLabel = document.createElement('label');
		this.styleToggleCheckbox = document.createElement('input');
		this.styleToggleCheckbox.setAttribute('type', 'checkbox');
		this.styleToggleCheckbox.setAttribute('id', this.styleCBName);
		this.styleToggleCheckbox.setAttribute('name', this.styleCBName);

		// are we blacklisting, or whitelisting subreddits?  If we're in night mode on a sub that's
		// incompatible with it, we want to check the whitelist. Otherwise, check the blacklist.

		if ((this.curSubReddit !== null) && (subredditTitle !== null)) {
			if (modules['nightMode'].isNightModeOn() &&
					!modules['nightMode'].isNightmodeCompatible) {
				subredditStylesWhitelist = modules['nightMode'].options.subredditStylesWhitelist.value.split(',');
				index = subredditStylesWhitelist.indexOf(this.curSubReddit);

				if (index !== -1) {
					this.styleToggleCheckbox.checked = true;
				}
			} else {
				index = this.ignoredSubReddits.indexOf(this.curSubReddit);

				if (index === -1) {
					this.styleToggleCheckbox.checked = true;
				} else {
					this.toggleSubredditStyle(false);
				}
			}
			this.styleToggleCheckbox.addEventListener('change', function(e) {
				modules['styleTweaks'].toggleSubredditStyle(this.checked);
			}, false);
			this.styleToggleContainer.appendChild(this.styleToggleCheckbox);
			RedditResearchUtils.insertAfter(subredditTitle, this.styleToggleContainer);
		}
		// Chrome pageAction
		if (BrowserDetect.isChrome() && modules['styleTweaks'].options.subredditStyleBrowserToolbarButton.value) {
			RedditResearchUtils.sendMessage({
				requestType: 'pageAction',
				action: 'show',
				visible: this.styleToggleCheckbox.checked
			});
		}

		this.styleToggleLabel.setAttribute('for', this.styleCBName);
		this.styleToggleLabel.setAttribute('id', 'label-' + this.styleCBName);
		this.styleToggleLabel.textContent = 'Use subreddit style ';
		this.styleToggleContainer.appendChild(this.styleToggleLabel);

		this.protectElement(this.styleToggleContainer, 'display: block !important;');
		this.protectElement(this.styleToggleCheckbox, 'display: inline-block !important;');
		this.protectElement(this.styleToggleLabel, 'display: inline-block !important; margin-left: 4px !important;');

		this.setSRStyleToggleVisibility(true); // no source
	},
	srstyleHideLock: RedditResearchUtils.createMultiLock(),
	setSRStyleToggleVisibility: function(visible, source) {
		/// When showing/hiding popups which could overlay the "Use subreddit style" checkbox,
		/// set the checkbox's styling to "less visible" or "more visible"
		/// @param 	visible 		bool	make checkbox "more visible" (true) or less (false)
		/// @param 	source 	string 	popup ID, so checkbox stays less visible until that popup's lock is released
		var self = modules['styleTweaks'];
		if (!self.styleToggleContainer) return;

		if (typeof source !== "undefined") {
			if (visible) {
				self.srstyleHideLock.unlock(source);
			} else {
				self.srstyleHideLock.lock(source);
			}
		}

		modules['styleTweaks'].applyTopmostElementProtection(visible);
	},
	applyTopmostElementProtection: function(visible) {
		var self = modules['styleTweaks'];
		if (typeof visible === "undefined") {
			visible = true;
		}
		if (visible && self.srstyleHideLock.locked()) {
			visible = false;
		}

		// great, now people are still finding ways to hide this.. these extra declarations are to try and fight that.
		// Sorry, subreddit moderators, but users can disable all subreddit stylesheets if they want - this is a convenience
		// for them and I think taking this functionality away from them is unacceptable.

		var zIndex = 'z-index: ' + (visible ? ' 2147483646' : 'auto') + ' !important;';

		self.protectedElements.each(function(index, element) {
			var elementCss = element.getAttribute('data-res-css') || '';
			var css = RedditResearchUtils.baseStyleProtection + zIndex + elementCss;
			element.setAttribute('style', css);
		});
	},
	protectElement: function(element, css) {
		var elements = modules['styleTweaks'].protectedElements || $();
		modules['styleTweaks'].protectedElements = elements.add(element);

		if (css) {
			$(element).attr('data-res-css', css);
		}

		modules['styleTweaks'].applyTopmostElementProtection();
		modules['styleTweaks'].setupProtectProtectedElements();
	},
	protectedElements: undefined,
	protectProtectedElements: function() {
		return; // too many dragons
		if (RedditResearchUtils.currentSubreddit() === null || RedditResearchUtils.currentSubreddit() === void 0) return;
		if (!document.body) {
			modules['styleTweaks'].setupProtectProtectedElements();
			return;
		}
		if (document.body.classList.contains('multi-page')) return;
		if (!(modules['styleTweaks'].protectedElements && modules['styleTweaks'].protectedElements.length)) return;
		if (!modules['styleTweaks'].options.protectRedditResearchElements.value) return;

		var self = modules['styleTweaks'],
			$window = $(window),
			windowScroll = {
				left: $window.scrollLeft(),
				top: $window.scrollTop(),
				width: $window.width(),
				height: $window.height()
			},
			protectedElements = self.protectedElements.filter(':not([data-res-protect-checked])'),
			someElementNotVisible = false;

		protectedElements.each(function(index, element) {
			var $element = $(element);
			var insideHiddenContainer = [].some.call($element.parentsUntil('html'), function(elem) { return window.getComputedStyle(elem).display === 'none'; });

			if (!insideHiddenContainer) {
				//do {
					var offset = $element.offset();
					var checkPosition = { x: offset.left, y: offset.top };
					if (!isPositionInViewport(checkPosition)) {
						someElementNotVisible = true;
						return;
					} else {
						var elementAtProtectedPosition = document.elementFromPoint(checkPosition.x - windowScroll.left, checkPosition.y - windowScroll.top);
						var elementIsTopmost = !elementAtProtectedPosition || $element.is(elementAtProtectedPosition) || $element.has(elementAtProtectedPosition).length;
						if (!elementIsTopmost && !$(elementAtProtectedPosition).is("html, body")) {
							$(elementAtProtectedPosition).remove();
						}
					}
				//} while (!elementIsTopmost);
			}

			element.setAttribute('data-res-protect-checked', true);  // don't use .attr('data-foo', 'bar') because jQuery converts that to .data('foo', 'bar'), and RES doesn't include :data() selector
		});

		if (someElementNotVisible) {
			// Some elements were not checked, try again later
			$(window).on('scroll', self.setupProtectProtectedElements);
		} else {
			$(window).off('scroll', self.setupProtectProtectedElements);
		}

		function isPositionInViewport(position) {
			if (position.x < windowScroll.left)
				return false;

			if (windowScroll.left + windowScroll.width < position.x)
				return false;

			if (position.y < windowScroll.top)
				return false;

			if (windowScroll.top + windowScroll.height < position.y)
				return false;

			return true;
		}
	},
	setupProtectProtectedElements: function() {
		var self = modules['styleTweaks'];

		clearTimeout(self.scrollListener);
		self.scrollListener = setTimeout(self.protectProtectedElements, 200);
	},
	toggleSubredditStyle: function(toggle, subreddit) {
		if (toggle) {
			this.enableSubredditStyle(subreddit);
		} else {
			this.disableSubredditStyle(subreddit);
		}
	},
	enableSubredditStyle: function(subreddit) {
		var togglesr = subreddit ? subreddit.toLowerCase() : this.curSubReddit;
		this.head = this.head || document.getElementsByTagName("head")[0];

		var subredditStyleSheet = document.createElement('link');
		subredditStyleSheet.setAttribute('title', 'applied_subreddit_stylesheet');
		subredditStyleSheet.setAttribute('rel', 'stylesheet');
		subredditStyleSheet.setAttribute('href', '/r/' + togglesr + '/stylesheet.css');
		if (!subreddit || (subreddit.toLowerCase() === this.curSubReddit)) this.head.appendChild(subredditStyleSheet);

		if (BrowserDetect.isChrome()) {
			// in case it was set by the pageAction, be sure to check the checkbox.
			if (this.styleToggleCheckbox) {
				this.styleToggleCheckbox.checked = true;
			}
			RedditResearchUtils.sendMessage({
				requestType: 'pageAction',
				action: 'stateChange',
				visible: true
			});
		}
	},
	disableSubredditStyle: function(subreddit) {
		var togglesr = subreddit ? subreddit.toLowerCase() : this.curSubReddit;
		this.head = this.head || document.getElementsByTagName("head")[0];

		var subredditStyleSheet = this.head.querySelector('link[title=applied_subreddit_stylesheet]');
		if (!subredditStyleSheet) subredditStyleSheet = this.head.querySelector('style[title=applied_subreddit_stylesheet]');
		if (!subredditStyleSheet) subredditStyleSheet = this.head.querySelector('style[data-apng-original-href]'); // apng extension fix (see #1076)
		if ((subredditStyleSheet) && (!subreddit || (subreddit.toLowerCase() === this.curSubReddit))) {
			subredditStyleSheet.parentNode.removeChild(subredditStyleSheet);
		}

		if (BrowserDetect.isChrome()) {
			// in case it was set by the pageAction, be sure to uncheck the checkbox.
			if (this.styleToggleCheckbox) {
				this.styleToggleCheckbox.checked = false;
			}
			RedditResearchUtils.sendMessage({
				requestType: 'pageAction',
				action: 'stateChange',
				visible: false
			});
		}

	},
	addDisableAnimationsClass: function() {
		if (!document.body) {
			setTimeout(modules['styleTweaks'].addDisableAnimationsClass, 200);
			return;
		}
		document.body.classList.add('res-animations-disabled');
	},
	disableAnimations: function() {
		var selectors = [];

		modules['styleTweaks'].addDisableAnimationsClass();
		// This CSS is engineered to disable most animations without making the selector completely ridiculous.
		// If they get too obnoxious, then use the "disable subreddit style" hammer.
		RedditResearchUtils.addCSS('\
			html body.res #header:before,   \
			html body.res #header:after,   \
			html body.res #header *,	\
			html body.res #header *:before,   \
			html body.res #header *:after,   \
			html body.res #header ~ *,	\
			html body.res #header ~ *:before,	\
			html body.res #header ~ *:after,	\
			html body.res #header ~ * *,	\
			html body.res #header ~ * *:before,	\
			html body.res #header ~ * *:after,	\
			html body.res #header ~ * #siteTable *,	\
			html body.res #header ~ * #siteTable *:before,	\
			html body.res #header ~ * #siteTable *:after {	\
				-o-transition-property: none !important;	\
				-moz-transition-property: none !important;	\
				-ms-transition-property: none !important;	\
				-webkit-transition-property: none !important;	\
				transition-property: none !important;	\
				-webkit-animation: none !important;	\
				-moz-animation: none !important;	\
				-o-animation: none !important;	\
				-ms-animation: none !important;	\
				animation: none !important;	\
			}	\
			');
	}
};
