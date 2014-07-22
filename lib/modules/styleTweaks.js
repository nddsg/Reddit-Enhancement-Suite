modules['styleTweaks'] = {
	moduleID: 'styleTweaks',
	moduleName: 'Style Tweaks',
	description: 'Provides a number of style tweaks to the Reddit interface. Also allow you to disable specific subreddit style (the <a href="/prefs/#show_stylesheets">global setting</a> must be on).',
	isEnabled: function() {
		return RESResearchConsole.getModulePrefs(this.moduleID);
	},
	include: [
		'all'
	],
	isMatchURL: function() {
		return RESResearchUtils.isMatchURL(this.moduleID);
	},
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			if (RESResearchUtils.currentSubreddit()) {
				this.curSubReddit = RESResearchUtils.currentSubreddit().toLowerCase();
			}

			this.styleCBName = RESResearchUtils.randomHash();
			RESResearchUtils.addCSS('body.res .side .spacer .titlebox div #' + this.styleCBName + ':before { display: none !important;  }');
			RESResearchUtils.addCSS('body.res .side .spacer .titlebox div #label-' + this.styleCBName + ':before { display: none !important; }');
			RESResearchUtils.addCSS('body.res .side .spacer .titlebox div #' + this.styleCBName + ':after { display: none !important;  }');
			RESResearchUtils.addCSS('body.res .side .spacer .titlebox div #label-' + this.styleCBName + ':after { display: none !important; }');

			// In firefox, we need to style tweet expandos because they can't take advantage of twitter.com's widget.js
			if (BrowserDetect.isFirefox()) {
				RESResearchUtils.addCSS('.res blockquote.twitter-tweet { padding: 15px; border-left: 5px solid #ccc; font-size: 14px; line-height: 20px; }');
				RESResearchUtils.addCSS('.res blockquote.twitter-tweet p { margin-bottom: 15px; }');
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
		if (RESResearchUtils.elementInViewport(modules['styleTweaks'].sideBarElement)) {
			modules['styleTweaks'].sideBarElement.setAttribute('style', '');
		} else {
			modules['styleTweaks'].sideBarElement.setAttribute('style', 'position: fixed; top: 0; z-index: 100; height: 100%; overflow-y: auto;');
		}
	},
	isDark: function() {
		return this.options.lightOrDark.value === 'dark';
	},
	handleNightModeAtStart: function() {
		this.nightModeWhitelist = [];
		var getWhitelist = RESResearchStorage.getItem('RESResearchmodules.styleTweaks.nightModeWhitelist');
		if (getWhitelist) {
			this.nightModeWhitelist = safeJSON.parse(getWhitelist, 'RESResearchmodules.styleTweaks.nightModeWhitelist');
		}
		var idx = this.nightModeWhitelist.indexOf(this.curSubReddit);
		if (idx !== -1) {
			// go no further. this subreddit is whitelisted.
			return;
		}

		// check the sidebar for a link [](#/RESResearch_SR_Config/NightModeCompatible) that indicates the sub is night mode compatible.
		this.isNightmodeCompatible = (document.querySelector('.side a[href="#/RESResearch_SR_Config/NightModeCompatible"]') !== null);
		this.isNightmodeCompatible = this.isNightmodeCompatible || this.options.useSubredditStyleInDarkMode.value;

		// if night mode is on and the sub isn't compatible, disable its stylesheet.
		if (this.isDark() && !this.isNightmodeCompatible) {
			// hide header images since sub isn't night mode compatible and therefore they
			// may be bright images, etc.
			RESResearchUtils.addCSS('.res-nightmode #header, .res-nightmode #header-bottom-left { background: #666660!important; }')
			this.disableSubredditStyle();
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
		RESResearchUtils.addCSS('#header-bottom-right { top: 19px; border-radius: 0 0 0 3px; bottom: auto;  }');
		RESResearchUtils.addCSS('.beta-notice { top: 48px; }');
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
			RESResearchUtils.addCSS('.res-commentBoxes .comment { margin-left:' + this.options.commentIndent.value + 'px !important; }');
		}
	},
	switchLight: function() {
		RESResearchUtils.addCSS(".lightOn { background-position: 0 -96px; } ");
		RESResearchUtils.addCSS(".lightOff { background-position: 0 -108px; } ");
		var thisFrag = document.createDocumentFragment();
		this.lightSwitch = document.createElement('li');
		this.lightSwitch.setAttribute('title', "Toggle night and day");
		this.lightSwitch.addEventListener('click', function(e) {
			e.preventDefault();
			if (modules['styleTweaks'].isDark()) {
				modules['styleTweaks'].lightSwitchToggle.classList.remove('enabled');
				modules['styleTweaks'].disableNightMode();
			} else {
				modules['styleTweaks'].lightSwitchToggle.classList.add('enabled');
				modules['styleTweaks'].enableNightMode();
			}
		}, true);
		// this.lightSwitch.setAttribute('id','lightSwitch');
		this.lightSwitch.textContent = 'night mode';
		this.lightSwitchToggle = RESResearchUtils.createElementWithID('div', 'lightSwitchToggle', 'toggleButton');
		$(this.lightSwitchToggle).html('<span class="toggleOn">on</span><span class="toggleOff">off</span>');
		this.lightSwitch.appendChild(this.lightSwitchToggle);
		if (this.isDark()) {
			this.lightSwitchToggle.classList.add('enabled')
		} else {
			this.lightSwitchToggle.classList.remove('enabled');
		}
		// thisFrag.appendChild(separator);
		thisFrag.appendChild(this.lightSwitch);
		// if (RESResearchConsole.RESResearchPrefsLink) insertAfter(RESResearchConsole.RESResearchPrefsLink, thisFrag);
		$('#RESResearchDropdownOptions').append(this.lightSwitch);
	},
	subredditStyles: function() {
		if (!RESResearchUtils.currentSubreddit()) return;
		this.ignoredSubReddits = [];
		var getIgnored = RESResearchStorage.getItem('RESResearchmodules.styleTweaks.ignoredSubredditStyles');
		if (getIgnored) {
			this.ignoredSubReddits = safeJSON.parse(getIgnored, 'RESResearchmodules.styleTweaks.ignoredSubredditStyles');
		}
		var subredditTitle = document.querySelector('.titlebox h1');
		this.styleToggleContainer = document.createElement('div');
		this.styleToggleLabel = document.createElement('label');
		this.styleToggleCheckbox = document.createElement('input');
		this.styleToggleCheckbox.setAttribute('type', 'checkbox');
		this.styleToggleCheckbox.setAttribute('id', this.styleCBName);
		this.styleToggleCheckbox.setAttribute('name', this.styleCBName);

		// are we blacklisting, or whitelisting subreddits?  If we're in night mode on a sub that's
		// incompatible with it, we want to check the whitelist. Otherwise, check the blacklist.

		if ((this.curSubReddit !== null) && (subredditTitle !== null)) {

			if (this.isDark() && !this.isNightmodeCompatible) {
				var idx = this.nightModeWhitelist.indexOf(this.curSubReddit);
				if (idx !== -1) {
					this.styleToggleCheckbox.checked = true;
				}
			} else {
				var idx = this.ignoredSubReddits.indexOf(this.curSubReddit);
				if (idx === -1) {
					this.styleToggleCheckbox.checked = true;
				} else {
					this.toggleSubredditStyle(false);
				}
			}
			this.styleToggleCheckbox.addEventListener('change', function(e) {
				modules['styleTweaks'].toggleSubredditStyle(this.checked);
			}, false);
			this.styleToggleContainer.appendChild(this.styleToggleCheckbox);
			RESResearchUtils.insertAfter(subredditTitle, this.styleToggleContainer);
		}
		this.styleToggleLabel.setAttribute('for', this.styleCBName);
		this.styleToggleLabel.setAttribute('id', 'label-' + this.styleCBName);
		this.styleToggleLabel.textContent = 'Use subreddit style ';
		this.styleToggleContainer.appendChild(this.styleToggleLabel);
		this.setSRStyleToggleVisibility(true); // no source
	},
	srstyleHideLock: RESResearchUtils.createMultiLock(),
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

		if (visible && self.srstyleHideLock.locked()) {
			visible = false;
		}

		// great, now people are still finding ways to hide this.. these extra declarations are to try and fight that.
		// Sorry, subreddit moderators, but users can disable all subreddit stylesheets if they want - this is a convenience
		// for them and I think taking this functionality away from them is unacceptable.

		var zIndex = 'z-index: ' + (visible ? ' 2147483646' : 'auto') + ' !important;';

		var baseStyleProtection =  'margin: 0 !important; background-color: inherit !important; color: inherit !important; position: relative !important; left: 0 !important; top: 0 !important; max-height: none!important; max-width: none!important; height: auto !important; width: auto !important; visibility: visible !important; overflow: auto !important; text-indent: 0 !important; font-size: 12px !important; float: none !important; opacity: 1 !important;' + RESResearchUtils.cssPrefix('transform: none !important;');
		self.styleToggleContainer.setAttribute('style', [baseStyleProtection, zIndex, 'display: block !important;'].join(';'));
		self.styleToggleCheckbox.setAttribute('style', [baseStyleProtection, zIndex, 'display: inline-block !important;'].join(';'));
		self.styleToggleLabel.setAttribute('style', [baseStyleProtection, zIndex, 'display: inline-block !important; margin-left: 4px !important;'].join(';'));
	},
	checkStyleToggleVisibility: function() {
		if (!modules['styleTweaks'].styleToggleContainer) return;
		var self = modules['styleTweaks'],
			pos = $(self.styleToggleContainer).offset(),
			checkPos = {
				x: pos.left + 20,
				y: pos.top + 5
			},
			ele;

		if ($(window).scrollTop() > pos.top) {
			self.scrollListener = null;
			$(window).on('scroll', self.setupCheckStyleToggleVisibility);
		} else {
			ele = document.elementFromPoint(checkPos.x, checkPos.y);
			if (
				(ele !== self.styleToggleContainer) &&
				(ele !== self.styleToggleCheckbox) &&
				(ele !== self.styleToggleLabel)
				) {
				$(ele).remove();
			}
			$(window).off('scroll', self.setupCheckStyleToggleVisibility);
		}

	},
	setupCheckStyleToggleVisibility: function() {
		var self = modules['styleTweaks'];

		if (self.scrollListener) { clearTimeout(self.scrollListener); }
		self.scrollListener = setTimeout(self.checkStyleToggleVisibility, 200);
	},
	toggleSubredditStyle: function(toggle, subreddit) {
		var togglesr = (subreddit) ? subreddit.toLowerCase() : this.curSubReddit;
		if (toggle) {
			this.enableSubredditStyle(subreddit);
		} else {
			this.disableSubredditStyle(subreddit);
		}
	},
	enableSubredditStyle: function(subreddit) {
		var togglesr = (subreddit) ? subreddit.toLowerCase() : this.curSubReddit;

		if (this.isDark() && !this.isNightmodeCompatible) {
			var idx = this.nightModeWhitelist.indexOf(togglesr);
			if (idx === -1) this.nightModeWhitelist.push(togglesr); // add if not found
			RESResearchStorage.setItem('RESResearchmodules.styleTweaks.nightModeWhitelist', JSON.stringify(this.nightModeWhitelist));
		} else if (this.ignoredSubReddits) {
			var idx = this.ignoredSubReddits.indexOf(togglesr);
			if (idx !== -1) this.ignoredSubReddits.splice(idx, 1); // Remove it if found...
			RESResearchStorage.setItem('RESResearchmodules.styleTweaks.ignoredSubredditStyles', JSON.stringify(this.ignoredSubReddits));
		}

		var subredditStyleSheet = document.createElement('link');
		subredditStyleSheet.setAttribute('title', 'applied_subreddit_stylesheet');
		subredditStyleSheet.setAttribute('rel', 'stylesheet');
		subredditStyleSheet.setAttribute('href', '/r/' + togglesr + '/stylesheet.css');
		if (!subreddit || (subreddit == this.curSubReddit)) this.head.appendChild(subredditStyleSheet);
	},
	disableSubredditStyle: function(subreddit) {
		var togglesr = (subreddit) ? subreddit.toLowerCase() : this.curSubReddit;

		if (this.isDark() && !this.isNightmodeCompatible) {
			var idx = this.nightModeWhitelist.indexOf(togglesr);
			if (idx !== -1) this.nightModeWhitelist.splice(idx, 1); // Remove it if found...
			RESResearchStorage.setItem('RESResearchmodules.styleTweaks.nightModeWhitelist', JSON.stringify(this.nightModeWhitelist));
		} else if (this.ignoredSubReddits) {
			var idx = this.ignoredSubReddits.indexOf(togglesr); // Find the index
			if (idx === -1) this.ignoredSubReddits.push(togglesr);
			RESResearchStorage.setItem('RESResearchmodules.styleTweaks.ignoredSubredditStyles', JSON.stringify(this.ignoredSubReddits));
		}

		var subredditStyleSheet = this.head.querySelector('link[title=applied_subreddit_stylesheet]');
		if (!subredditStyleSheet) subredditStyleSheet = this.head.querySelector('style[title=applied_subreddit_stylesheet]');
		if (!subredditStyleSheet) subredditStyleSheet = this.head.querySelector('style[data-apng-original-href]'); // apng extension fix (see #1076)
		if ((subredditStyleSheet) && (!subreddit || (subreddit == this.curSubReddit))) {
			subredditStyleSheet.parentNode.removeChild(subredditStyleSheet);
		}
	},
	enableNightMode: function() {
		// Set the user preference, if possible (which is not at page load)
		if (RESResearchStorage.getItem) {
			RESResearchUtils.setOption('styleTweaks', 'lightOrDark', 'dark');
		}

		localStorage.setItem('RESResearch_nightMode', true);
		document.html.classList.add('res-nightmode');

		if (document.body) {
			document.body.classList.add('res-nightmode');
		}
	},
	disableNightMode: function() {
		// Set the user preference, if possible (which is not at page load)
		if (RESResearchStorage.getItem) {
			RESResearchUtils.setOption('styleTweaks', 'lightOrDark', 'light');
		}

		localStorage.removeItem('RESResearch_nightMode');
		document.html.classList.remove('res-nightmode');

		if (document.body) {
			document.body.classList.remove('res-nightmode');
		}
	}
};
