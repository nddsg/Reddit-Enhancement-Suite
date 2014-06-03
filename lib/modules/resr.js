modules['resr'] = {
	moduleID: 'resr',
	moduleName: 'resr',
	category: 'Research',
	disabledByDefault: true,
	description: 'Send <a href="http://bitcoin.org/" target="_blank">bitcoin</a> to other redditors via ' +
		'<a href="/r/bitcointip" target="_blank">bitcointip</a>. <br><br> For more information, ' +
		'visit <a href="/r/bitcointip" target="_blank">/r/bitcointip</a> or <a href="/13iykn" target="_blank">read the documentation</a>.',
	options: {
		postvote: {
			name: 'Track Post Votes',
			type: 'boolean',
			value: 'true',
			description: 'Send data about the reddit posts that you vote on.'
		},
		attachButtons: {
			name: 'Add "tip bitcoins" Button',
			type: 'boolean',
			value: true,
			description: 'Attach "tip bitcoins" button to comments'
		},
		hide: {
			name: 'Hide Bot Verifications',
			type: 'boolean',
			value: true,
			description: 'Hide bot verifications'
		},
		status: {
			name: 'Tip Status Format',
			type: 'enum',
			values: [{
				name: 'detailed',
				value: 'detailed'
			}, {
				name: 'basic',
				value: 'basic'
			}, {
				name: 'none',
				value: 'none'
			}],
			value: 'detailed',
			description: 'Tip status - level of detail'
		},
		currency: {
			name: 'Preferred Currency',
			type: 'enum',
			values: [{
				name: 'BTC',
				value: 'BTC'
			}, {
				name: 'USD',
				value: 'USD'
			}, {
				name: 'JPY',
				value: 'JPY'
			}, {
				name: 'GBP',
				value: 'GBP'
			}, {
				name: 'EUR',
				value: 'EUR'
			}],
			value: 'USD',
			description: 'Preferred currency units'
		},
		balance: {
			name: 'Display Balance',
			type: 'boolean',
			value: true,
			description: 'Display balance'
		},
		subreddit: {
			name: 'Display Enabled Subreddits',
			type: 'boolean',
			value: false,
			description: 'Display enabled subreddits'
		},
		address: {
			name: 'Known User Addresses',
			type: 'table',
			addRowText: '+add address',
			fields: [{
				name: 'user',
				type: 'text'
			}, {
				name: 'address',
				type: 'text'
			}],
			value: [
				/* ['skeeto', '1...'] */
			],
			description: 'Mapping of usernames to bitcoin addresses'
		},
		fetchWalletAddress: {
			text: 'Search private messages',
			description: "Search private messages for bitcoin wallet associated with the current username." + "<p>You must be logged in to search.</p>" + "<p>After clicking the button, you must reload the page to see newly-found addresses.</p>",
			type: 'button',
			callback: null // populated when module loads
		}
	},
	isEnabled: function() {
		return RESConsole.getModulePrefs(this.moduleID);
	},
	include: [
		/^https?:\/\/([a-z]+)\.reddit\.com\/[\?]*/i
	],
	exclude: [
		/^https?:\/\/([a-z]+)\.reddit\.com\/[\?]*\/user\/bitcointip\/?/i
	],
	isMatchURL: function() {
		return RESUtils.isMatchURL(this.moduleID);
	},
	beforeLoad: function() {

	},

	go: function() {
		if (!this.isEnabled() || !this.isMatchURL()) {
			return;
		}

		if (this.options.postvote.value) {
			RESUtils.watchForElement('siteTable', modules['resr'].registerPostVoteHook());
		}
	},

	save: function save() {
		var json = JSON.stringify(this.options);
		RESStorage.setItem('RESoptions.resr', json);
	},

	load: function load() {
		var json = RESStorage.getItem('RESoptions.resr');
		if (json) {
			this.options = JSON.parse(json);
		}
	},

	registerPostVoteHook: function registerPostVoteHook(){
    // Bind to the click of the arrows.
    $('.arrow.up, .arrow.upmod, .arrow.down, .arrow.downmod').not('resr-processed').addClass('resr-processed').click(function(e) {
      // Identify the variables
      var parent = $(this).closest('.thing');
      var linkType = parent.hasClass('comment') ? 'comment' : 'article';
      if (linkType == 'article') {
        article = parent;
        comment = $(); // An empty jQuery object
      }
      else {
        article = $('#siteTable .thing').first();
        comment = parent;
      }

      // Get Article data
      var articleLA = article.attr('data-fullname') || '';
      var articleScore = article.find('.score.unvoted').first().text().split(' ')[0] || '0';
      var articleUps = article.attr('data-ups') || '0';
      var articleDowns = article.attr('data-downs') || '0';
      var articleComments = article.find('li.first a.comments').first().text().split(' ')[0] || '0';
      var articleOP = article.find('a.author').first().text() || '';
      var articleOPtime = article.find('time').first().attr('datetime') || '';
      var linkSubreddit = article.find('a.subreddit.hover.may-blank').first().text() || '';

      // Get Comment data
      var commentLA = comment.attr('data-fullname') || '';
      var commentScore = comment.find('.score.unvoted').first().text().split(' ')[0] || '0';
      var commentUps = comment.attr('data-ups') || '0';
      var commentDowns = comment.attr('data-downs') || '0';
      var commentComments = comment.find('.thing.comment').length || '0';
      var commentOP = comment.find('a.author').first().text() || '';
      var commentOPtime = comment.find('time').first().attr('datetime') || '';

      // voteType is one of the following values:
      //   0 - downvote
      //   1 - upvote
      //   u - undo upvote
      //   d - undo downvote
      // Identifying the voteType may seem backwards in the following code,
      // but it is correct.  It is only because of the order in which the code
      // is executed that it seems reversed.  The classes have already been
      // changed *before* we can inspect them, so our logic is adjusted.
      var voteType =
        $(this).hasClass('up')      ? 'u' : // The up vote was undone.
        $(this).hasClass('upmod')   ? '1' : // The up vote was made.
        $(this).hasClass('down')    ? 'd' : // The down vote was undone.
        $(this).hasClass('downmod') ? '0' : // The down vote was made.
        'X'; // Error

      $.post("https://dsg1.crc.nd.edu/resr/vote.php", {
        user: RESUtils.loggedInUser(),
        currentSubreddit: RESUtils.currentSubreddit(),
        linkSubreddit: linkSubreddit,
        voteType: voteType,
        linkType: linkType,
        articleLA: articleLA,
        articleScore: articleScore,
        articleUps: articleUps,
        articleDowns: articleDowns,
        articleComments: articleComments,
        articleOP: articleOP,
        articleOPtime: articleOPtime,
        commentLA: commentLA,
        commentScore: commentScore,
        commentUps: commentUps,
        commentDowns: commentDowns,
        commentComments: commentComments,
        commentOP: commentOP,
        commentOPtime: commentOPtime,
      });
    });
	}
};
