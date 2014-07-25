addModule('contribute', function(module, moduleID) {
	module.moduleName = 'Donate and Contribute';
	module.category = 'About RES';
	module.sort = -4;
	module.alwaysEnabled = true;

	RESTemplates.load('contributeRESResearchPanel', function(template) {
		module.description = template.html();
	});
});


addModule('about', function(module, moduleID) {
	module.moduleName = 'About RES Research';
	module.category = 'About RES Research';
	module.sort = -3;
	module.alwaysEnabled = true;

	RESTemplates.load('aboutRESResearchPanel', function(template) {
		module.description = template.html();
	});
});
