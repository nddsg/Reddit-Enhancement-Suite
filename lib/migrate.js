// Add new migrations to the end of RESResearchOptionsMigrate.migrations in the form  '#.#.#.#': function() { migration code }

var RESResearchOptionsMigrate = {
	migrations: [
		{
			versionNumber: '0.0.0.1',
			go: function() {
			}
		}
	],

	migrators: {
		generic: {
			updateOption: function(moduleID, optionName, formerDefaultValue, valueOrFunction) {
				try {
					var option = RESResearchUtils.getOptions(moduleID)[optionName],
						oldValue = option.value,
						newValue = RESResearchOptionsMigrate.updateValue(oldValue, valueOrFunction);

					// only update this option to the new default value if its current value
					// hasn't been changed from the former default value.
					if (RESResearchOptionsMigrate.optionMatchesFormerDefaultValue(option, formerDefaultValue)) {
						RESResearchUtils.setOption(moduleID, optionName, newValue);
					}
				} catch (e) {
					console.error('Couldn\'t migrate (' + e + '; arguments were ' + Array.prototype.join.call(arguments, ', ') + ')');
				}
			},
			moveOption: function(oldModuleID, oldOptionName, newModuleID, newOptionName, valueOrFunction) {
				try {
					var oldValue = RESResearchUtils.getOptions(oldModuleID)[oldOptionName].value;
					var newValue = RESResearchOptionsMigrate.updateValue(oldValue, valueOrFunction);

					RESResearchUtils.setOption(newModuleID, newOptionName, newValue);
				} catch (e) {
					console.error('Couldn\'t migrate (' + e + '; arguments were ' + Array.prototype.join.call(arguments, ', ') + ')');
				}
			},
			moveStorage: function(oldKey, newKey, valueOrFunction) {
				var oldValue = RESResearchStorage.getItem(oldKey);

				if (oldValue === null) {
					return;
				}

				var newValue = RESResearchOptionsMigrate.updateValue(oldValue, valueOrFunction);
				RESResearchStorage.setItem(newKey, newValue);
			},
			moveStorageToOption: function(oldKey, newModuleID, newOptionName, valueOrFunction) {
				var oldValue = RESResearchStorage.getItem(oldKey);

				if (oldValue === null) {
					return;
				}

				var newValue = RESResearchOptionsMigrate.updateValue(oldValue, valueOrFunction);

				try {
					RESResearchUtils.setOption(newModuleID, newOptionName, newValue);
				} catch (e) {
					console.error('Couldn\'t migrate (' + e + '; arguments were ' + Array.prototype.join.call(arguments, ', ') + ')');
				}
			}
		},
		specific: {
			nightModeOn: function(value) {
				return value === 'dark';
			},
			subredditStylesWhitelist: function(value) {
				var parsedValue = safeJSON.parse(value);
				return parsedValue.join(',');
			},
			colorCommentScore: function(value) {
				return value ? 'automatic' : 'none';
			}
		}
	},

	migrate: function() {
		var startMigrationAt = RESResearchOptionsMigrate.getMigrationStartIndex();
		if (typeof startMigrationAt !== "undefined") {
			var migrationVersions = RESResearchOptionsMigrate.getVersionNumbers();
			for (var i = startMigrationAt, length = migrationVersions.length; i < length; i++) {
				var currentMigration = RESResearchOptionsMigrate.migrations[i];
				currentMigration.go();
				RESResearchOptionsMigrate.setLastMigratedVersion(currentMigration.versionNumber);
			}
		}
	},

	getMigrationStartIndex: function() {
		var lastMigratedVersion = RESResearchOptionsMigrate.getLastMigratedVersion();
		if (lastMigratedVersion !== false) {

			var startIndex = 0;

			if (typeof lastMigratedVersion === "string") {
				// Already ran migrations up to and including lastMigratedVersion
				// Start at the migration directly following
				var migrationVersions = RESResearchOptionsMigrate.getVersionNumbers();
				startIndex = migrationVersions.indexOf(lastMigratedVersion) + 1;
			}

			return startIndex;
		}
	},
	getLastMigratedVersion: function() {
		// Returns a string like "4.5.0.1" (the last migration run), null (no migrations run yet), or false (do not run migratoins)

		var RESResearchOptionsVersion = RESResearchStorage.getItem('RESResearchOptionsVersion');

		if (RESResearchOptionsVersion !== null) {
			// Migration has run before; verify/sanitize the version number

			if (RESResearchOptionsMigrate.getVersionNumbers().indexOf(RESResearchOptionsVersion) === -1) {
				// abort, abort!  probably downgraded
				console.warn("Couldn't find a migration matching RESResearchOptionsVersion = " + RESResearchOptionsVersion);
				RESResearchOptionsVersion = false;
			} else {
				// RESResearchOptionsVersion is a valid migration version number
			}
		} else {
			// New install, no migrations necessary
			RESResearchOptionsVersion = false;
		}

		return RESResearchOptionsVersion;
	},
	setLastMigratedVersion: function(value) {
		RESResearchStorage.setItem("RESResearchOptionsVersion", value);
	},

	getVersionNumbers: function() {
		return this.migrations.map(function(migration) { return migration.versionNumber; });
	},

	// this function compares a given option value to its "former default" -- the default
	// before an attempted migration. Options aren't always a string, so equivalency won't
	// work.  Note that "option" needs to be the actual option object, NOT option.value
	//
	// NOTE: this function may need to be updated for things like objects, etc. Currently
	// it'll only work on string / array.
	optionMatchesFormerDefaultValue: function(option, formerDefaultValue) {
		var oldValue = option.value;

		// keyCodes once customized also save metaKey in a 5th index, but we used
		// to not store the metakey, so they have a length of 4 by default. In order
		// to do a proper array comparison, we need the lengths to match, so if a
		// 5th element is not present, push false into the array.
		if ((option.type === 'keycode') && (option.value.length === 4)) {
			oldValue.push(false);
		}

		// check if the oldValue differs from the former default value. If it doesn't,
		// then the user set something custom and we should honor that.
		//
		// if it's an array, it's not as simple as just variable comparison.
		if (Array.isArray(formerDefaultValue)) {
			// compare arrays, if they're not the same, abort since the arrays aren't equal.
			if (formerDefaultValue.length !== oldValue.length) {
				return false;
			}
			for (var i = 0, len = formerDefaultValue.length; i < len; i++) {
				if (formerDefaultValue[i] !== oldValue[i]) {
					return false;
				}
			}
		} else if (formerDefaultValue !== oldValue) {
			// skip migration, the user set custom settings that aren't the default.
			return false;
		}

		return true;
	},

	updateValue: function(oldValue, valueOrFunction) {
		var newValue;
		if (typeof valueOrFunction === "function") {
			newValue = valueOrFunction(oldValue);
		} else if (typeof valueOrFunction !== "undefined") {
			newValue = valueOrFunction;
		} else {
			newValue = oldValue;
		}

		return newValue;
	}
};