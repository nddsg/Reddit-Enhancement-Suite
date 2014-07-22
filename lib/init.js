var _beforeLoadComplete = false;

function RESResearchdoBeforeLoad() {
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

				RESResearchUtils.getOptions(thisModuleID);
			}
		}
		// console.log('get options end: ' + Date());
		for (var thisModuleID in modules) {
			if (typeof modules[thisModuleID] === 'object') {
				if (typeof modules[thisModuleID].beforeLoad === 'function') modules[thisModuleID].beforeLoad();
			}
		}
		// apply style...
		RESResearchUtils.addStyle(RESResearchUtils.css);
		// clear out css cache...
		RESResearchUtils.css = '';
	} else {
		setTimeout(RESResearchdoBeforeLoad, 1);
	}
}

function RESResearchInit() {
	// if RESResearchStorage isn't fully loaded, and _beforeLoadComplete isn't true,
	// then wait. It means we haven't read all of the modules' options yet.
	if (!RESResearchStorage.isReady || !_beforeLoadComplete) {
		setTimeout(RESResearchInit, 10);
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
		else return $(this).html(RESResearchUtils.sanitizeHTML(string));
	};

	RESResearchUtils.initObservers();
	var localStorageFail = false;
	/*
	var backup = {};
	$.extend(backup, RESResearchStorage);
	delete backup.getItem;
	delete backup.setItem;
	delete backup.removeItem;
	console.log(backup);
	*/

	// Check for localStorage functionality...
	try {
		localStorage.setItem('RESResearch.localStorageTest', 'test');
		BrowserStrategy.localStorageTest();
	} catch (e) {
		localStorageFail = true;
	}

	document.body.classList.add('RESResearch', 'RESResearch-v430');

	// report the version of RESResearch to reddit's advisory checker.
	var RESResearchVersionReport = RESResearchUtils.createElementWithID('div','RESResearchConsoleVersion');
	RESResearchVersionReport.setAttribute('style','display: none;');
	RESResearchVersionReport.textContent = RESResearchVersion;
	document.body.appendChild(RESResearchVersionReport);

	if (localStorageFail) {
		RESResearchFail = "Sorry, but localStorage seems inaccessible. Reddit Enhancement Suite can't work without it. \n\n";
		if (BrowserDetect.isSafari()) {
			RESResearchFail += 'Since you\'re using Safari, it might be that you\'re in private browsing mode, which unfortunately is incompatible with RESResearch until Safari provides a way to allow extensions localStorage access.';
		} else if (BrowserDetect.isChrome()) {
			RESResearchFail += 'Since you\'re using Chrome, you might just need to go to your extensions settings and check the "Allow in Incognito" box.';
		} else if (BrowserDetect.isOpera()) {
			RESResearchFail += 'Since you\'re using Opera, you might just need to go to your extensions settings and click the gear icon, then click "privacy" and check the box that says "allow interaction with private tabs".';
		} else {
			RESResearchFail += 'Since it looks like you\'re using Firefox, you probably need to go to about:config and ensure that dom.storage.enabled is set to true, and that dom.storage.default_quota is set to a number above zero (i.e. 5120, the normal default)".';
		}
		var userMenu = document.querySelector('#header-bottom-right');
		if (userMenu) {
			var preferencesUL = userMenu.querySelector('UL');
			var separator = document.createElement('span');
			separator.setAttribute('class', 'separator');
			separator.textContent = '|';
			RESResearchPrefsLink = document.createElement('a');
			RESResearchPrefsLink.setAttribute('href', 'javascript:void(0)');
			RESResearchPrefsLink.addEventListener('click', function(e) {
				e.preventDefault();
				alert(RESResearchFail);
			}, true);
			RESResearchPrefsLink.textContent = '[RESResearch - ERROR]';
			RESResearchPrefsLink.setAttribute('style', 'color: red; font-weight: bold;');
			RESResearchUtils.insertAfter(preferencesUL, RESResearchPrefsLink);
			RESResearchUtils.insertAfter(preferencesUL, separator);
		}
	} else {
		document.body.addEventListener('mousemove', RESResearchUtils.setMouseXY, false);
		// added this if statement because some people's Greasemonkey "include" lines are getting borked or ignored, so they're calling RESResearch on non-reddit pages.
		if (RESResearchUtils.allRegex.test(location.href)) {
			RESResearchUtils.firstRun();
			RESResearchUtils.checkForUpdate();
			// add the config console link...
			// RESResearchConsole.create();

			RESResearchConsole.addConsoleLink();
			RESResearchConsole.addConsoleDropdown();
			RESResearchUtils.checkIfSubmitting();
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
			RESResearchUtils.addStyle(RESResearchUtils.css);
			//	console.log('end: ' + Date());
		}
		if ((location.href.indexOf('reddit.honestbleeps.com/download') !== -1) ||
				(location.href.indexOf('redditenhancementsuite.com/download') !== -1)) {
			var installLinks = document.body.querySelectorAll('.install');
			for (var i = 0, len = installLinks.length; i < len; i++) {
				installLinks[i].classList.add('update');
				installLinks[i].classList.add('RESResearch4'); // if update but not RESResearch 4, then FF users == greasemonkey...
				installLinks[i].classList.remove('install');
			}
		}

		RESResearchTemplates.load();
	}

	RESResearchUtils.postLoad = true;
}
