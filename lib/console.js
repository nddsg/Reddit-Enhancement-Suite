// define the RedditResearchConsole class
var RedditResearchConsole = {
	modalOverlay: '',
	RedditResearchConsoleContainer: '',
	RedditResearchMenuItems: [],
	RedditResearchConfigPanelOptions: null,
	// make the modules panel accessible to this class for updating (i.e. when preferences change, so we can redraw it)
	RedditResearchConsoleConfigPanel: RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleConfigPanel', 'RedditResearchPanel'),
	RedditResearchConsoleAboutPanel: RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleAboutPanel', 'RedditResearchPanel'),
	RedditResearchConsoleProPanel: RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleProPanel', 'RedditResearchPanel'),
	addConsoleLink: function() {
		this.userMenu = document.querySelector('#header-bottom-right');
		if (this.userMenu) {
			var RedditResearchPrefsLink = $("<span id='openRedditResearchPrefs'><span id='RedditResearchSettingsButton' title='RedditResearch Settings' class='RedditResearchGearIcon'></span>")
				.mouseenter(RedditResearchConsole.showPrefsDropdown);
			$(this.userMenu).find("ul").after(RedditResearchPrefsLink).after("<span class='separator'>|</span>");
			this.RedditResearchPrefsLink = RedditResearchPrefsLink[0];
		}
	},
	addConsoleDropdown: function() {
		this.gearOverlay = RedditResearchUtils.createElementWithID('div', 'RedditResearchMainGearOverlay');
		this.gearOverlay.setAttribute('class', 'RedditResearchGearOverlay');
		$(this.gearOverlay).html('<div class="RedditResearchGearIcon"></div>');

		this.prefsDropdown = RedditResearchUtils.createElementWithID('div', 'RedditResearchPrefsDropdown', 'RedditResearchDropdownList');
		$(this.prefsDropdown).html('<ul id="RedditResearchDropdownOptions"><li id="SettingsConsole">Research settings console</li>');
		var thisSettingsButton = this.prefsDropdown.querySelector('#SettingsConsole');
		this.settingsButton = thisSettingsButton;
		thisSettingsButton.addEventListener('click', function() {
			RedditResearchConsole.hidePrefsDropdown();
			RedditResearchConsole.open();
		}, true);
		$(this.prefsDropdown).mouseleave(function() {
			RedditResearchConsole.hidePrefsDropdown();
		});
		$(this.prefsDropdown).mouseenter(function() {
			clearTimeout(RedditResearchConsole.prefsTimer);
		});
		$(this.gearOverlay).mouseleave(function() {
			RedditResearchConsole.prefsTimer = setTimeout(function() {
				RedditResearchConsole.hidePrefsDropdown();
			}, 1000);
		});
		document.body.appendChild(this.gearOverlay);
		document.body.appendChild(this.prefsDropdown);
		if (RedditResearchStorage.getItem('RedditResearch.newAnnouncement', 'true')) {
			RedditResearchUtils.setNewNotification();
		}
	},
	showPrefsDropdown: function(e) {
		var thisTop = parseInt($(RedditResearchConsole.userMenu).offset().top + 1, 10);
		// var thisRight = parseInt($(window).width() - $(RedditResearchConsole.RedditResearchPrefsLink).offset().left, 10);
		// thisRight = 175-thisRight;
		var thisLeft = parseInt($(RedditResearchConsole.RedditResearchPrefsLink).offset().left - 6, 10);
		// $('#RedditResearchMainGearOverlay').css('left',thisRight+'px');
		$('#RedditResearchMainGearOverlay').css('height', $('#header-bottom-right').outerHeight() + 'px');
		$('#RedditResearchMainGearOverlay').css('left', thisLeft + 'px');
		$('#RedditResearchMainGearOverlay').css('top', thisTop + 'px');
		RedditResearchConsole.prefsDropdown.style.top = parseInt(thisTop + $(RedditResearchConsole.userMenu).outerHeight(), 10) + 'px';
		RedditResearchConsole.prefsDropdown.style.right = '0px';
		RedditResearchConsole.prefsDropdown.style.display = 'block';
		$('#RedditResearchMainGearOverlay').show();
		modules['styleTweaks'].setSRStyleToggleVisibility(false, 'prefsDropdown');
	},
	hidePrefsDropdown: function(e) {
		RedditResearchConsole.RedditResearchPrefsLink.classList.remove('open');
		$('#RedditResearchMainGearOverlay').hide();
		RedditResearchConsole.prefsDropdown.style.display = 'none';
		modules['styleTweaks'].setSRStyleToggleVisibility(true, 'prefsDropdown');
	},
	RedditResearchetModulePrefs: function() {
		prefs = {
			'userTagger': true,
			'betteReddit': true,
			'singleClick': true,
			'subRedditTagger': true,
			'uppersAndDowners': true,
			'keyboardNav': true,
			'commentPreview': true,
			'showImages': true,
			'showKarma': true,
			'usernameHider': false,
			'accountSwitcher': true,
			'styleTweaks': true,
			'filteReddit': true,
			'spamButton': false,
			'bitcointip': false,
			'RedditResearchPro': false
		};
		this.setModulePrefs(prefs);
		return prefs;
	},
	getAllModulePrefs: function(force) {
		var storedPrefs;
		// if we've done this before, just return the cached version
		if ((!force) && (typeof this.getAllModulePrefsCached !== 'undefined')) return this.getAllModulePrefsCached;
		// get the stored preferences out first.
		if (RedditResearchStorage.getItem('RedditResearch.modulePrefs') !== null) {
			storedPrefs = safeJSON.parse(RedditResearchStorage.getItem('RedditResearch.modulePrefs'), 'RedditResearch.modulePrefs');
		} else if (RedditResearchStorage.getItem('modulePrefs') !== null) {
			// Clean up old moduleprefs.
			storedPrefs = safeJSON.parse(RedditResearchStorage.getItem('modulePrefs'), 'modulePrefs');
			RedditResearchStorage.removeItem('modulePrefs');
			this.setModulePrefs(storedPrefs);
		} else {
			// looks like this is the first time RedditResearch has been run - set prefs to defaults...
			storedPrefs = this.RedditResearchetModulePrefs();
		}
		if (storedPrefs === null) {
			storedPrefs = {};
		}
		// create a new JSON object that we'll use to return all preferences. This is just in case we add a module, and there's no pref stored for it.
		var prefs = {};
		// for any stored prefs, drop them in our prefs JSON object.
		for (var module in modules) {
			if (storedPrefs[module]) {
				prefs[module] = storedPrefs[module];
			} else if ((!modules[module].disabledByDefault) && ((storedPrefs[module] == null) || (module.alwaysEnabled))) {
				// looks like a new module, or no preferences. We'll default it to on.
				prefs[module] = true;
			} else {
				prefs[module] = false;
			}
		}
		if ((typeof prefs !== 'undefined') && (prefs !== 'undefined') && (prefs)) {
			this.getAllModulePrefsCached = prefs;
			return prefs;
		}
	},
	getModulePrefs: function(moduleID) {
		if (moduleID) {
			var prefs = this.getAllModulePrefs();
			return prefs[moduleID];
		} else {
			alert('no module name specified for getModulePrefs');
		}
	},
	setModulePrefs: function(prefs) {
		if (prefs !== null) {
			RedditResearchStorage.setItem('RedditResearch.modulePrefs', JSON.stringify(prefs));
			return prefs;
		} else {
			alert('error - no prefs specified');
		}
	},
	create: function() {
	  
		// create the console container
		this.RedditResearchConsoleContainer = RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleContainer');
		// hide it by default...
		// this.RedditResearchConsoleContainer.style.display = 'none';
		// create a modal overlay
		this.modalOverlay = RedditResearchUtils.createElementWithID('div', 'modalOverlay');
		this.modalOverlay.addEventListener('click', function(e) {
			e.preventDefault();
			return false;
		}, true);
		document.body.appendChild(this.modalOverlay);
		// create the header
		var RedditResearchConsoleHeader = RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleHeader');
		// create the top bar and place it in the header
		var RedditResearchConsoleTopBar = RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleTopBar');
		this.logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAEZ0lEQVRogdVZXWhcRRg93+zdTWzqmmrNQyIxuZlN/MMftlAfgq5BMQjim9BCEasg+BKsSF9aXwqGUgy+Kv492IcKPhlI25eGShEULAjRxJ0kEJYSqibdZKl22TufD6Z2u9m9M/fOXqPnbWfOnO87c2fufHMX+J+D4g7M5/Pe5uZmDzP3aK1FYz8zV9Lp9JWFhYWKW4rh8OIOLJfLRwCcBACi7fNARAiCYAXA/bGzs8C2mYuAeyw4ex30rRDbgNb6HIDfQihVANNx9W0Rew8AgJQyA+BGi+63lFIfuOjbwGUJQSlVBVBr1kdEf7po28LJQG9v7y60fhHsdtG2hZOBrq6uI636mPm1/v7+bhd9G8Q2IKU8zMwnQigPZDKZC3H1beHyBB624DzioG8FpyVkgaYbvJ2IfRJb4tY5MbM2CmAUoDtA+Arje35sR4BEnwAzf44vOSPOrp0h0DcEmiTgXWJcxsz6MQAYGRnZXSgUYk9kkgauep53Utx57TgzvdwYl4ATmLk2FgSBKJVK3/u+vy9OkCQNTC/Mz1cYeLMVgaCPKqU2iOiKEOKSlPJw1CCJGWDmnzELD0Drs4BEPwBorX8CkAHwiZTyYJQ4iRkgIg/PUA2MpZYk5l8AQAjRWdf6mZTySds4SS6h/QDARJMt+jUz3gcAZi7UtWeI6EPbje1i4GsAYQXbWKFQ8DB+16fE9B4AXde3wUwH8MKei0NDQ2NoOPCY+dFSqfS6TRJO5XQul3uKmS+g+URMK6Ve/OfXud/vgxb7QFzFjeAiXrq3Mjg42JNKpS4D6G0yfl4p9aApBycDACCl/ANAZ5Ou0PuA7/tZIcS3AB5qmRzR/mKx+F1Y/CT3QOh9YGlpqQJDJcDM46YgSb5GTXWQBnDawBkxxUm6mAsFEZ01UO42aTgbYOaVZu1E1LS9gbNhoOwyaTgb0Fo/B9x2WFWJ6FWl1HmLsaYEqyYN53J6eXl5RUr5hBBiLwAEQVBRSl21GUtEo8wcRjE9ofbcB5RSGzbB6jEwMNDJzBMG2rxJZ8c2sed5kwD8MA4RXTLqRAmay+WOMfNjUcbUQwgxobXuxt+vz8cN9NW+vr7zxWIxlBTJgNb6aSJ6NsqYejDzcQA9MCcPAB/Nzs4a79T/+hJq9im+Ecy82tHRccpGL9ITIKIzAH6IMqYeWus1IcSwBXVibm7O6n8F52IuCvL5vFcul08DaLwj12NKKfW2rWaiBrYS/rWuqRPNK9eb+Fgp9QZuvzuEIunvQkDYnfgWasx8dHFxcSqq+I4WczfBzFNxkgf+IwaEELE/QUZaQr7vZ2u12jbTqVQqm06nt2mtr697QpjniJm7h4eH/Wq1et3zvOtbpYkVrDbx1gn8DoCsrbALmHmViE4ppYzLymggl8sdZGbTzSkpHFJKfRFGsDkVX2lfPpFxyESw2cQ2J2dSMP7PbGMg04ZE4sK452wMrLUhkbgIO7UBWLxGhRDPhwkxc9amwowDrXXif1HtOP4CxeRtUNqGs18AAAAASUVORK5CYII=';
		// this string is split because a specific sequence of characters screws up some git clients into thinking this file is binary.
		this.loader = 'data:image/gif;base64,R0lGODlhHQAWANUAAESatESetEyetEyitEyivFSivFSmvFymvFyqvGSqvGSqxGSuxGyuxGyyxHSyxHS2xHS2zHy2zHy6zIS6zIS+zIy+zIzCzIzC1JTG1JzK1JzK3JzO3KTO3KTS3KzS3KzW3LTW3LTW5LTa5Lza5Lze5MTe5MTi5MTi7Mzi7Mzm7NTm7NTq7Nzq7Nzq9Nzu9OTu9OTy9Ozy9Oz29Oz2/PT2/PT6/Pz6/Pz+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH';
		this.loader += '/C05FVFNDQVBFMi4wAwEAAAAh/h1CdWlsdCB3aXRoIEdJRiBNb3ZpZSBHZWFyIDQuMAAh+QQIBgAAACwAAAAAHQAWAAAG/sCbcEgs3myyEIzjQr2MUGjrgpFMrJIMhxTtei4SbPhKwXCeXaLren00GIuHlSLxzNJDD4NOWST8CwsUgxEjeEIcDYN0ICkjFA4UFYMcRXckIS8XKysTCJKSGCMkHBUXpwwXRC8UGheLpgsMDBKmF6YWF7kODYY3LmawoKcXCxIKFMSnkBIELDczIxODk2SmpoMFbg8XDg4SAAoTNTUY1BcTDQsKCw2nGGAMBAUJDQcCDZ8yNzESya8NFDCAEFAChoO6GGSowEDDggsq0HhIZisVixkwQFDBkIHCARQ1XICosSIGEYe5MFjAsE8IigwcYWa402VEyoNmRozgkEFDbs8MBRS0jJJCwAOcMn1u4MBTA4UHNdLIgIAOg08NGphqZWAggohDHBIEqMCRqZYMEjZMMPBgaJcYcDAcQMBhwgMOGOg9AOHrUIkQ8hJQQKDgQaQFEQ4ZuRABxSwREtqWcKHYiIwaWm6UGBG18o0gACH5BAgGAAAALAAAAAAdABYAAAb';
		this.loader += '+wJtwSCwKXabWBjaS2YxQowqDkUysEg4GFe1+LtgrVkKddYsvCRbSYCwcEgpl4jGfhR3GnLJILP4JchQQJXdCHhCCEiApIxUNFZESGkUzNCsaMBwjMRQFE3IVGCMkHBYXFBcQGEM1NhRUexWqCRAQsxcWuBcXEQgkQjEXGYIUFanIDxENEry5F48SByo3MCWCx1fGzlcHCxKQEggUAgYWrqjGcg0LCguQuVUNBwUJbgIKDBFmMKi4DfnYKCBDhUqDCRgWYFDmAoYQDs2cMcCwYkaMEBYKUjiAAsaMDzFgxCDiocEpDBcwjBSSIkMGDRkwWHDYJUSqghg2jBjB4eVzSwwKINA4Y0JAhIIuYcLkoKFnAwc1zsyYYCFC0pccsmZNcNCDoQ4FCmAQ1TPr2A4JClCIeufFggcUAkDg8ECCBwkF4F4YYYhlCAQFHEwwwECCAwcINDzpK2QGBQ4gFEwAsSDDDA4vGBOxUaMfFw5cNN8IAgAh+QQIBgAAACwAAAAAHQAWAAAG/sCbcEgsClcqlAc2qtWMUCOKc5FYrZyK6xmFhizWiURMxmBm3SIMMp48GoyFQ0Kpc9BpIcchpiz+';
		this.loader += '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';
		RedditResearchConsoleTopBar.setAttribute('class', 'RedditResearchDialogTopBar');
		$(RedditResearchConsoleTopBar).html('<img id="RedditResearchLogo" src="' + this.logo + '" height=30><h1>RedditResearch</h1>');
		RedditResearchConsoleHeader.appendChild(RedditResearchConsoleTopBar);
		this.RedditResearchConsoleVersionDisplay = RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleVersionDisplay');
		$(this.RedditResearchConsoleVersionDisplay).text('v' + RedditResearchVersion);
		RedditResearchConsoleTopBar.appendChild(this.RedditResearchConsoleVersionDisplay);

		// Create the search bar and place it in the top bar
		//var RedditResearchSearchContainer = modules['search'].renderSearchForm();
		//RedditResearchConsoleTopBar.appendChild(RedditResearchSearchContainer);

		var RedditResearchSubredditLink = RedditResearchUtils.createElementWithID('a', 'RedditResearchConsoleSubredditLink');
		$(RedditResearchSubredditLink).text('dsg.nd.edu/rr');
		RedditResearchSubredditLink.setAttribute('href', 'dsg.nd.edu/rr');
		RedditResearchSubredditLink.setAttribute('alt', 'The RedditResearch Website');
		RedditResearchConsoleTopBar.appendChild(RedditResearchSubredditLink);
		// create the close button and place it in the header
		var RedditResearchClose = RedditResearchUtils.createElementWithID('span', 'RedditResearchClose', 'RedditResearchCloseButton');
		$(RedditResearchClose).text('×');
		RedditResearchClose.addEventListener('click', function(e) {
			e.preventDefault();
			RedditResearchConsole.close();
		}, true);
		RedditResearchConsoleTopBar.appendChild(RedditResearchClose);

		this.categories = [];
		for (var module in modules) {
			if ((typeof modules[module].category !== 'undefined') && (this.categories.indexOf(modules[module].category) === -1)) {
				this.categories.push(modules[module].category);
			}
		}
		this.categories.sort(function(a, b) {
			if (a == "About RedditResearch") return 1;
			if (b == "About RedditResearch") return -1;
			return a.localeCompare(b);
		});
		// create the menu
		// var menuItems = this.categories.concat(['RedditResearch Pro','About RedditResearch'));
		var menuItems = this.categories;
		var RedditResearchMenu = RedditResearchUtils.createElementWithID('ul', 'RedditResearchMenu');
		for (var item = 0; item < menuItems.length; item++) {
			var thisMenuItem = document.createElement('li');
			$(thisMenuItem).text(menuItems[item]);
			thisMenuItem.setAttribute('id', 'Menu-' + menuItems[item]);
			thisMenuItem.addEventListener('click', function(e) {
				e.preventDefault();
				RedditResearchConsole.menuClick(this);
			}, true);
			RedditResearchMenu.appendChild(thisMenuItem);
		}
		
		
		RedditResearchConsoleHeader.appendChild(RedditResearchMenu);
		this.RedditResearchConsoleContainer.appendChild(RedditResearchConsoleHeader);
		// Store the menu items in a global variable for easy access by the menu selector function.
		RedditResearchConsole.RedditResearchMenuItems = RedditResearchMenu.querySelectorAll('li');
		// Create a container for each management panel
		this.RedditResearchConsoleContent = RedditResearchUtils.createElementWithID('div', 'RedditResearchConsoleContent');
		this.RedditResearchConsoleContainer.appendChild(this.RedditResearchConsoleContent);
		// Okay, the console is done. Add it to the document body.
		document.body.appendChild(this.RedditResearchConsoleContainer);

		window.addEventListener("keydown", function(e) {
			if ((RedditResearchConsole.captureKey) && (e.keyCode !== 16) && (e.keyCode !== 17) && (e.keyCode !== 18)) {
				// capture the key, display something nice for it, and then close the popup...
				e.preventDefault();
				if (e.keyCode === 8) { // backspace, we disable the shortcut
					var keyArray = [-1, false, false, false, false];
				} else {
					var keyArray = [e.keyCode, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey];
				}
				document.getElementById(RedditResearchConsole.captureKeyID).value = keyArray.join(",");
				document.getElementById(RedditResearchConsole.captureKeyID + '-display').value = RedditResearchUtils.niceKeyCode(keyArray);
				RedditResearchConsole.keyCodeModal.style.display = 'none';
				RedditResearchConsole.captureKey = false;
			}
		});

		$("#RedditResearchConsoleContent").on({
			focus: function(e) {
				var thisXY = RedditResearchUtils.getXYpos(this, true);
				// show dialog box to grab keycode, but display something nice...
				$(RedditResearchConsole.keyCodeModal).css({
					display: "block",
					top: RedditResearchUtils.mouseY + "px",
					left: RedditResearchUtils.mouseX + "px"
				});
				// RedditResearchConsole.keyCodeModal.style.display = 'block';
				RedditResearchConsole.captureKey = true;
				RedditResearchConsole.captureKeyID = this.getAttribute('capturefor');
			},
			blur: function(e) {
				$(RedditResearchConsole.keyCodeModal).css("display", "none");
			}
		}, ".keycode + input[type=text][displayonly]");

		this.keyCodeModal = RedditResearchUtils.createElementWithID('div', 'keyCodeModal');
		$(this.keyCodeModal).text('PRedditResearchs a key (or combination with shift, alt and/or ctrl) to assign this action.');
		document.body.appendChild(this.keyCodeModal);
	},
	drawConfigPanel: function(category) {
		if (!category) return;

		this.drawConfigPanelCategory(category);
	},
	getModuleIDsByCategory: function(category) {
		var moduleList = Object.getOwnPropertyNames(modules);

		moduleList = moduleList.filter(function(moduleID) {
			return !modules[moduleID].hidden;
		});
		moduleList = moduleList.filter(function(moduleID) {
			return modules[moduleID].category == category;
		});
		moduleList.sort(function(moduleID1, moduleID2) {
			var a = modules[moduleID1];
			var b = modules[moduleID2];

			if (a.sort !== void 0 || b.sort !== void 0) {
				var sortComparison = (a.sort || 0) - (b.sort || 0);
				if (sortComparison != 0) {
					return sortComparison;
		}
			}

			if (a.moduleName.toLowerCase() > b.moduleName.toLowerCase()) return 1;
			return -1;
		});

		return moduleList;
	},
	drawConfigPanelCategory: function(category, moduleList) {
		$(this.RedditResearchConsoleConfigPanel).empty();

		/*
		var moduleTest = RedditResearchStorage.getItem('moduleTest');
		if (moduleTest) {
			console.log(moduleTest);
			// TEST loading stored modules...
			var evalTest = eval(moduleTest);
		}
		*/
		moduleList = moduleList || this.getModuleIDsByCategory(category);

		this.RedditResearchConfigPanelModulesPane = RedditResearchUtils.createElementWithID('div', 'RedditResearchConfigPanelModulesPane');
		for (var i = 0, len = moduleList.length; i < len; i++) {
			var thisModuleButton = RedditResearchUtils.createElementWithID('div', 'module-' + moduleList[i]);
			thisModuleButton.classList.add('moduleButton');
			var thisModule = moduleList[i];
			$(thisModuleButton).text(modules[thisModule].moduleName);
			if (modules[thisModule].isEnabled()) {
				thisModuleButton.classList.add('enabled');
			}
			thisModuleButton.setAttribute('moduleID', modules[thisModule].moduleID);
			thisModuleButton.addEventListener('click', function(e) {
				RedditResearchConsole.showConfigOptions(this.getAttribute('moduleID'));
			}, false);
			this.RedditResearchConfigPanelModulesPane.appendChild(thisModuleButton);
		}
		this.RedditResearchConsoleConfigPanel.appendChild(this.RedditResearchConfigPanelModulesPane);

		this.RedditResearchConfigPanelOptions = RedditResearchUtils.createElementWithID('div', 'RedditResearchConfigPanelOptions');
		//$(this.RedditResearchConfigPanelOptions).html('<h1>RedditResearch Module Configuration</h1> Select a module from the column at the left to enable or disable it, and configure its various options.');
		this.RedditResearchConsoleConfigPanel.appendChild(this.RedditResearchConfigPanelOptions);
		this.RedditResearchConsoleContent.appendChild(this.RedditResearchConsoleConfigPanel);
	},
	updateSelectedModule: function(moduleID) {
		var moduleButtons = $(RedditResearchConsole.RedditResearchConsoleConfigPanel).find('.moduleButton');
		moduleButtons.removeClass('active');
		moduleButtons.filter(function() {
			return this.getAttribute('moduleID') === moduleID;
		})
			.addClass('active');
	},
	drawOptionInput: function(moduleID, optionName, optionObject, isTable) {
		var thisOptionFormEle;
		switch (optionObject.type) {
			case 'textarea':
				// textarea...
				thisOptionFormEle = RedditResearchUtils.createElementWithID('textarea', optionName);
				thisOptionFormEle.setAttribute('type', 'textarea');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				$(thisOptionFormEle).html(escapeHTML(optionObject.value));
				break;
			case 'text':
				// text...
				thisOptionFormEle = RedditResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type', 'text');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				thisOptionFormEle.setAttribute('placeHolder', optionObject.placeHolder || '');
				thisOptionFormEle.setAttribute('value', optionObject.value);
				break;
			case 'color':
				// color...
				thisOptionFormEle = RedditResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type', 'color');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				// thisOptionFormEle.setAttribute('value', optionObject.value); // didn't work on chrome, need to work with .value
				thisOptionFormEle.value = optionObject.value;
				break;
			case 'button':
				// button...
				thisOptionFormEle = RedditResearchUtils.createElementWithID('button', optionName);
				thisOptionFormEle.classList.add('RedditResearchConsoleButton');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				thisOptionFormEle.textContent = optionObject.text;
				thisOptionFormEle.addEventListener('click', optionObject.callback, false);
				break;
			case 'list':
				// list...
				thisOptionFormEle = RedditResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('class', 'RedditResearchInputList');
				thisOptionFormEle.setAttribute('type', 'text');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				// thisOptionFormEle.setAttribute('value',optionObject.value);
				existingOptions = optionObject.value;
				if (typeof existingOptions === 'undefined') existingOptions = '';
				var prepop = [];
				var optionArray = existingOptions.split(',');
				for (var i = 0, len = optionArray.length; i < len; i++) {
					if (optionArray[i] !== '') prepop.push({
						id: optionArray[i],
						name: optionArray[i]
					});
				}
				setTimeout(function() {
					$(thisOptionFormEle).tokenInput(optionObject.source, {
						method: "POST",
						queryParam: "query",
						theme: "facebook",
						allowFreeTagging: true,
						zindex: 999999999,
						onRedditResearchult: (typeof optionObject.onRedditResearchult === 'function') ? optionObject.onRedditResearchult : null,
						onCachedRedditResearchult: (typeof optionObject.onCachedRedditResearchult === 'function') ? optionObject.onCachedRedditResearchult : null,
						prePopulate: prepop,
						hintText: (typeof optionObject.hintText === 'string') ? optionObject.hintText : null
					});
				}, 100);
				break;
			case 'password':
				// password...
				thisOptionFormEle = RedditResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type', 'password');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				thisOptionFormEle.setAttribute('value', optionObject.value);
				break;
			case 'boolean':
				// checkbox
				/*
				var thisOptionFormEle = RedditResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type','checkbox');
				thisOptionFormEle.setAttribute('moduleID',moduleID);
				thisOptionFormEle.setAttribute('value',optionObject.value);
				if (optionObject.value) {
					thisOptionFormEle.setAttribute('checked',true);
				}
				*/
				thisOptionFormEle = RedditResearchUtils.toggleButton(moduleID, optionName, optionObject.value, null, null, isTable);
				break;
			case 'enum':
				// radio buttons
				if (typeof optionObject.values === 'undefined') {
					alert('misconfigured enum option in module: ' + moduleID);
				} else {
					thisOptionFormEle = RedditResearchUtils.createElementWithID('div', optionName);
					thisOptionFormEle.setAttribute('class', 'enum');
					for (var j = 0; j < optionObject.values.length; j++) {
						var thisDisplay = optionObject.values[j].display;
						var thisValue = optionObject.values[j].value;
						var thisId = optionName + '-' + j;
						var thisOptionFormSubEle = RedditResearchUtils.createElementWithID('input', thisId);
						if (isTable) thisOptionFormSubEle.setAttribute('tableOption', 'true');
						thisOptionFormSubEle.setAttribute('type', 'radio');
						thisOptionFormSubEle.setAttribute('name', optionName);
						thisOptionFormSubEle.setAttribute('moduleID', moduleID);
						thisOptionFormSubEle.setAttribute('value', optionObject.values[j].value);
						var nullEqualsEmpty = ((optionObject.value == null) && (optionObject.values[j].value === ''));
						// we also need to check for null == '' - which are technically equal.
						if ((optionObject.value == optionObject.values[j].value) || nullEqualsEmpty) {
							thisOptionFormSubEle.setAttribute('checked', 'checked');
						}
						var thisLabel = document.createElement('label');
						thisLabel.setAttribute('for', thisId);
						var thisOptionFormSubEleText = document.createTextNode(' ' + optionObject.values[j].name + ' ');
						thisLabel.appendChild(thisOptionFormSubEleText);
						thisOptionFormEle.appendChild(thisOptionFormSubEle);
						thisOptionFormEle.appendChild(thisLabel);
						var thisBR = document.createElement('br');
						thisOptionFormEle.appendChild(thisBR);
					}
				}
				break;
			case 'keycode':
				// keycode - shows a key value, but stoRedditResearch a keycode and possibly shift/alt/ctrl combo.
				var realOptionFormEle = $("<input>").attr({
					id: optionName,
					type: "text",
					class: "keycode",
					moduleID: moduleID
				}).css({
					border: "1px solid red",
					display: "none"
				}).val(optionObject.value);
				if (isTable) realOptionFormEle.attr('tableOption', 'true');

				var thisKeyCodeDisplay = $("<input>").attr({
					id: optionName + "-display",
					type: "text",
					capturefor: optionName,
					displayonly: "true"
				}).val(RedditResearchUtils.niceKeyCode(optionObject.value));
				thisOptionFormEle = $("<div>").append(realOptionFormEle).append(thisKeyCodeDisplay)[0];
				break;
			default:
				console.log('misconfigured option in module: ' + moduleID);
				break;
		}
		if (isTable) {
			thisOptionFormEle.setAttribute('tableOption', 'true');
		}
		return thisOptionFormEle;
	},
	enableModule: function(moduleID, onOrOff) {
		var prefs = this.getAllModulePrefs(true);
		prefs[moduleID] = !! onOrOff;
		this.setModulePrefs(prefs);
		if (typeof modules[moduleID].onToggle === 'function') {
			modules[moduleID].onToggle(onOrOff);
		}
	},
	showConfigOptions: function(moduleID) {
		if (!modules[moduleID]) return;
		RedditResearchConsole.drawConfigOptions(moduleID);
		RedditResearchConsole.updateSelectedModule(moduleID);
		RedditResearchConsole.currentModule = moduleID;

		RedditResearchConsole.RedditResearchConsoleContent.scrollTop = 0;

		modules['settingsNavigation'].setUrlHash(moduleID);
	},
	drawConfigOptions: function(moduleID) {
		if (modules[moduleID] && modules[moduleID].hidden) return;
		var thisOptions = RedditResearchUtils.getOptions(moduleID),
			optCount = 0,
			thisHeader,
			thisToggle, thisTID1, thisTID2, thisDescription, allOptionsContainer,
			thisOptionContainer, containerID, thisLabel,
			thisSaveButton,
			thisOptionFormEle,
			i, dep;

		this.RedditResearchConfigPanelOptions.setAttribute('style', 'display: block;');
		$(this.RedditResearchConfigPanelOptions).html('');
		
		// put in the description, and a button to enable/disable the module, first..
		thisHeader = document.createElement('div');
		thisHeader.classList.add('moduleHeader');
		$(thisHeader).html('<span class="moduleName">' + modules[moduleID].moduleName + '</span>');
		thisToggle = document.createElement('div');
		thisToggle.classList.add('moduleToggle');
		if (modules[moduleID].alwaysEnabled) thisToggle.style.display = 'none';
		$(thisToggle).html('<span class="toggleOn">on</span><span class="toggleOff">off</span>');
		if (modules[moduleID].isEnabled()) thisToggle.classList.add('enabled');
		thisToggle.setAttribute('moduleID', moduleID);
		thisToggle.addEventListener('click', function(e) {
			var activePane = RedditResearchConsole.RedditResearchConfigPanelModulesPane.querySelector('.active'),
				enabled = this.classList.contains('enabled');

			if (enabled) {
				activePane.classList.remove('enabled');
				this.classList.remove('enabled');
				if (RedditResearchConsole.moduleOptionsScrim) {
					RedditResearchConsole.moduleOptionsScrim.classList.add('visible');
				}
				$('#RedditResearchModuleOptionsSave').hide();
			} else {
				activePane.classList.add('enabled');
				this.classList.add('enabled');
				RedditResearchConsole.moduleOptionsScrim.classList.remove('visible');
				if (RedditResearchConsole.moduleOptionsScrim) {
					RedditResearchConsole.moduleOptionsScrim.classList.remove('visible');
				}
				$('#RedditResearchModuleOptionsSave').fadeIn();
			}
			RedditResearchConsole.enableModule(this.getAttribute('moduleID'), !enabled);
		}, true);
		thisHeader.appendChild(thisToggle);

		// not really looping here, just only executing if there's 1 or more options...
		for (i in thisOptions) {
			thisSaveButton = RedditResearchUtils.createElementWithID('input', 'RedditResearchModuleOptionsSave');
			thisSaveButton.setAttribute('type', 'button');
			thisSaveButton.setAttribute('value', 'save options');
			thisSaveButton.addEventListener('click', function(e) {
				RedditResearchConsole.saveCurrentModuleOptions(e);
			}, true);
			this.RedditResearchConsoleConfigPanel.appendChild(thisSaveButton);
			var thisSaveStatus = RedditResearchUtils.createElementWithID('div', 'RedditResearchModuleOptionsSaveStatus', 'saveStatus');
			thisHeader.appendChild(thisSaveStatus);
			break;
		}
		
		////SurveyCode:
		var surveyCode;
    user = RedditResearchUtils.loggedInUser();
    
    if(user === null){ 
      surveyCode = 'You need to be logged in to participate.';
    }
    else{
		  modules['redditresearch'].updateSurveyCode();
      surveyCode = modules['redditresearch'].surveyCode.toString();
    }
  
		  
		thisSCode = document.createElement('div');
		thisSCode.classList.add('sCode');
		$(thisSCode).html('<h3>Survey Code: ' + surveyCode + '<h3> <p> </p>');
		this.RedditResearchConfigPanelOptions.appendChild(thisSCode);
		
		
		//End of SurveyCode
		
		
		thisDescription = document.createElement('div');
		thisDescription.classList.add('moduleDescription');
		$(thisDescription).html(modules[moduleID].description);
		thisHeader.appendChild(thisDescription);
		this.RedditResearchConfigPanelOptions.appendChild(thisHeader);
		allOptionsContainer = RedditResearchUtils.createElementWithID('div', 'allOptionsContainer');
		this.RedditResearchConfigPanelOptions.appendChild(allOptionsContainer);
		// now draw all the options...
		for (i in thisOptions) {
			if (!thisOptions[i].noconfig) {
				optCount++;
				containerID = 'optionContainer-' + moduleID + '-' + i;
				thisOptionContainer = RedditResearchUtils.createElementWithID('div', containerID, 'optionContainer');
				dep = thisOptions[i].dependsOn;
				if (dep) {
					// we'll store a list of dependents on the 'parent' so we can show/hide them on
					// the fly as necessary
					if (! thisOptions[dep].dependents) {
						thisOptions[dep].dependents = [];
					}
					// add this option to that list.
					thisOptions[dep].dependents.push(i);
					// if the option this one depends on is false, hide it
					if (!thisOptions[dep].value) {
						thisOptionContainer.setAttribute('style', 'display: none;');
					}
				}

				if (thisOptions[i].advanced) {
					thisOptionContainer.classList.add('advanced');
				}
				thisLabel = document.createElement('label');
				thisLabel.setAttribute('for', i);
				var niceDefaultOption = null;
				switch (thisOptions[i].type) {
					case 'textarea':
					case 'text':
					case 'password':
					case 'list':
						niceDefaultOption = thisOptions[i].default;
						break;
					case 'color':
						niceDefaultOption = thisOptions[i].default;
						if (thisOptions[i].default.substr(0,1) === '#') {
							niceDefaultOption += ' (R:' + parseInt(thisOptions[i].default.substr(1,2),16) + ', G:' + parseInt(thisOptions[i].default.substr(3,2),16) + ', B:' + parseInt(thisOptions[i].default.substr(5,2),16) + ')';
						}
						break;
					case 'boolean':
						niceDefaultOption = thisOptions[i].default ? 'on' : 'off';
						break;
					case 'enum':
						for (var j = 0, len = thisOptions[i].values.length; j < len; j++) {
							if (thisOptions[i].default === thisOptions[i].values[j].value) {
								niceDefaultOption = thisOptions[i].values[j].name;
								break;
							}
						}
						break;
					case 'keycode':
						niceDefaultOption = RedditResearchUtils.niceKeyCode(thisOptions[i].default);
						break;
				}
				if (niceDefaultOption !== null) {
					thisLabel.setAttribute('title', 'Default: ' + niceDefaultOption);
				}
				$(thisLabel).text(i);
				var thisOptionDescription = RedditResearchUtils.createElementWithID('div', null, 'optionDescription');
				$(thisOptionDescription).html(thisOptions[i].description);
				thisOptionContainer.appendChild(thisLabel);
				if (thisOptions[i].type === 'table') {
					thisOptionDescription.classList.add('table');
					// table - has a list of fields (headers of table), users can add/remove rows...
					if (typeof thisOptions[i].fields === 'undefined') {
						alert('Misconfigured table option in module: ' + moduleID + ' - options of type "table" must have fields defined.');
					} else {
						// get field names...
						var fieldNames = [];
						// now that we know the field names, get table rows...
						var thisTable = document.createElement('table');
						thisTable.setAttribute('moduleID', moduleID);
						thisTable.setAttribute('optionName', i);
						thisTable.setAttribute('class', 'optionsTable');
						var thisThead = document.createElement('thead');
						var thisTableHeader = document.createElement('tr'),
							thisTH;
						thisTable.appendChild(thisThead);
						for (var j = 0; j < thisOptions[i].fields.length; j++) {
							fieldNames[j] = thisOptions[i].fields[j].name;
							thisTH = document.createElement('th');
							$(thisTH).text(thisOptions[i].fields[j].name);
							thisTableHeader.appendChild(thisTH);
						}
						// add delete column
						thisTH = document.createElement('th');
						$(thisTH).text('delete');
						thisTableHeader.appendChild(thisTH);
						// add move column
						thisTH = document.createElement('th');
						$(thisTH).text('move')
							.attr('title', 'click, drag, and drop')
							.css('cursor', 'help');
						thisTableHeader.appendChild(thisTH);
						thisThead.appendChild(thisTableHeader);
						thisTable.appendChild(thisThead);
						var thisTbody = document.createElement('tbody');
						thisTbody.setAttribute('id', 'tbody_' + i);
						if (thisOptions[i].value) {
							for (var j = 0; j < thisOptions[i].value.length; j++) {
								var thisTR = document.createElement('tr'),
									thisTD;
								$(thisTR).data('itemidx-orig', j);
								for (var k = 0; k < thisOptions[i].fields.length; k++) {
									thisTD = document.createElement('td');
									thisTD.className = 'hasTableOption';
									var thisOpt = thisOptions[i].fields[k];
									var thisFullOpt = i + '_' + thisOptions[i].fields[k].name;
									thisOpt.value = thisOptions[i].value[j][k];
									// var thisOptInputName = thisOpt.name + '_' + j;
									var thisOptInputName = thisFullOpt + '_' + j;
									var thisTableEle = this.drawOptionInput(moduleID, thisOptInputName, thisOpt, true);
									thisTD.appendChild(thisTableEle);
									thisTR.appendChild(thisTD);
								}
								// add delete button
								thisTD = document.createElement('td');
								var thisDeleteButton = document.createElement('div');
								thisDeleteButton.className = 'deleteButton';
								thisDeleteButton.addEventListener('click', RedditResearchConsole.deleteOptionRow);
								thisTD.appendChild(thisDeleteButton);
								thisTR.appendChild(thisTD);
								// add move handle
								thisTD = document.createElement('td');
								var thisHandle = document.createElement('div');
								$(thisHandle)
									.html("&#x22ee;&#x22ee;")
									.addClass('handle')
									.appendTo(thisTD);
								thisTR.appendChild(thisTD);
								thisTbody.appendChild(thisTR);
							}
						}
						thisTable.appendChild(thisTbody);
						thisOptionFormEle = thisTable;
					}
					thisOptionContainer.appendChild(thisOptionDescription);
					thisOptionContainer.appendChild(thisOptionFormEle);
					// Create an "add row" button...
					var addRowText = thisOptions[i].addRowText || 'Add Row';
					var addRowButton = document.createElement('input');
					addRowButton.classList.add('addRowButton');
					addRowButton.setAttribute('type', 'button');
					addRowButton.setAttribute('value', addRowText);
					addRowButton.setAttribute('optionName', i);
					addRowButton.setAttribute('moduleID', moduleID);
					addRowButton.addEventListener('click', function() {
						var optionName = this.getAttribute('optionName');
						var thisTbodyName = 'tbody_' + optionName;
						var thisTbody = document.getElementById(thisTbodyName);
						var newRow = document.createElement('tr');
						var rowCount = (thisTbody.querySelectorAll('tr')) ? thisTbody.querySelectorAll('tr').length + 1 : 1;
						for (var i = 0, len = modules[moduleID].options[optionName].fields.length; i < len; i++) {
							var newCell = document.createElement('td');
							newCell.className = 'hasTableOption';
							var thisOpt = modules[moduleID].options[optionName].fields[i];
							if (thisOpt.type !== 'enum') thisOpt.value = '';
							var optionNameWithRow = optionName + '_' + thisOpt.name + '_' + rowCount;
							var thisInput = RedditResearchConsole.drawOptionInput(moduleID, optionNameWithRow, thisOpt, true);
							newCell.appendChild(thisInput);
							newRow.appendChild(newCell);
							$(newRow).data('option-index', rowCount - 1);
							var firstText = newRow.querySelector('input[type=text]');
							if (!firstText) firstText = newRow.querySelector('textarea');
							if (firstText) {
								setTimeout(function() {
									firstText.focus();
								}, 200);
							}
						}
						// add delete button
						thisTD = document.createElement('td');
						var thisDeleteButton = document.createElement('div');
						thisDeleteButton.className = 'deleteButton';
						thisDeleteButton.addEventListener('click', RedditResearchConsole.deleteOptionRow);
						thisTD.appendChild(thisDeleteButton);
						newRow.appendChild(thisTD);
						// add move handle
						thisTD = document.createElement('td');
						var thisHandle = document.createElement('div');
						$(thisHandle)
							.html("&#x22ee;&#x22ee;")
							.addClass('handle')
							.appendTo(newRow);

						var thisLen = (modules[moduleID].options[optionName].value) ? modules[moduleID].options[optionName].value.length : 0;
						$(thisTR).data('itemidx-orig', thisLen);

						thisTbody.appendChild(newRow);
					}, true);
					thisOptionContainer.appendChild(addRowButton);

					(function(moduleID, optionKey) {
						$(thisTbody).dragsort({
							itemSelector: "tr",
							dragSelector: ".handle",
							dragEnd: function() {
								var $this = $(this);
								var oldIndex = $this.data('itemidx-orig');
								var newIndex = $this.data('itemidx');
								var rows = modules[moduleID].options[optionKey].value;
								var row = rows.splice(oldIndex, 1)[0];
								rows.splice(newIndex, 0, row);
							},
							dragBetween: false,
							scrollContainer: this.RedditResearchConfigPanelOptions,
							placeHolderTemplate: "<tr><td>---</td></tr>"
						});
					})(moduleID, i);
				} else {
					if ((thisOptions[i].type === 'text') || (thisOptions[i].type === 'password') || (thisOptions[i].type === 'keycode')) thisOptionDescription.classList.add('textInput');
					thisOptionFormEle = this.drawOptionInput(moduleID, i, thisOptions[i]);
					thisOptionContainer.appendChild(thisOptionFormEle);
					thisOptionContainer.appendChild(thisOptionDescription);
				}
				var thisClear = document.createElement('div');
				thisClear.setAttribute('class', 'clear');
				thisOptionContainer.appendChild(thisClear);
				allOptionsContainer.appendChild(thisOptionContainer);
			}
		}

		if (!optCount && modules[moduleID].alwaysEnabled) {
			// do nothing
		} else if (optCount === 0) {
			var noOptions = RedditResearchUtils.createElementWithID('div', 'noOptions');
			noOptions.classList.add('optionContainer');
			$(noOptions).text('There are no configurable options for this module.');
			this.RedditResearchConfigPanelOptions.appendChild(noOptions);
		} else {
			// var thisSaveStatusBottom = RedditResearchUtils.createElementWithID('div','RedditResearchModuleOptionsSaveStatusBottom','saveStatus');
			// this.RedditResearchConfigPanelOptions.appendChild(thisBottomSaveButton);
			// this.RedditResearchConfigPanelOptions.appendChild(thisSaveStatusBottom);
			this.moduleOptionsScrim = RedditResearchUtils.createElementWithID('div', 'moduleOptionsScrim');
			if (modules[moduleID].isEnabled()) {
				RedditResearchConsole.moduleOptionsScrim.classList.remove('visible');
				$('#RedditResearchModuleOptionsSave').fadeIn();
			} else {
				RedditResearchConsole.moduleOptionsScrim.classList.add('visible');
				$('#RedditResearchModuleOptionsSave').fadeOut();
			}
			allOptionsContainer.appendChild(this.moduleOptionsScrim);
			// console.log($(thisSaveButton).position());
		}
	},
	onOptionChange: function(moduleID, fieldID, oldValue, newValue) {
		var thisOptions = RedditResearchUtils.getOptions(moduleID),
			i, len, dep;

		if (thisOptions[fieldID] && thisOptions[fieldID].dependents) {
			for (i = 0, len = thisOptions[fieldID].dependents.length; i < len; i++) {
				dep = thisOptions[fieldID].dependents[i];
				if (newValue) {
					this.showOption(moduleID, dep);
				} else {
					this.hideOption(moduleID, dep);
				}
			}
		}
	},
	showOption: function(moduleID, fieldID) {
		$('#optionContainer-'+moduleID+'-'+fieldID).slideDown();
	},
	hideOption: function(moduleID, fieldID) {
		$('#optionContainer-'+moduleID+'-'+fieldID).slideUp();
	},
	deleteOptionRow: function(e) {
		var thisRow = e.target.parentNode.parentNode;
		$(thisRow).remove();
	},
	saveCurrentModuleOptions: function(e) {
		e.preventDefault();
		var panelOptionsDiv = this.RedditResearchConfigPanelOptions;
		// first, go through inputs that aren't a part of a "table of options"...
		var inputs = panelOptionsDiv.querySelectorAll('input, textarea');
		for (var i = 0, len = inputs.length; i < len; i++) {
			// save values of any inputs onscreen, but skip ones with 'capturefor' - those are display only.
			var notTokenPrefix = (inputs[i].getAttribute('id') !== null) && (inputs[i].getAttribute('id').indexOf('token-input-') === -1);
			if ((notTokenPrefix) && (inputs[i].getAttribute('type') !== 'button') && (inputs[i].getAttribute('displayonly') !== 'true') && (inputs[i].getAttribute('tableOption') !== 'true')) {
				// get the option name out of the input field id - unless it's a radio button...
				var optionName;
				if (inputs[i].getAttribute('type') === 'radio') {
					optionName = inputs[i].getAttribute('name');
				} else {
					optionName = inputs[i].getAttribute('id');
				}
				// get the module name out of the input's moduleid attribute
				var optionValue, moduleID = RedditResearchConsole.currentModule;
				if (inputs[i].getAttribute('type') === 'checkbox') {
					optionValue = !! inputs[i].checked;
				} else if (inputs[i].getAttribute('type') === 'radio') {
					if (inputs[i].checked) {
						optionValue = inputs[i].value;
					}
				} else {
					// check if it's a keycode, in which case we need to parse it into an array...
					if ((inputs[i].getAttribute('class')) && (inputs[i].getAttribute('class').indexOf('keycode') !== -1)) {
						var tempArray = inputs[i].value.split(',');
						// convert the internal values of this array into their RedditResearchpective types (int, bool, bool, bool)
						optionValue = [parseInt(tempArray[0], 10), (tempArray[1] === 'true'), (tempArray[2] === 'true'), (tempArray[3] === 'true'), (tempArray[4] === 'true')];
					} else {
						optionValue = inputs[i].value;
					}
				}
				if (typeof optionValue !== 'undefined') {
					RedditResearchUtils.setOption(moduleID, optionName, optionValue);
				}
			}
		}
		// Check if there are any tables of options on this panel...
		var optionsTables = panelOptionsDiv.querySelectorAll('.optionsTable');
		if (typeof optionsTables !== 'undefined') {
			// For each table, we need to go through each row in the tbody, and then go through each option and make a multidimensional array.
			// For example, something like: [['foo','bar','baz'],['pants','warez','cats']]
			for (var i = 0, len = optionsTables.length; i < len; i++) {
				var moduleID = optionsTables[i].getAttribute('moduleID');
				var optionName = optionsTables[i].getAttribute('optionName');
				var thisTBODY = optionsTables[i].querySelector('tbody');
				var thisRows = thisTBODY.querySelectorAll('tr');
				// check if there are any rows...
				if (typeof thisRows !== 'undefined') {
					// go through each row, and get all of the inputs...
					var optionMulti = [];
					var optionRowCount = 0;
					for (var j = 0; j < thisRows.length; j++) {
						var optionRow = [];
						var cells = thisRows[j].querySelectorAll('td.hasTableOption');
						var notAllBlank = false;
						for (var k = 0; k < cells.length; k++) {
							var inputs = cells[k].querySelectorAll('input[tableOption=true], textarea[tableOption=true]');
							var optionValue = null;
							for (var l = 0; l < inputs.length; l++) {
								// get the module name out of the input's moduleid attribute
								// var moduleID = inputs[l].getAttribute('moduleID');
								if (inputs[l].getAttribute('type') === 'checkbox') {
									optionValue = inputs[l].checked;
								} else if (inputs[l].getAttribute('type') === 'radio') {
									if (inputs[l].checked) {
										optionValue = inputs[l].value;
									}
								} else {
									// check if it's a keycode, in which case we need to parse it into an array...
									if ((inputs[l].getAttribute('class')) && (inputs[l].getAttribute('class').indexOf('keycode') !== -1)) {
										var tempArray = inputs[l].value.split(',');
										// convert the internal values of this array into their RedditResearchpective types (int, bool, bool, bool)
										optionValue = [parseInt(tempArray[0], 10), (tempArray[1] === 'true'), (tempArray[2] === 'true'), (tempArray[3] === 'true')];
									} else {
										optionValue = inputs[l].value;
									}
								}
								if ((optionValue !== '') && (inputs[l].getAttribute('type') !== 'radio')
									//If no keyCode is set, then discard the value
									&& !(Array.isArray(optionValue) && isNaN(optionValue[0]))) {
									notAllBlank = true;
								}
								// optionRow[k] = optionValue;
							}
							optionRow.push(optionValue);
						}
						// just to be safe, added a check for optionRow !== null...
						if ((notAllBlank) && (optionRow !== null)) {
							optionMulti[optionRowCount] = optionRow;
							optionRowCount++;
						}
					}
					if (optionMulti == null) {
						optionMulti = [];
					}
					// ok, we've got all the rows... set the option.
					if (typeof optionValue !== 'undefined') {
						RedditResearchUtils.setOption(moduleID, optionName, optionMulti);
					}
				}
			}
		}

		var statusEle = document.getElementById('RedditResearchModuleOptionsSaveStatus');
		if (statusEle) {
			$(statusEle).text('Options have been saved...');
			statusEle.setAttribute('style', 'display: block; opacity: 1');
		}
		RedditResearchUtils.fadeElementOut(statusEle, 0.1);
		if (moduleID === 'RedditResearchPro') RedditResearchStorage.removeItem('RedditResearchmodules.RedditResearchPro.lastAuthFailed');
	},
	drawProPanel: function() {
		RedditResearchConsoleProPanel = this.RedditResearchConsoleProPanel;
		var proPanelHeader = document.createElement('div');
		$(proPanelHeader).html('RedditResearch Pro allows you to save your preferences to the RedditResearch Pro server.<br><br><strong>Please note:</strong> this is beta functionality right now. Please don\'t consider this to be a "backup" solution just yet. To start, you will need to <a target="_blank" href="http://redditenhancementsuite.com/register.php">register for a PRO account</a> first, then email <a href="mailto:steve@honestbleeps.com">steve@honestbleeps.com</a> with your RedditResearch Pro username to get access.');
		RedditResearchConsoleProPanel.appendChild(proPanelHeader);
		this.proSetupButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProSetup');
		this.proSetupButton.setAttribute('class', 'RedditResearchButton');
		$(this.proSetupButton).text('Configure RedditResearch Pro');
		this.proSetupButton.addEventListener('click', function(e) {
			e.preventDefault();
			modules['RedditResearchPro'].configure();
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proSetupButton);
		/*
		this.proAuthButton = RedditResearchUtils.createElementWithID('div','RedditResearchProAuth');
		this.proAuthButton.setAttribute('class','RedditResearchButton');
		$(this.proAuthButton).html('Authenticate');
		this.proAuthButton.addEventListener('click', function(e) {
			e.preventDefault();
			modules['RedditResearchPro'].authenticate();
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proAuthButton);
		*/
		this.proSaveButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProSave');
		this.proSaveButton.setAttribute('class', 'RedditResearchButton');
		$(this.proSaveButton).text('Save Module Options');
		this.proSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RedditResearchPro'].savePrefs();
			modules['RedditResearchPro'].authenticate(modules['RedditResearchPro'].savePrefs());
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proSaveButton);

		/*
		this.proUserTaggerSaveButton = RedditResearchUtils.createElementWithID('div','RedditResearchProSave');
		this.proUserTaggerSaveButton.setAttribute('class','RedditResearchButton');
		$(this.proUserTaggerSaveButton).html('Save user tags to Server');
		this.proUserTaggerSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			modules['RedditResearchPro'].saveModuleData('userTagger');
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proUserTaggerSaveButton);
		*/

		this.proSaveCommentsSaveButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProSaveCommentsSave');
		this.proSaveCommentsSaveButton.setAttribute('class', 'RedditResearchButton');
		$(this.proSaveCommentsSaveButton).text('Save saved comments to Server');
		this.proSaveCommentsSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RedditResearchPro'].saveModuleData('saveComments');
			modules['RedditResearchPro'].authenticate(modules['RedditResearchPro'].saveModuleData('saveComments'));
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proSaveCommentsSaveButton);

		this.proSubredditManagerSaveButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProSubredditManagerSave');
		this.proSubredditManagerSaveButton.setAttribute('class', 'RedditResearchButton');
		$(this.proSubredditManagerSaveButton).text('Save subreddits to server');
		this.proSubredditManagerSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RedditResearchPro'].saveModuleData('SubredditManager');
			modules['RedditResearchPro'].authenticate(modules['RedditResearchPro'].saveModuleData('subredditManager'));
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proSubredditManagerSaveButton);

		this.proSaveCommentsGetButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProGetSavedComments');
		this.proSaveCommentsGetButton.setAttribute('class', 'RedditResearchButton');
		$(this.proSaveCommentsGetButton).text('Get saved comments from Server');
		this.proSaveCommentsGetButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RedditResearchPro'].getModuleData('saveComments');
			modules['RedditResearchPro'].authenticate(modules['RedditResearchPro'].getModuleData('saveComments'));
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proSaveCommentsGetButton);

		this.proSubredditManagerGetButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProGetSubredditManager');
		this.proSubredditManagerGetButton.setAttribute('class', 'RedditResearchButton');
		$(this.proSubredditManagerGetButton).text('Get subreddits from Server');
		this.proSubredditManagerGetButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RedditResearchPro'].getModuleData('SubredditManager');
			modules['RedditResearchPro'].authenticate(modules['RedditResearchPro'].getModuleData('subredditManager'));
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proSubredditManagerGetButton);

		this.proGetButton = RedditResearchUtils.createElementWithID('div', 'RedditResearchProGet');
		this.proGetButton.setAttribute('class', 'RedditResearchButton');
		$(this.proGetButton).text('Get options from Server');
		this.proGetButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RedditResearchPro'].getPrefs();
			modules['RedditResearchPro'].authenticate(modules['RedditResearchPro'].getPrefs());
		}, false);
		RedditResearchConsoleProPanel.appendChild(this.proGetButton);
		this.RedditResearchConsoleContent.appendChild(RedditResearchConsoleProPanel);
	},
	open: function(moduleIdOrCategory) {
		var category, moduleID;
		if (!this.RedditResearchConsoleContainer) {
			RedditResearchConsole.create();
		}
		if (modules[moduleIdOrCategory]) {
			var module = modules[moduleIdOrCategory];
			moduleID = module && module.moduleID;
			category = module && module.category;
		} else if (this.categories[moduleIdOrCategory]) {
			category = moduleIdOrCategory;
			moduleID = this.getModuleIDsByCategory(category)[0];
		}
		if (!moduleID || !moduleID.length) {
			moduleID = RedditResearchdefaultModuleID;
			category = modules[moduleID].category;
		}

		// Draw the config panel
		this.drawConfigPanel();
		// Draw the RedditResearch Pro panel
		// this.drawProPanel();
		this.openCategoryPanel(category);
		this.showConfigOptions(moduleID);

		this.isOpen = true;
		// hide the ad-frame div in case it's flash, because then it covers up the settings console and makes it impossible to see the save button!
		var adFrame = document.getElementById('ad-frame');
		if ((typeof adFrame !== 'undefined') && (adFrame !== null)) {
			adFrame.style.display = 'none';
		}
		modules['styleTweaks'].setSRStyleToggleVisibility(false, 'RedditResearchConsole');
		// add a class to body to hide the scrollbar.
		setTimeout(function() {
			// Main reason for timeout: https://bugzilla.mozilla.org/show_bug.cgi?id=625289
			document.querySelector('body').classList.add('res-console-open');
		}, 500);

		modules['styleTweaks'].setSRStyleToggleVisibility(false, 'RedditResearchConsole');
		// var leftCentered = Math.floor((window.innerWidth - 720) / 2);
		// modalOverlay.setAttribute('style','display: block; height: ' + document.documentElement.scrollHeight + 'px');
		this.modalOverlay.classList.remove('fadeOut');
		this.modalOverlay.classList.add('fadeIn');

		// this.RedditResearchConsoleContainer.setAttribute('style','display: block; left: ' + leftCentered + 'px');
		// this.RedditResearchConsoleContainer.setAttribute('style','display: block; left: 1.5%;');
		this.RedditResearchConsoleContainer.classList.remove('slideOut');
		this.RedditResearchConsoleContainer.classList.add('slideIn');

		RedditResearchStorage.setItem('RedditResearchConsole.hasOpenedConsole', true);

		$('body').on('keyup', RedditResearchConsole.handleEscapeKey);
		
		
		
	},
	handleEscapeKey: function(event) {
		// don't close if the user is in a token input field (e.g. adding subreddits to a list)
		// because they probably just want to cancel the dropdown list
		if (event.which === 27 && (document.activeElement.id.indexOf('token-input') === -1)) {
			RedditResearchConsole.close();
			$('body').off('keyup', RedditResearchConsole.handleEscapeKey);
		}
	},
	close: function() {
		$('#RedditResearchModuleOptionsSave').fadeOut();
		this.isOpen = false;
		// Let's be nice to reddit and put their ad frame back now...
		var adFrame = document.getElementById('ad-frame');
		if ((typeof adFrame !== 'undefined') && (adFrame !== null)) {
			adFrame.style.display = 'block';
		}

		modules['styleTweaks'].setSRStyleToggleVisibility(true, 'RedditResearchConsole');

		// this.RedditResearchConsoleContainer.setAttribute('style','display: none;');
		this.modalOverlay.classList.remove('fadeIn');
		this.modalOverlay.classList.add('fadeOut');
		this.RedditResearchConsoleContainer.classList.remove('slideIn');
		this.RedditResearchConsoleContainer.classList.add('slideOut');
		setTimeout(function() {
			// Main reason for timeout: https://bugzilla.mozilla.org/show_bug.cgi?id=625289
			document.querySelector('body').classList.remove('res-console-open');
		}, 500);
		// just in case the user was in the middle of setting a key and decided to close the dialog, clean that up.
		if (typeof RedditResearchConsole.keyCodeModal !== 'undefined') {
			RedditResearchConsole.keyCodeModal.style.display = 'none';
			RedditResearchConsole.captureKey = false;
		}

		modules['settingsNavigation'].setUrlHash();
	},
	menuClick: function(obj) {
		if (!obj) return;

		var objID = obj.getAttribute('id');
		var category = objID.split('-');
		category = category[category.length - 1];
		var moduleID = this.getModuleIDsByCategory(category)[0];
		this.openCategoryPanel(category);
		this.showConfigOptions(moduleID);
	},
	openCategoryPanel: function(category) {
		// make all menu items look unselected
		$(RedditResearchConsole.RedditResearchMenuItems).removeClass('active');

		// make selected menu item look selected
		$(RedditResearchConsole.RedditResearchMenuItems).filter(function() {
			var thisCategory = (this.getAttribute('id') || '').split('-');
			thisCategory = thisCategory[thisCategory.length - 1];

			if (thisCategory == category) return true;
		}).addClass('active');

		// hide all console panels
		$(RedditResearchConsole.RedditResearchConsoleContent).find('.RedditResearchPanel').hide();

		switch (category) {
			case 'Menu-RedditResearch Pro': // cruft
			case 'RedditResearch Pro':
				// show the pro panel
				$(this.RedditResearchConsoleProPanel).show();
				break;
			default:
				// show the config panel for the given category
				$(this.RedditResearchConsoleConfigPanel).show();
				this.drawConfigPanelCategory(category);
				break;
		}
	},
	updateAdvancedOptionsVisibility: function() {
		if (modules['settingsNavigation'].options.showAdvancedOptions.value) {
			document.getElementById('RedditResearchConsoleContent').classList.remove('advanced-options-disabled');
		} else {
			document.getElementById('RedditResearchConsoleContent').classList.add('advanced-options-disabled');
		}
	},
	getOptionValue: function(moduleID, optionKey) {
		var optionInput;
		if (optionInput =  document.getElementById(optionKey)) {
			return optionInput.value;
		} else {
			console.error('Can\'t get Option Value because the element doesn\' exist.');
			return null;
		}
	},
	setOptionValue: function(moduleID, optionKey, value) {
		// https://github.com/matheod/Reddit-Enhancement-Suite/commit/771d034c914668b98d9ee2bf0f49e37cf117a2b7#commitcomment-6559134
		var optionInput;
		if (optionInput =  document.getElementById(optionKey)) {
			optionInput.value = value;
		} else {
			console.error('Can\'t set Option Value because the element doesn\' exist.');
		}
	}
};
