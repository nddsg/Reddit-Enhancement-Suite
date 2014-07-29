// define the RESResearchConsole class
var RESResearchConsole = {
	modalOverlay: '',
	RESResearchConsoleContainer: '',
	RESResearchMenuItems: [],
	RESResearchConfigPanelOptions: null,
	// make the modules panel accessible to this class for updating (i.e. when preferences change, so we can redraw it)
	RESResearchConsoleConfigPanel: RESResearchUtils.createElementWithID('div', 'RESResearchConsoleConfigPanel', 'RESResearchPanel'),
	RESResearchConsoleAboutPanel: RESResearchUtils.createElementWithID('div', 'RESResearchConsoleAboutPanel', 'RESResearchPanel'),
	RESResearchConsoleProPanel: RESResearchUtils.createElementWithID('div', 'RESResearchConsoleProPanel', 'RESResearchPanel'),
	addConsoleLink: function() {
		this.userMenu = document.querySelector('#header-bottom-right');
		if (this.userMenu) {
			var RESResearchPrefsLink = $("<span id='openRESResearchPrefs'><span id='RESResearchSettingsButton' title='RESResearch Settings' class='RESResearchGearIcon'></span>")
				.mouseenter(RESResearchConsole.showPrefsDropdown);
			$(this.userMenu).find("ul").after(RESResearchPrefsLink).after("<span class='separator'>|</span>");
			this.RESResearchPrefsLink = RESResearchPrefsLink[0];
		}
	},
	addConsoleDropdown: function() {
		this.gearOverlay = RESResearchUtils.createElementWithID('div', 'RESResearchMainGearOverlay');
		this.gearOverlay.setAttribute('class', 'RESResearchGearOverlay');
		$(this.gearOverlay).html('<div class="RESResearchGearIcon"></div>');

		this.prefsDropdown = RESResearchUtils.createElementWithID('div', 'RESResearchPrefsDropdown', 'RESResearchDropdownList');
		$(this.prefsDropdown).html('<ul id="RESResearchDropdownOptions"><li id="SettingsConsole">Research settings console</li>');
		this.prefsDropdown = RESResearchUtils.createElementWithID('div', 'RESResearchPrefsDropdown', 'RESResearchDropdownList');
		$(this.prefsDropdown).html('<ul id="RESResearchDropdownOptions"><li id="SettingsConsole">RES settings console</li></ul>');
		var thisSettingsButton = this.prefsDropdown.querySelector('#SettingsConsole');
		this.settingsButton = thisSettingsButton;
		thisSettingsButton.addEventListener('click', function() {
			RESResearchConsole.hidePrefsDropdown();
			RESResearchConsole.open();
		}, true);
		$(this.prefsDropdown).mouseleave(function() {
			RESResearchConsole.hidePrefsDropdown();
		});
		$(this.prefsDropdown).mouseenter(function() {
			clearTimeout(RESResearchConsole.prefsTimer);
		});
		$(this.gearOverlay).mouseleave(function() {
			RESResearchConsole.prefsTimer = setTimeout(function() {
				RESResearchConsole.hidePrefsDropdown();
			}, 1000);
		});
		document.body.appendChild(this.gearOverlay);
		document.body.appendChild(this.prefsDropdown);
		if (RESResearchStorage.getItem('RESResearch.newAnnouncement', 'true')) {
			RESResearchUtils.setNewNotification();
		}
	},
	showPrefsDropdown: function(e) {
		var thisTop = parseInt($(RESResearchConsole.userMenu).offset().top + 1, 10);
		// var thisRight = parseInt($(window).width() - $(RESResearchConsole.RESResearchPrefsLink).offset().left, 10);
		// thisRight = 175-thisRight;
		var thisLeft = parseInt($(RESResearchConsole.RESResearchPrefsLink).offset().left - 6, 10);
		// $('#RESResearchMainGearOverlay').css('left',thisRight+'px');
		$('#RESResearchMainGearOverlay').css('height', $('#header-bottom-right').outerHeight() + 'px');
		$('#RESResearchMainGearOverlay').css('left', thisLeft + 'px');
		$('#RESResearchMainGearOverlay').css('top', thisTop + 'px');
		RESResearchConsole.prefsDropdown.style.top = parseInt(thisTop + $(RESResearchConsole.userMenu).outerHeight(), 10) + 'px';
		RESResearchConsole.prefsDropdown.style.right = '0px';
		RESResearchConsole.prefsDropdown.style.display = 'block';
		$('#RESResearchMainGearOverlay').show();
		modules['styleTweaks'].setSRStyleToggleVisibility(false, 'prefsDropdown');
	},
	hidePrefsDropdown: function(e) {
		RESResearchConsole.RESResearchPrefsLink.classList.remove('open');
		$('#RESResearchMainGearOverlay').hide();
		RESResearchConsole.prefsDropdown.style.display = 'none';
		modules['styleTweaks'].setSRStyleToggleVisibility(true, 'prefsDropdown');
	},
	RESResearchetModulePrefs: function() {
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
			'RESResearchPro': false
		};
		this.setModulePrefs(prefs);
		return prefs;
	},
	getAllModulePrefs: function(force) {
		var storedPrefs;
		// if we've done this before, just return the cached version
		if ((!force) && (typeof this.getAllModulePrefsCached !== 'undefined')) return this.getAllModulePrefsCached;
		// get the stored preferences out first.
		if (RESResearchStorage.getItem('RESResearch.modulePrefs') !== null) {
			storedPrefs = safeJSON.parse(RESResearchStorage.getItem('RESResearch.modulePrefs'), 'RESResearch.modulePrefs');
		} else if (RESResearchStorage.getItem('modulePrefs') !== null) {
			// Clean up old moduleprefs.
			storedPrefs = safeJSON.parse(RESResearchStorage.getItem('modulePrefs'), 'modulePrefs');
			RESResearchStorage.removeItem('modulePrefs');
			this.setModulePrefs(storedPrefs);
		} else {
			// looks like this is the first time RESResearch has been run - set prefs to defaults...
			storedPrefs = this.RESResearchetModulePrefs();
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
			RESResearchStorage.setItem('RESResearch.modulePrefs', JSON.stringify(prefs));
			return prefs;
		} else {
			alert('error - no prefs specified');
		}
	},
	create: function() {
		// create the console container
		this.RESResearchConsoleContainer = RESResearchUtils.createElementWithID('div', 'RESResearchConsoleContainer');
		// hide it by default...
		// this.RESResearchConsoleContainer.style.display = 'none';
		// create a modal overlay
		this.modalOverlay = RESResearchUtils.createElementWithID('div', 'modalOverlay');
		this.modalOverlay.addEventListener('click', function(e) {
			e.preventDefault();
			return false;
		}, true);
		document.body.appendChild(this.modalOverlay);
		// create the header
		var RESResearchConsoleHeader = RESResearchUtils.createElementWithID('div', 'RESResearchConsoleHeader');
		// create the top bar and place it in the header
		var RESResearchConsoleTopBar = RESResearchUtils.createElementWithID('div', 'RESResearchConsoleTopBar');
		this.logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAEZ0lEQVRogdVZXWhcRRg93+zdTWzqmmrNQyIxuZlN/MMftlAfgq5BMQjim9BCEasg+BKsSF9aXwqGUgy+Kv492IcKPhlI25eGShEULAjRxJ0kEJYSqibdZKl22TufD6Z2u9m9M/fOXqPnbWfOnO87c2fufHMX+J+D4g7M5/Pe5uZmDzP3aK1FYz8zV9Lp9JWFhYWKW4rh8OIOLJfLRwCcBACi7fNARAiCYAXA/bGzs8C2mYuAeyw4ex30rRDbgNb6HIDfQihVANNx9W0Rew8AgJQyA+BGi+63lFIfuOjbwGUJQSlVBVBr1kdEf7po28LJQG9v7y60fhHsdtG2hZOBrq6uI636mPm1/v7+bhd9G8Q2IKU8zMwnQigPZDKZC3H1beHyBB624DzioG8FpyVkgaYbvJ2IfRJb4tY5MbM2CmAUoDtA+Arje35sR4BEnwAzf44vOSPOrp0h0DcEmiTgXWJcxsz6MQAYGRnZXSgUYk9kkgauep53Utx57TgzvdwYl4ATmLk2FgSBKJVK3/u+vy9OkCQNTC/Mz1cYeLMVgaCPKqU2iOiKEOKSlPJw1CCJGWDmnzELD0Drs4BEPwBorX8CkAHwiZTyYJQ4iRkgIg/PUA2MpZYk5l8AQAjRWdf6mZTySds4SS6h/QDARJMt+jUz3gcAZi7UtWeI6EPbje1i4GsAYQXbWKFQ8DB+16fE9B4AXde3wUwH8MKei0NDQ2NoOPCY+dFSqfS6TRJO5XQul3uKmS+g+URMK6Ve/OfXud/vgxb7QFzFjeAiXrq3Mjg42JNKpS4D6G0yfl4p9aApBycDACCl/ANAZ5Ou0PuA7/tZIcS3AB5qmRzR/mKx+F1Y/CT3QOh9YGlpqQJDJcDM46YgSb5GTXWQBnDawBkxxUm6mAsFEZ01UO42aTgbYOaVZu1E1LS9gbNhoOwyaTgb0Fo/B9x2WFWJ6FWl1HmLsaYEqyYN53J6eXl5RUr5hBBiLwAEQVBRSl21GUtEo8wcRjE9ofbcB5RSGzbB6jEwMNDJzBMG2rxJZ8c2sed5kwD8MA4RXTLqRAmay+WOMfNjUcbUQwgxobXuxt+vz8cN9NW+vr7zxWIxlBTJgNb6aSJ6NsqYejDzcQA9MCcPAB/Nzs4a79T/+hJq9im+Ecy82tHRccpGL9ITIKIzAH6IMqYeWus1IcSwBXVibm7O6n8F52IuCvL5vFcul08DaLwj12NKKfW2rWaiBrYS/rWuqRPNK9eb+Fgp9QZuvzuEIunvQkDYnfgWasx8dHFxcSqq+I4WczfBzFNxkgf+IwaEELE/QUZaQr7vZ2u12jbTqVQqm06nt2mtr697QpjniJm7h4eH/Wq1et3zvOtbpYkVrDbx1gn8DoCsrbALmHmViE4ppYzLymggl8sdZGbTzSkpHFJKfRFGsDkVX2lfPpFxyESw2cQ2J2dSMP7PbGMg04ZE4sK452wMrLUhkbgIO7UBWLxGhRDPhwkxc9amwowDrXXif1HtOP4CxeRtUNqGs18AAAAASUVORK5CYII=';
		// this string is split because a specific sequence of characters screws up some git clients into thinking this file is binary.
		this.loader = 'data:image/gif;base64,R0lGODlhHQAWANUAAESatESetEyetEyitEyivFSivFSmvFymvFyqvGSqvGSqxGSuxGyuxGyyxHSyxHS2xHS2zHy2zHy6zIS6zIS+zIy+zIzCzIzC1JTG1JzK1JzK3JzO3KTO3KTS3KzS3KzW3LTW3LTW5LTa5Lza5Lze5MTe5MTi5MTi7Mzi7Mzm7NTm7NTq7Nzq7Nzq9Nzu9OTu9OTy9Ozy9Oz29Oz2/PT2/PT6/Pz6/Pz+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH';
		this.loader += '/C05FVFNDQVBFMi4wAwEAAAAh/h1CdWlsdCB3aXRoIEdJRiBNb3ZpZSBHZWFyIDQuMAAh+QQIBgAAACwAAAAAHQAWAAAG/sCbcEgs3myyEIzjQr2MUGjrgpFMrJIMhxTtei4SbPhKwXCeXaLren00GIuHlSLxzNJDD4NOWST8CwsUgxEjeEIcDYN0ICkjFA4UFYMcRXckIS8XKysTCJKSGCMkHBUXpwwXRC8UGheLpgsMDBKmF6YWF7kODYY3LmawoKcXCxIKFMSnkBIELDczIxODk2SmpoMFbg8XDg4SAAoTNTUY1BcTDQsKCw2nGGAMBAUJDQcCDZ8yNzESya8NFDCAEFAChoO6GGSowEDDggsq0HhIZisVixkwQFDBkIHCARQ1XICosSIGEYe5MFjAsE8IigwcYWa402VEyoNmRozgkEFDbs8MBRS0jJJCwAOcMn1u4MBTA4UHNdLIgIAOg08NGphqZWAggohDHBIEqMCRqZYMEjZMMPBgaJcYcDAcQMBhwgMOGOg9AOHrUIkQ8hJQQKDgQaQFEQ4ZuRABxSwREtqWcKHYiIwaWm6UGBG18o0gACH5BAgGAAAALAAAAAAdABYAAAb';
		this.loader += '+wJtwSCwKXabWBjaS2YxQowqDkUysEg4GFe1+LtgrVkKddYsvCRbSYCwcEgpl4jGfhR3GnLJILP4JchQQJXdCHhCCEiApIxUNFZESGkUzNCsaMBwjMRQFE3IVGCMkHBYXFBcQGEM1NhRUexWqCRAQsxcWuBcXEQgkQjEXGYIUFanIDxENEry5F48SByo3MCWCx1fGzlcHCxKQEggUAgYWrqjGcg0LCguQuVUNBwUJbgIKDBFmMKi4DfnYKCBDhUqDCRgWYFDmAoYQDs2cMcCwYkaMEBYKUjiAAsaMDzFgxCDiocEpDBcwjBSSIkMGDRkwWHDYJUSqghg2jBjB4eVzSwwKINA4Y0JAhIIuYcLkoKFnAwc1zsyYYCFC0pccsmZNcNCDoQ4FCmAQ1TPr2A4JClCIeufFggcUAkDg8ECCBwkF4F4YYYhlCAQFHEwwwECCAwcINDzpK2QGBQ4gFEwAsSDDDA4vGBOxUaMfFw5cNN8IAgAh+QQIBgAAACwAAAAAHQAWAAAG/sCbcEgsClcqlAc2qtWMUCOKc5FYrZyK6xmFhizWiURMxmBm3SIMMp48GoyFQ0Kpc9BpIcchpiz+';
		this.loader += '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';
		RESResearchConsoleTopBar.setAttribute('class', 'RESResearchDialogTopBar');
		$(RESResearchConsoleTopBar).html('<img id="RESResearchLogo" src="' + this.logo + '" height=30><h1>RESResearch</h1>');
		RESResearchConsoleHeader.appendChild(RESResearchConsoleTopBar);
		this.RESResearchConsoleVersionDisplay = RESResearchUtils.createElementWithID('div', 'RESResearchConsoleVersionDisplay');
		$(this.RESResearchConsoleVersionDisplay).text('v' + RESResearchVersion);
		RESResearchConsoleTopBar.appendChild(this.RESResearchConsoleVersionDisplay);

		// Create the search bar and place it in the top bar
		//var RESResearchSearchContainer = modules['search'].renderSearchForm();
		//RESResearchConsoleTopBar.appendChild(RESResearchSearchContainer);

		var RESResearchSubredditLink = RESResearchUtils.createElementWithID('a', 'RESResearchConsoleSubredditLink');
		$(RESResearchSubredditLink).text('/r/resr');
		RESResearchSubredditLink.setAttribute('href', '/r/resr');
		RESResearchSubredditLink.setAttribute('alt', 'The RESResearch Subreddit');
		RESResearchConsoleTopBar.appendChild(RESResearchSubredditLink);
		// create the close button and place it in the header
		var RESResearchClose = RESResearchUtils.createElementWithID('span', 'RESResearchClose', 'RESResearchCloseButton');
		$(RESResearchClose).text('×');
		RESResearchClose.addEventListener('click', function(e) {
			e.preventDefault();
			RESResearchConsole.close();
		}, true);
		RESResearchConsoleTopBar.appendChild(RESResearchClose);

		this.categories = [];
		for (var module in modules) {
			if ((typeof modules[module].category !== 'undefined') && (this.categories.indexOf(modules[module].category) === -1)) {
				this.categories.push(modules[module].category);
			}
		}
		this.categories.sort(function(a, b) {
			if (a == "About RESResearch") return 1;
			if (b == "About RESResearch") return -1;
			return a.localeCompare(b);
		});
		// create the menu
		// var menuItems = this.categories.concat(['RESResearch Pro','About RESResearch'));
		var menuItems = this.categories;
		var RESResearchMenu = RESResearchUtils.createElementWithID('ul', 'RESResearchMenu');
		for (var item = 0; item < menuItems.length; item++) {
			var thisMenuItem = document.createElement('li');
			$(thisMenuItem).text(menuItems[item]);
			thisMenuItem.setAttribute('id', 'Menu-' + menuItems[item]);
			thisMenuItem.addEventListener('click', function(e) {
				e.preventDefault();
				RESResearchConsole.menuClick(this);
			}, true);
			RESResearchMenu.appendChild(thisMenuItem);
		}
		RESResearchConsoleHeader.appendChild(RESResearchMenu);
		this.RESResearchConsoleContainer.appendChild(RESResearchConsoleHeader);
		// Store the menu items in a global variable for easy access by the menu selector function.
		RESResearchConsole.RESResearchMenuItems = RESResearchMenu.querySelectorAll('li');
		// Create a container for each management panel
		this.RESResearchConsoleContent = RESResearchUtils.createElementWithID('div', 'RESResearchConsoleContent');
		this.RESResearchConsoleContainer.appendChild(this.RESResearchConsoleContent);
		// Okay, the console is done. Add it to the document body.
		document.body.appendChild(this.RESResearchConsoleContainer);

		window.addEventListener("keydown", function(e) {
			if ((RESResearchConsole.captureKey) && (e.keyCode !== 16) && (e.keyCode !== 17) && (e.keyCode !== 18)) {
				// capture the key, display something nice for it, and then close the popup...
				e.preventDefault();
				if (e.keyCode === 8) { // backspace, we disable the shortcut
					var keyArray = [-1, false, false, false, false];
				} else {
					var keyArray = [e.keyCode, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey];
				}
				document.getElementById(RESResearchConsole.captureKeyID).value = keyArray.join(",");
				document.getElementById(RESResearchConsole.captureKeyID + '-display').value = RESResearchUtils.niceKeyCode(keyArray);
				RESResearchConsole.keyCodeModal.style.display = 'none';
				RESResearchConsole.captureKey = false;
			}
		});

		$("#RESResearchConsoleContent").on({
			focus: function(e) {
				var thisXY = RESResearchUtils.getXYpos(this, true);
				// show dialog box to grab keycode, but display something nice...
				$(RESResearchConsole.keyCodeModal).css({
					display: "block",
					top: RESResearchUtils.mouseY + "px",
					left: RESResearchUtils.mouseX + "px"
				});
				// RESResearchConsole.keyCodeModal.style.display = 'block';
				RESResearchConsole.captureKey = true;
				RESResearchConsole.captureKeyID = this.getAttribute('capturefor');
			},
			blur: function(e) {
				$(RESResearchConsole.keyCodeModal).css("display", "none");
			}
		}, ".keycode + input[type=text][displayonly]");

		this.keyCodeModal = RESResearchUtils.createElementWithID('div', 'keyCodeModal');
		$(this.keyCodeModal).text('PRESResearchs a key (or combination with shift, alt and/or ctrl) to assign this action.');
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
		$(this.RESResearchConsoleConfigPanel).empty();

		/*
		var moduleTest = RESResearchStorage.getItem('moduleTest');
		if (moduleTest) {
			console.log(moduleTest);
			// TEST loading stored modules...
			var evalTest = eval(moduleTest);
		}
		*/
		moduleList = moduleList || this.getModuleIDsByCategory(category);

		this.RESResearchConfigPanelModulesPane = RESResearchUtils.createElementWithID('div', 'RESResearchConfigPanelModulesPane');
		for (var i = 0, len = moduleList.length; i < len; i++) {
			var thisModuleButton = RESResearchUtils.createElementWithID('div', 'module-' + moduleList[i]);
			thisModuleButton.classList.add('moduleButton');
			var thisModule = moduleList[i];
			$(thisModuleButton).text(modules[thisModule].moduleName);
			if (modules[thisModule].isEnabled()) {
				thisModuleButton.classList.add('enabled');
			}
			thisModuleButton.setAttribute('moduleID', modules[thisModule].moduleID);
			thisModuleButton.addEventListener('click', function(e) {
				RESResearchConsole.showConfigOptions(this.getAttribute('moduleID'));
			}, false);
			this.RESResearchConfigPanelModulesPane.appendChild(thisModuleButton);
		}
		this.RESResearchConsoleConfigPanel.appendChild(this.RESResearchConfigPanelModulesPane);

		this.RESResearchConfigPanelOptions = RESResearchUtils.createElementWithID('div', 'RESResearchConfigPanelOptions');
		$(this.RESResearchConfigPanelOptions).html('<h1>RESResearch Module Configuration</h1> Select a module from the column at the left to enable or disable it, and configure its various options.');
		this.RESResearchConsoleConfigPanel.appendChild(this.RESResearchConfigPanelOptions);
		this.RESResearchConsoleContent.appendChild(this.RESResearchConsoleConfigPanel);
	},
	updateSelectedModule: function(moduleID) {
		var moduleButtons = $(RESResearchConsole.RESResearchConsoleConfigPanel).find('.moduleButton');
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
				thisOptionFormEle = RESResearchUtils.createElementWithID('textarea', optionName);
				thisOptionFormEle.setAttribute('type', 'textarea');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				$(thisOptionFormEle).html(escapeHTML(optionObject.value));
				break;
			case 'text':
				// text...
				thisOptionFormEle = RESResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type', 'text');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				thisOptionFormEle.setAttribute('placeHolder', optionObject.placeHolder || '');
				thisOptionFormEle.setAttribute('value', optionObject.value);
				break;
			case 'color':
				// color...
				thisOptionFormEle = RESResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type', 'color');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				// thisOptionFormEle.setAttribute('value', optionObject.value); // didn't work on chrome, need to work with .value
				thisOptionFormEle.value = optionObject.value;
				break;
			case 'button':
				// button...
				thisOptionFormEle = RESResearchUtils.createElementWithID('button', optionName);
				thisOptionFormEle.classList.add('RESResearchConsoleButton');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				thisOptionFormEle.textContent = optionObject.text;
				thisOptionFormEle.addEventListener('click', optionObject.callback, false);
				break;
			case 'list':
				// list...
				thisOptionFormEle = RESResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('class', 'RESResearchInputList');
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
						onRESResearchult: (typeof optionObject.onRESResearchult === 'function') ? optionObject.onRESResearchult : null,
						onCachedRESResearchult: (typeof optionObject.onCachedRESResearchult === 'function') ? optionObject.onCachedRESResearchult : null,
						prePopulate: prepop,
						hintText: (typeof optionObject.hintText === 'string') ? optionObject.hintText : null
					});
				}, 100);
				break;
			case 'password':
				// password...
				thisOptionFormEle = RESResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type', 'password');
				thisOptionFormEle.setAttribute('moduleID', moduleID);
				thisOptionFormEle.setAttribute('value', optionObject.value);
				break;
			case 'boolean':
				// checkbox
				/*
				var thisOptionFormEle = RESResearchUtils.createElementWithID('input', optionName);
				thisOptionFormEle.setAttribute('type','checkbox');
				thisOptionFormEle.setAttribute('moduleID',moduleID);
				thisOptionFormEle.setAttribute('value',optionObject.value);
				if (optionObject.value) {
					thisOptionFormEle.setAttribute('checked',true);
				}
				*/
				thisOptionFormEle = RESResearchUtils.toggleButton(moduleID, optionName, optionObject.value, null, null, isTable);
				break;
			case 'enum':
				// radio buttons
				if (typeof optionObject.values === 'undefined') {
					alert('misconfigured enum option in module: ' + moduleID);
				} else {
					thisOptionFormEle = RESResearchUtils.createElementWithID('div', optionName);
					thisOptionFormEle.setAttribute('class', 'enum');
					for (var j = 0; j < optionObject.values.length; j++) {
						var thisDisplay = optionObject.values[j].display;
						var thisValue = optionObject.values[j].value;
						var thisId = optionName + '-' + j;
						var thisOptionFormSubEle = RESResearchUtils.createElementWithID('input', thisId);
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
				// keycode - shows a key value, but stoRESResearch a keycode and possibly shift/alt/ctrl combo.
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
				}).val(RESResearchUtils.niceKeyCode(optionObject.value));
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
		RESResearchConsole.drawConfigOptions(moduleID);
		RESResearchConsole.updateSelectedModule(moduleID);
		RESResearchConsole.currentModule = moduleID;

		RESResearchConsole.RESResearchConsoleContent.scrollTop = 0;

		modules['settingsNavigation'].setUrlHash(moduleID);
	},
	drawConfigOptions: function(moduleID) {
		if (modules[moduleID] && modules[moduleID].hidden) return;
		var thisOptions = RESResearchUtils.getOptions(moduleID),
			optCount = 0,
			thisHeader,
			thisToggle, thisDescription, allOptionsContainer,
			thisOptionContainer, containerID, thisLabel,
			thisSaveButton,
			thisOptionFormEle,
			i, dep;

		this.RESResearchConfigPanelOptions.setAttribute('style', 'display: block;');
		$(this.RESResearchConfigPanelOptions).html('');
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
			var activePane = RESResearchConsole.RESResearchConfigPanelModulesPane.querySelector('.active'),
				enabled = this.classList.contains('enabled');

			if (enabled) {
				activePane.classList.remove('enabled');
				this.classList.remove('enabled');
				if (RESResearchConsole.moduleOptionsScrim) {
					RESResearchConsole.moduleOptionsScrim.classList.add('visible');
				}
				$('#RESResearchModuleOptionsSave').hide();
			} else {
				activePane.classList.add('enabled');
				this.classList.add('enabled');
				RESResearchConsole.moduleOptionsScrim.classList.remove('visible');
				if (RESResearchConsole.moduleOptionsScrim) {
					RESResearchConsole.moduleOptionsScrim.classList.remove('visible');
				}
				$('#RESResearchModuleOptionsSave').fadeIn();
			}
			RESResearchConsole.enableModule(this.getAttribute('moduleID'), !enabled);
		}, true);
		thisHeader.appendChild(thisToggle);

		// not really looping here, just only executing if there's 1 or more options...
		for (i in thisOptions) {
			thisSaveButton = RESResearchUtils.createElementWithID('input', 'RESResearchModuleOptionsSave');
			thisSaveButton.setAttribute('type', 'button');
			thisSaveButton.setAttribute('value', 'save options');
			thisSaveButton.addEventListener('click', function(e) {
				RESResearchConsole.saveCurrentModuleOptions(e);
			}, true);
			this.RESResearchConsoleConfigPanel.appendChild(thisSaveButton);
			var thisSaveStatus = RESResearchUtils.createElementWithID('div', 'RESResearchModuleOptionsSaveStatus', 'saveStatus');
			thisHeader.appendChild(thisSaveStatus);
			break;
		}
		thisDescription = document.createElement('div');
		thisDescription.classList.add('moduleDescription');
		$(thisDescription).html(modules[moduleID].description);
		thisHeader.appendChild(thisDescription);
		this.RESResearchConfigPanelOptions.appendChild(thisHeader);
		allOptionsContainer = RESResearchUtils.createElementWithID('div', 'allOptionsContainer');
		this.RESResearchConfigPanelOptions.appendChild(allOptionsContainer);
		// now draw all the options...
		for (i in thisOptions) {
			if (!thisOptions[i].noconfig) {
				optCount++;
				containerID = 'optionContainer-' + moduleID + '-' + i;
				thisOptionContainer = RESResearchUtils.createElementWithID('div', containerID, 'optionContainer');
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
						niceDefaultOption = RESResearchUtils.niceKeyCode(thisOptions[i].default);
						break;
				}
				if (niceDefaultOption !== null) {
					thisLabel.setAttribute('title', 'Default: ' + niceDefaultOption);
				}
				$(thisLabel).text(i);
				var thisOptionDescription = RESResearchUtils.createElementWithID('div', null, 'optionDescription');
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
								thisDeleteButton.addEventListener('click', RESResearchConsole.deleteOptionRow);
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
							var thisInput = RESResearchConsole.drawOptionInput(moduleID, optionNameWithRow, thisOpt, true);
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
						thisDeleteButton.addEventListener('click', RESResearchConsole.deleteOptionRow);
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
							scrollContainer: this.RESResearchConfigPanelOptions,
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
			var noOptions = RESResearchUtils.createElementWithID('div', 'noOptions');
			noOptions.classList.add('optionContainer');
			$(noOptions).text('There are no configurable options for this module.');
			this.RESResearchConfigPanelOptions.appendChild(noOptions);
		} else {
			// var thisSaveStatusBottom = RESResearchUtils.createElementWithID('div','RESResearchModuleOptionsSaveStatusBottom','saveStatus');
			// this.RESResearchConfigPanelOptions.appendChild(thisBottomSaveButton);
			// this.RESResearchConfigPanelOptions.appendChild(thisSaveStatusBottom);
			this.moduleOptionsScrim = RESResearchUtils.createElementWithID('div', 'moduleOptionsScrim');
			if (modules[moduleID].isEnabled()) {
				RESResearchConsole.moduleOptionsScrim.classList.remove('visible');
				$('#RESResearchModuleOptionsSave').fadeIn();
			} else {
				RESResearchConsole.moduleOptionsScrim.classList.add('visible');
				$('#RESResearchModuleOptionsSave').fadeOut();
			}
			allOptionsContainer.appendChild(this.moduleOptionsScrim);
			// console.log($(thisSaveButton).position());
		}
	},
	onOptionChange: function(moduleID, fieldID, oldValue, newValue) {
		var thisOptions = RESResearchUtils.getOptions(moduleID),
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
		var panelOptionsDiv = this.RESResearchConfigPanelOptions;
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
				var optionValue, moduleID = RESResearchConsole.currentModule;
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
						// convert the internal values of this array into their RESResearchpective types (int, bool, bool, bool)
						optionValue = [parseInt(tempArray[0], 10), (tempArray[1] === 'true'), (tempArray[2] === 'true'), (tempArray[3] === 'true'), (tempArray[4] === 'true')];
					} else {
						optionValue = inputs[i].value;
					}
				}
				if (typeof optionValue !== 'undefined') {
					RESResearchUtils.setOption(moduleID, optionName, optionValue);
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
										// convert the internal values of this array into their RESResearchpective types (int, bool, bool, bool)
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
						RESResearchUtils.setOption(moduleID, optionName, optionMulti);
					}
				}
			}
		}

		var statusEle = document.getElementById('RESResearchModuleOptionsSaveStatus');
		if (statusEle) {
			$(statusEle).text('Options have been saved...');
			statusEle.setAttribute('style', 'display: block; opacity: 1');
		}
		RESResearchUtils.fadeElementOut(statusEle, 0.1);
		if (moduleID === 'RESResearchPro') RESResearchStorage.removeItem('RESResearchmodules.RESResearchPro.lastAuthFailed');
	},
	drawProPanel: function() {
		RESResearchConsoleProPanel = this.RESResearchConsoleProPanel;
		var proPanelHeader = document.createElement('div');
		$(proPanelHeader).html('RESResearch Pro allows you to save your preferences to the RESResearch Pro server.<br><br><strong>Please note:</strong> this is beta functionality right now. Please don\'t consider this to be a "backup" solution just yet. To start, you will need to <a target="_blank" href="http://redditenhancementsuite.com/register.php">register for a PRO account</a> first, then email <a href="mailto:steve@honestbleeps.com">steve@honestbleeps.com</a> with your RESResearch Pro username to get access.');
		RESResearchConsoleProPanel.appendChild(proPanelHeader);
		this.proSetupButton = RESResearchUtils.createElementWithID('div', 'RESResearchProSetup');
		this.proSetupButton.setAttribute('class', 'RESResearchButton');
		$(this.proSetupButton).text('Configure RESResearch Pro');
		this.proSetupButton.addEventListener('click', function(e) {
			e.preventDefault();
			modules['RESResearchPro'].configure();
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proSetupButton);
		/*
		this.proAuthButton = RESResearchUtils.createElementWithID('div','RESResearchProAuth');
		this.proAuthButton.setAttribute('class','RESResearchButton');
		$(this.proAuthButton).html('Authenticate');
		this.proAuthButton.addEventListener('click', function(e) {
			e.preventDefault();
			modules['RESResearchPro'].authenticate();
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proAuthButton);
		*/
		this.proSaveButton = RESResearchUtils.createElementWithID('div', 'RESResearchProSave');
		this.proSaveButton.setAttribute('class', 'RESResearchButton');
		$(this.proSaveButton).text('Save Module Options');
		this.proSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RESResearchPro'].savePrefs();
			modules['RESResearchPro'].authenticate(modules['RESResearchPro'].savePrefs());
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proSaveButton);

		/*
		this.proUserTaggerSaveButton = RESResearchUtils.createElementWithID('div','RESResearchProSave');
		this.proUserTaggerSaveButton.setAttribute('class','RESResearchButton');
		$(this.proUserTaggerSaveButton).html('Save user tags to Server');
		this.proUserTaggerSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			modules['RESResearchPro'].saveModuleData('userTagger');
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proUserTaggerSaveButton);
		*/

		this.proSaveCommentsSaveButton = RESResearchUtils.createElementWithID('div', 'RESResearchProSaveCommentsSave');
		this.proSaveCommentsSaveButton.setAttribute('class', 'RESResearchButton');
		$(this.proSaveCommentsSaveButton).text('Save saved comments to Server');
		this.proSaveCommentsSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RESResearchPro'].saveModuleData('saveComments');
			modules['RESResearchPro'].authenticate(modules['RESResearchPro'].saveModuleData('saveComments'));
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proSaveCommentsSaveButton);

		this.proSubredditManagerSaveButton = RESResearchUtils.createElementWithID('div', 'RESResearchProSubredditManagerSave');
		this.proSubredditManagerSaveButton.setAttribute('class', 'RESResearchButton');
		$(this.proSubredditManagerSaveButton).text('Save subreddits to server');
		this.proSubredditManagerSaveButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RESResearchPro'].saveModuleData('SubredditManager');
			modules['RESResearchPro'].authenticate(modules['RESResearchPro'].saveModuleData('subredditManager'));
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proSubredditManagerSaveButton);

		this.proSaveCommentsGetButton = RESResearchUtils.createElementWithID('div', 'RESResearchProGetSavedComments');
		this.proSaveCommentsGetButton.setAttribute('class', 'RESResearchButton');
		$(this.proSaveCommentsGetButton).text('Get saved comments from Server');
		this.proSaveCommentsGetButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RESResearchPro'].getModuleData('saveComments');
			modules['RESResearchPro'].authenticate(modules['RESResearchPro'].getModuleData('saveComments'));
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proSaveCommentsGetButton);

		this.proSubredditManagerGetButton = RESResearchUtils.createElementWithID('div', 'RESResearchProGetSubredditManager');
		this.proSubredditManagerGetButton.setAttribute('class', 'RESResearchButton');
		$(this.proSubredditManagerGetButton).text('Get subreddits from Server');
		this.proSubredditManagerGetButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RESResearchPro'].getModuleData('SubredditManager');
			modules['RESResearchPro'].authenticate(modules['RESResearchPro'].getModuleData('subredditManager'));
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proSubredditManagerGetButton);

		this.proGetButton = RESResearchUtils.createElementWithID('div', 'RESResearchProGet');
		this.proGetButton.setAttribute('class', 'RESResearchButton');
		$(this.proGetButton).text('Get options from Server');
		this.proGetButton.addEventListener('click', function(e) {
			e.preventDefault();
			// modules['RESResearchPro'].getPrefs();
			modules['RESResearchPro'].authenticate(modules['RESResearchPro'].getPrefs());
		}, false);
		RESResearchConsoleProPanel.appendChild(this.proGetButton);
		this.RESResearchConsoleContent.appendChild(RESResearchConsoleProPanel);
	},
	open: function(moduleIdOrCategory) {
		var category, moduleID;
		if (!this.RESResearchConsoleContainer) {
			RESResearchConsole.create();
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
			moduleID = RESResearchdefaultModuleID;
			category = modules[moduleID].category;
		}

		// Draw the config panel
		this.drawConfigPanel();
		// Draw the RESResearch Pro panel
		// this.drawProPanel();
		this.openCategoryPanel(category);
		this.showConfigOptions(moduleID);

		this.isOpen = true;
		// hide the ad-frame div in case it's flash, because then it covers up the settings console and makes it impossible to see the save button!
		var adFrame = document.getElementById('ad-frame');
		if ((typeof adFrame !== 'undefined') && (adFrame !== null)) {
			adFrame.style.display = 'none';
		}
		modules['styleTweaks'].setSRStyleToggleVisibility(false, 'RESResearchConsole');
		// add a class to body to hide the scrollbar.
		setTimeout(function() {
			// Main reason for timeout: https://bugzilla.mozilla.org/show_bug.cgi?id=625289
			document.querySelector('body').classList.add('res-console-open');
		}, 500);

		modules['styleTweaks'].setSRStyleToggleVisibility(false, 'RESResearchConsole');
		// var leftCentered = Math.floor((window.innerWidth - 720) / 2);
		// modalOverlay.setAttribute('style','display: block; height: ' + document.documentElement.scrollHeight + 'px');
		this.modalOverlay.classList.remove('fadeOut');
		this.modalOverlay.classList.add('fadeIn');

		// this.RESResearchConsoleContainer.setAttribute('style','display: block; left: ' + leftCentered + 'px');
		// this.RESResearchConsoleContainer.setAttribute('style','display: block; left: 1.5%;');
		this.RESResearchConsoleContainer.classList.remove('slideOut');
		this.RESResearchConsoleContainer.classList.add('slideIn');

		RESResearchStorage.setItem('RESResearchConsole.hasOpenedConsole', true);

		$('body').on('keyup', RESResearchConsole.handleEscapeKey);
	},
	handleEscapeKey: function(event) {
		// don't close if the user is in a token input field (e.g. adding subreddits to a list)
		// because they probably just want to cancel the dropdown list
		if (event.which === 27 && (document.activeElement.id.indexOf('token-input') === -1)) {
			RESResearchConsole.close();
			$('body').off('keyup', RESResearchConsole.handleEscapeKey);
		}
	},
	close: function() {
		$('#RESResearchModuleOptionsSave').fadeOut();
		this.isOpen = false;
		// Let's be nice to reddit and put their ad frame back now...
		var adFrame = document.getElementById('ad-frame');
		if ((typeof adFrame !== 'undefined') && (adFrame !== null)) {
			adFrame.style.display = 'block';
		}

		modules['styleTweaks'].setSRStyleToggleVisibility(true, 'RESResearchConsole');

		// this.RESResearchConsoleContainer.setAttribute('style','display: none;');
		this.modalOverlay.classList.remove('fadeIn');
		this.modalOverlay.classList.add('fadeOut');
		this.RESResearchConsoleContainer.classList.remove('slideIn');
		this.RESResearchConsoleContainer.classList.add('slideOut');
		setTimeout(function() {
			// Main reason for timeout: https://bugzilla.mozilla.org/show_bug.cgi?id=625289
			document.querySelector('body').classList.remove('res-console-open');
		}, 500);
		// just in case the user was in the middle of setting a key and decided to close the dialog, clean that up.
		if (typeof RESResearchConsole.keyCodeModal !== 'undefined') {
			RESResearchConsole.keyCodeModal.style.display = 'none';
			RESResearchConsole.captureKey = false;
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
		$(RESResearchConsole.RESResearchMenuItems).removeClass('active');

		// make selected menu item look selected
		$(RESResearchConsole.RESResearchMenuItems).filter(function() {
			var thisCategory = (this.getAttribute('id') || '').split('-');
			thisCategory = thisCategory[thisCategory.length - 1];

			if (thisCategory == category) return true;
		}).addClass('active');

		// hide all console panels
		$(RESResearchConsole.RESResearchConsoleContent).find('.RESResearchPanel').hide();

		switch (category) {
			case 'Menu-RESResearch Pro': // cruft
			case 'RESResearch Pro':
				// show the pro panel
				$(this.RESResearchConsoleProPanel).show();
				break;
			default:
				// show the config panel for the given category
				$(this.RESResearchConsoleConfigPanel).show();
				this.drawConfigPanelCategory(category);
				break;
		}
	},
	updateAdvancedOptionsVisibility: function() {
		if (modules['settingsNavigation'].options.showAdvancedOptions.value) {
			document.getElementById('RESResearchConsoleContent').classList.remove('advanced-options-disabled');
		} else {
			document.getElementById('RESResearchConsoleContent').classList.add('advanced-options-disabled');
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
