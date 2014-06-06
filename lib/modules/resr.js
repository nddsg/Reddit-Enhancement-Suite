// Function to set the resr click bindings first
$.fn.resrClickFirst = function(handler) {
  // Maintain chainability.
  return this.each(function() {
    // Ensures a handler is run before any other registered handlers,
    // independent of the order in which they were bound.
    var self = $(this);
    if (typeof self[0] != 'undefined') {
      self.unbind('click', handler);
      self.bind('click', handler);

      var events = $._data(self[0]).events;
      var registered = events['click'];
      registered.unshift(registered.pop());

      events['click'] = registered;
    }
  });
};

// Function to move javascript onClick event to jQuery click bindings
$.fn.resrOnclickMove = function() {
  return this.each(function() {
    var events = $._data($(this)[0], "events");
    var stored = $(this).attr('onclick');
    if (stored != null && stored != '') {
      $(this).removeAttr('onclick');
      $(this).click(stored);
    }
  });
}

// Simple flood control mechanism that only allows a message from an element
// once a second.
$.fn.resrFloodAllow = function(message, timestamp) {
  var time = $(this).data('flood:' + message);
  if (time != timestamp) {
    $(this).data('flood:' + message, timestamp);
    return true;
  }
  return false;
};

$.fn.resrIsFirst = function() {
  if (typeof $(this).data('resr:visited') == 'undefined') {
    $(this).data('resr:visited', true);
    return true;
  }
  return false;
}

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
		/^https?:\/\/(?:[-\w\.]+\.)?reddit\.com\/ads\/[-\w\.\_\?=]*/i,
		/^https?:\/\/(?:[-\w\.]+\.)?reddit\.com\/[-\w\.\/]*\/submit\/?$/i
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
			RESUtils.watchForElement('siteTable', modules['resr'].registerPostVoteHook);
			RESUtils.watchForElement('selfText', modules['resr'].registerPostVoteHook);
			RESUtils.watchForElement('newComments', modules['resr'].registerPostVoteHook);
		}
    modules['resr'].registerPostVoteHook();
	},

	save: function() {
		var json = JSON.stringify(this.options);
		RESStorage.setItem('RESoptions.resr', json);
	},

	load: function() {
		var json = RESStorage.getItem('RESoptions.resr');
		if (json) {
			this.options = JSON.parse(json);
		}
	},
  
  parseStats: function(container) {
    return {
      LA : container.attr('data-fullname') || '',
      Score : container.find('.score.unvoted').first().text().split(' ')[0] || '0',
      Ups : container.attr('data-ups') || '0',
      Downs : container.attr('data-downs') || '0',
      Comments : container.find('li.first a.comments').first().text().split(' ')[0] || container.find('.thing.comment').length || '0',
      OP : container.find('a.author').first().text() || '',
      OPtime : container.find('time').first().attr('datetime') || '',
      Sponsored : (container.find('.sponsored-tagline').length > 0) ? '1' : '0',
      Domain : container.find('span.domain a').first().text() || '',
      LinkFlairLabel : container.find('span.linkflairlabel').first().text() || '',
      linkSubreddit : container.find('a.subreddit.hover.may-blank').first().text() || '',
    };
  },
  
  reportClick: function(type, parent) {
    console.log(Date.now());
    console.log(type);
    var data = this.parseStats(parent);
    $.ajax({
      url : "https://dsg1.crc.nd.edu/resr/vote.php",
      type : 'post',
      async : false,
      data : {
        api : '0.1',
        type : 'link',
        user : RESUtils.loggedInUser(),
        currentSubreddit : RESUtils.currentSubreddit(),
        linkSubreddit : data.linkSubreddit,
        linkType : type,
        articleLA : data.LA,
        articleScore : data.Score,
        articleUps : data.Ups,
        articleDowns : data.Downs,
        articleComments : data.Comments,
        articleOP : data.OP,
        articleOPtime : data.OPtime,
        articleSponsored : data.Sponsored,
        current : $(location).attr('href'),
        referrer : document.referrer
      }
    });
  },

	registerPostVoteHook: function() {
    var mod = modules['resr'];
    
    // Bind to various links on the page.
    // Click: Title
    $('.thing p.title a.title').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('title', $(this).closest('.thing'));
    });
    // Click: Thumbnail
    $('.thing a.thumbnail').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('thumbnail', $(this).closest('.thing'));
    });
    // Click: Domain
    $('.thing p.title span.domain a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('domain', $(this).closest('.thing'));
    });
    // Click: Author
    $('.thing p.tagline a.author').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('author', $(this).closest('.thing'));
    });
    // Click: Subreddit
    $('.thing p.tagline a.subreddit').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('subreddit', $(this).closest('.thing'));
    });
    // Click: Image
    $('.thing a.toggleImage').not('.resr-processed').addClass('resr-processed').click(function(e) {
      mod.reportClick($(this).parent().find('div.madeVisible:visible').length > 0 ? 'imageExpand' : 'imageCollapse', $(this).closest('.thing'));
    });
    // Click: Video
    $('.thing div.video').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      var type = (!$(this).hasClass('expanded')) || $(this).resrIsFirst() ? 'videoExpand' : 'videoCollapse';
      mod.reportClick(type, $(this).closest('.thing'));
    });
    // Click: Selftext
    $('.thing div.selftext').not('.resr-processed').addClass('resr-processed').click(function(e) {
      var type = $(this).hasClass('collapsed') || ($(this).parent().find('div.expando span.error').length > 0) ? 'textExpand' : 'textCollapse';
      mod.reportClick(type, $(this).closest('.thing'));
    });
    // Click: Comments
    $('.thing ul li a.comments').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('comments', $(this).closest('.thing'));
    });
    // Click: Share
    $('.thing ul li.share a.option').first().not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('share', $(this).closest('.thing'));
    });
    // Click: Unshare
    $('.thing ul li.share a.option').last().not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('shareCancel', $(this).closest('.thing'));
    });
    // Click: Saved/Unsaved
    $('.thing ul li.link-save-button a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      var parent = $(this).closest('.thing');
      mod.reportClick(parent.hasClass('saved') ? 'unsaved' : 'saved', parent);
    });
    // Click: Hide
    $('.thing form.hide-button a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('hide', $(this).closest('.thing'));
    });
    // Click: Report - Initial
    $('.thing form.report-button span.option.main a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('reportInitial', $(this).closest('.thing'));
    });
    // Click: Report - Confirm
    $('.thing form.report-button span.option.error a.yes').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('reportConfirm', $(this).closest('.thing'));
    });
    // Click: Report - Cancel
    $('.thing form.report-button span.option.error a.no').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('reportCancel', $(this).closest('.thing'));
    });
    // Click: Single Click
    $('.thing span.redditSingleClick').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('singleClick', $(this).closest('.thing'));
    });
    // Click: siteTable_organic Prev
    $('#siteTable_organic .nextprev button.prev').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('organicPrev', $('#siteTable_organic .thing:visible'));
    });
    // Click: siteTable_organic Next
    $('#siteTable_organic .nextprev button.next').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('organicNext', $('#siteTable_organic .thing:visible'));
    });
    // Click: Trending Subreddits
    $('.trending-subreddits-content a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      'trending';
      $(this).text() || '';
    });
    // Click: More Comments
    $('.thing span.morecomments a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('moreComments', $(this).closest('.thing'));
    });
    // Click: All Other Links
    //$('a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
    //  mod.reportClick('link: ' + ($(this).attr('href').replace('/http(s)+:\/\/www\.reddit\.com\//g', '') || ''), $('#siteTable .thing').length == 1 ? $('#siteTable .thing') : $());
    //});
    
    // Bind to the click of the arrows.
    $('.arrow.up, .arrow.upmod, .arrow.down, .arrow.downmod').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      // Identify the variables
      var parent = $(this).closest('.thing');
      var article, comment;
      var linkType = parent.hasClass('comment') ? 'comment' : 'article';
      if (linkType == 'article') {
        article = mod.parseStats(parent);
        comment = mod.parseStats($()); // An empty jQuery object
      }
      else {
        article = mod.parseStats($('#siteTable .thing').first());
        comment = mod.parseStats(parent);
      }

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
        api : '0.1',
        type : 'vote',
        user : RESUtils.loggedInUser(),
        currentSubreddit : RESUtils.currentSubreddit(),
        linkSubreddit : article.linkSubreddit,
        voteType : voteType,
        linkType : linkType,
        articleLA : article.LA,
        articleScore : article.Score,
        articleUps : article.Ups,
        articleDowns : article.Downs,
        articleComments : article.Comments,
        articleOP : article.OP,
        articleOPtime : article.OPtime,
        articleSponsored : article.Sponsored,
        articleDomain : article.Domain,
        articleLinkFlairLabel : article.LinkFlairLabel,
        commentLA : comment.LA,
        commentScore : comment.Score,
        commentUps : comment.Ups,
        commentDowns : comment.Downs,
        commentComments : comment.Comments,
        commentOP : comment.OP,
        commentOPtime : comment.OPtime,
        current : $(location).attr('href'),
        referrer : document.referrer
      });
    });
	}
};
