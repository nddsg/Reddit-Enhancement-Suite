var _beforeLoadComplete = false;

function RedditResearchdoBeforeLoad() {
	if (document && document.html && document.html.classList) {
		if (_beforeLoadComplete) return;
		_beforeLoadComplete = true;
		// if (beforeLoadDoneOnce) return;
		// first, go through each module and set all of the options so that if a module needs to check another module's options, they're ready...
		// console.log('get options start: ' + Date());
		for (var thisModuleID in modules) {
			if (typeof modules[thisModuleID] === 'object') {

				// Allow the module to instaniate any dynamic options
				if (typeof modules[thisModuleID].loadDynamicOptions === 'function') {
					modules[thisModuleID].loadDynamicOptions();
				}

				RedditResearchUtils.getOptions(thisModuleID);
			}
		}
		// console.log('get options end: ' + Date());
		for (var thisModuleID in modules) {
			if (typeof modules[thisModuleID] === 'object') {
				if (typeof modules[thisModuleID].beforeLoad === 'function') modules[thisModuleID].beforeLoad();
			}
		}
		// apply style...
		RedditResearchUtils.addStyle(RedditResearchUtils.css);
		// clear out css cache...
		RedditResearchUtils.css = '';
	} else {
		setTimeout(RedditResearchdoBeforeLoad, 1);
	}
}

function RedditResearchInit() {
	// if RedditResearchStorage isn't fully loaded, and _beforeLoadComplete isn't true,
	// then wait. It means we haven't read all of the modules' options yet.
	if (!RedditResearchStorage.isReady || !_beforeLoadComplete) {
		setTimeout(RedditResearchInit, 10);
		return;
	}

	// $.browser shim since jQuery removed it
	$.browser = {
		safari: BrowserDetect.isSafari(),
		mozilla: BrowserDetect.isFirefox(),
		chrome: BrowserDetect.isChrome(),
		opera: BrowserDetect.isOpera()
	};

	$.fn.safeHtml = function(string) {
		if (!string) return '';
		else return $(this).html(RedditResearchUtils.sanitizeHTML(string));
	};

	RedditResearchUtils.initObservers();
	var localStorageFail = false;
	/*
	var backup = {};
	$.extend(backup, RedditResearchStorage);
	delete backup.getItem;
	delete backup.setItem;
	delete backup.removeItem;
	console.log(backup);
	*/

	// Check for localStorage functionality...
	try {
		localStorage.setItem('RedditResearch.localStorageTest', 'test');
		BrowserStrategy.localStorageTest();
	} catch (e) {
		localStorageFail = true;
	}

	document.body.classList.add('RedditResearch', 'RedditResearch-v1');

	// report the version of RedditResearch to reddit's advisory checker.
	var RedditResearchVersionReport = RedditResearchUtils.createElementWithID('div','RedditResearchConsoleVersion');
	RedditResearchVersionReport.setAttribute('style','display: none;');
	RedditResearchVersionReport.textContent = RedditResearchVersion;
	document.body.appendChild(RedditResearchVersionReport);

	if (localStorageFail) {
		RedditResearchFail = "Sorry, but localStorage seems inaccessible. Reddit Enhancement Suite can't work without it. \n\n";
		if (BrowserDetect.isSafari()) {
			RedditResearchFail += 'Since you\'re using Safari, it might be that you\'re in private browsing mode, which unfortunately is incompatible with RedditResearch until Safari provides a way to allow extensions localStorage access.';
		} else if (BrowserDetect.isChrome()) {
			RedditResearchFail += 'Since you\'re using Chrome, you might just need to go to your extensions settings and check the "Allow in Incognito" box.';
		} else if (BrowserDetect.isOpera()) {
			RedditResearchFail += 'Since you\'re using Opera, you might just need to go to your extensions settings and click the gear icon, then click "privacy" and check the box that says "allow interaction with private tabs".';
		} else {
			RedditResearchFail += 'Since it looks like you\'re using Firefox, you probably need to go to about:config and ensure that dom.storage.enabled is set to true, and that dom.storage.default_quota is set to a number above zero (i.e. 5120, the normal default)".';
		}
		var userMenu = document.querySelector('#header-bottom-right');
		if (userMenu) {
			var preferencesUL = userMenu.querySelector('UL');
			var separator = document.createElement('span');
			separator.setAttribute('class', 'separator');
			separator.textContent = '|';
			RedditResearchPrefsLink = document.createElement('a');
			RedditResearchPrefsLink.setAttribute('href', 'javascript:void(0)');
			RedditResearchPrefsLink.addEventListener('click', function(e) {
				e.preventDefault();
				alert(RedditResearchFail);
			}, true);
			RedditResearchPrefsLink.textContent = '[RedditResearch - ERROR]';
			RedditResearchPrefsLink.setAttribute('style', 'color: red; font-weight: bold;');
			RedditResearchUtils.insertAfter(preferencesUL, RedditResearchPrefsLink);
			RedditResearchUtils.insertAfter(preferencesUL, separator);
		}
	} else {
		document.body.addEventListener('mousemove', RedditResearchUtils.setMouseXY, false);
		// added this if statement because some people's Greasemonkey "include" lines are getting borked or ignored, so they're calling RedditResearch on non-reddit pages.
		if (RedditResearchUtils.allRegex.test(location.href)) {
			RedditResearchUtils.firstRun();
			RedditResearchUtils.checkForUpdate();
			// add the config console link...
			// RedditResearchConsole.create();

			RedditResearchConsole.addConsoleLink();
			RedditResearchConsole.addConsoleDropdown();
			RedditResearchUtils.checkIfSubmitting();
			// go through each module and run it
			for (var thisModuleID in modules) {
				if (typeof modules[thisModuleID] === 'object') {
					// console.log(thisModuleID + ' start: ' + Date());
					// perfTest(thisModuleID+' start');
					modules[thisModuleID].go();
					// perfTest(thisModuleID+' end');
					// console.log(thisModuleID + ' end: ' + Date());
				}
			}
			RedditResearchUtils.addStyle(RedditResearchUtils.css);
			//	console.log('end: ' + Date());
		}
		if ((location.href.indexOf('reddit.honestbleeps.com/download') !== -1) ||
				(location.href.indexOf('redditenhancementsuite.com/download') !== -1)) {
			var installLinks = document.body.querySelectorAll('.install');
			for (var i = 0, len = installLinks.length; i < len; i++) {
				installLinks[i].classList.add('update');
				installLinks[i].classList.add('RedditResearch4'); // if update but not RedditResearch 4, then FF users == greasemonkey...
				installLinks[i].classList.remove('install');
			}
		}

		RedditResearchTemplates.load();
	}

	RedditResearchUtils.postLoad = true;
}
