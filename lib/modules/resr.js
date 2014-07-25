// Based on Java's hashCode() function.
String.prototype.resrHashCode = function(){
  var hash = 0;
  for (var i = 0; i < this.length; i++) {
    hash = ((hash << 5) - hash) + this.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

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
  URL : 'http://resresearch.org/vote.php',
	moduleID : 'resr',
	moduleName : 'RESR',
	category : 'Research',
	alwaysEnabled : true,
	description : '<h2>Informed Consent Form</h2>'
    + '<h3>Purpose of the Study:</h3>'
    + '<p>This is a study in computational social science that is being conducted by Dr. Tim Weninger, assistant professor of Computer Science and Engineering at University of Notre Dame in Notre Dame, Indiana. The purpose of this study is to examine the how the presentation of online content shapes user opinions and online behavior.</p>'
    + '<h3>What will be done:</h3>'
    + '<p>If, and only if, you choose to opt-in to the study, a module within the reddit enhancement suite will report certain aspects of your reddit usage to the study administrators automatically. The information to be reported is customizable by the user, but, at most, will contain information about your votes, and clicks on reddit.com within the Reddit Enhancement Suite plugin. Your username will be anonymized via a one-way hash function and will be assigned a random number before analysis begins. Thus, it will be impossible for even the study administrators to match your username with your actions. Furthermore, in keeping with the reddit tradition of fierce anonymization we will never, ever, collect or ask for personal information.</p>'
    + '<p>At the conclusion of the survey, we will perform analysis to explore how the presentation of information influences voting and other behavior.</p>'
    + '<h3>Benefits of this Study:</h3>'
    + '<p>You will be contributing to knowledge about behavior in online social news spaces, especially in the determination of the role that the herd effect, the “hivemind”, vote spamming, and other influencers play in opinion formation and online behavior.</p>'
    + '<h3>Risks or discomforts:</h3>'
    + '<p>No risks or discomforts are anticipated from taking part in this study.</p>'
    + '<h3>Confidentiality:</h3>'
    + '<p>Your responses will be kept completely confidential. We will NOT record your IP address, nor will we record your username. The source code of the module is open source and plainly available at the RES Github repository or by examining your browser’s javascript environment. The data will be stored on privately-owned computer systems that are protected by very strict firewall and state of the art security measures.</p>'
    + '<h3>Decision to quit at any time:</h3>'
    + '<p>Your participation is voluntary, and is strictly opt-in; if you chose to opt-in, you are free to withdraw your participation from this study at any time by deactivating the RESR module.</p>'
    + '<h3>How the findings will be used:</h3>'
    + '<p>The results of the study will be used for scholarly purposes only. The results from the study will be presented in educational settings and at professional conferences, and the results might be published in a professional journal in the field of sociology and/or computer science.</p>'
    + '<h3>Contact information:</h3>'
    + '<p>If you have concerns or questions about this study, please contact Dr. Tim Weninger at <a href="mailto:tweninge@nd.edu">tweninge@nd.edu</a> or the University of Notre Dame Institutional Review Board at <a href="mailto:compliance@nd.edu">compliance@nd.edu</a>. This research is sponsored the the Air Force Office of Scientific Research.</p>'
    + '<p>By beginning the survey, you acknowledge that you have read this information and agree to participate in this research, with the knowledge that you are free to withdraw your participation at any time without penalty.</p>',


  /*
  '<p><em>RESR</em> is a research project overseen by the Data Science Group of the University of Notre Dame.  We are attempting to better understand social websites such as Reddit through the cooperation of users like you.  By enabling <em>RESR</em>, you help us to assemble our dataset by contributing information about your interactions with Reddit.</p>'
    + '<h2>What we are interested in</h2>'
    + '<p>We are not focused on <em>you</em>, but rather on the content of Reddit.  When you vote on something, we want to know what page it appeared on when you saw it, how many up votes and down votes that it had, how many comments it had, etc.  By enabling <em>RESR</em>, you take part in the resarch.</p>'
    + '<p>We are interested in two types of information: Votes and Navigation.  When you vote, the plugin sends information about the post to our server, where it is then added to our data set.  The plugin also lets us know about some of the links that you click on in Reddit, and where that link appeared in the page.  Information about the current page you are on (for example, the current subreddit and how you got to that page) is also included.</p>'
    + '<h2>What we are not collecting</h2>'
    + '<p>First and foremost, we want to make it clear that we are not trying to track you like some other less savory companies out there.  We do not collect your username.  We do not collect your IP address.  We do not collect information about your computer.  We will not even know what timezone or country you are in.  This research is not about individuals, but about the content of Reddit.</p>'
    + '<h2>If you are worried about privacy...</h2>'
    + '<p>First, remember that this is a completely voluntary, opt-in action.  If you don\'t turn on <em>RESR</em>, then it doesn\'t send us anything at all.  If you turn it on, then choose to turn it off, it turns back off.  We only want information from people who willingly share it with us for the sake of research.</p>'
    + '<p>Second, realize that many things that you do on Reddit are already publicly visible, from comments made to submissions added.  We are only trying to better understand the state of Reddit as you use it.</p>'
    + '<p>Lastly, we would like to remind you that the Internet is not as anonymous as many people think, and that there are many companies trying to learn about you without alerting you to their presence.  We are not like them, nor do we want to be.  While we do ask you to help us in our research, we will not do anything without your express consent, and we want to be upfront about what we are doing.</p>'
    + '<p>Thank you for your consideration, and we hope that you will choose to be a part of our research on Reddit!</p>',
  */
	options: {
		Consent: {
			name: 'I consent to participation in the RESResearch project',
			type: 'boolean',
			value: true,
			description: 'I consent to participation in the RESResearch project'
		},
	},
	isEnabled: function() {
    return true;
		return RESResearchConsole.getModulePrefs(this.moduleID);
	},
	include: [
		/^https?:\/\/([a-z]+)\.reddit\.com\/[\?]*/i
	],
	exclude: [
		/^https?:\/\/(?:[-\w\.]+\.)?reddit\.com\/ads\/[-\w\.\_\?=]*/i,
		/^https?:\/\/(?:[-\w\.]+\.)?reddit\.com\/[-\w\.\/]*\/submit\/?$/i
	],
	isMatchURL: function() {
		return RESResearchUtils.isMatchURL(this.moduleID);
	},
	beforeLoad: function() {

	},
  sendVotes: function() {
    return this.isEnabled() && this.options.Consent.value;
  },

	go: function() {
		if (!this.isEnabled() || !this.isMatchURL()) {
			return;
		}

    RESResearchUtils.watchForElement('siteTable', modules['resr'].registerPostVoteHook);
    RESResearchUtils.watchForElement('selfText', modules['resr'].registerPostVoteHook);
    RESResearchUtils.watchForElement('newComments', modules['resr'].registerPostVoteHook);

    modules['resr'].registerPostVoteHook();
	},

	save: function() {
		var json = JSON.stringify(this.options);
		RESResearchStorage.setItem('RESResearchoptions.resr', json);
	},

	load: function() {
		var json = RESResearchStorage.getItem('RESResearchoptions.resr');
		if (json) {
			this.options = JSON.parse(json);
		}
	},
  
  getUsernameHash : function() {
    if (typeof this.usernameHash == 'undefined') {
      this.usernameHash = RESResearchUtils.loggedInUser().resrHashCode();
      this.save();
    }
    return this.usernameHash;
  },
  
  parseStats: function(container) {
    return {
      LA : container.attr('data-fullname') || '',
      Rank : container.find('span.rank').first().text() || '',
      Score : container.find('.score.unvoted').first().text().split(' ')[0] || '0',
      Ups : container.attr('data-ups') || '0',
      Downs : container.attr('data-downs') || '0',
      Comments : container.find('li.first a.comments').first().text().split(' ')[0] || container.find('.thing.comment').length || '0',
      OP : container.find('a.author').first().text() || '',
      OPtime : container.find('time').first().attr('datetime') || '',
      Sponsored : (container.find('.sponsored-tagline').length > 0) ? '1' : '0',
      Domain : container.find('span.domain a').first().text() || '',
      LinkFlairLabel : container.find('span.linkflairlabel').first().text() || '',
      LinkFlair : container.find('span.flair').first().text() || '',
      linkSubreddit : container.find('a.subreddit.hover.may-blank').first().text() || '',
    };
  },
  
  reportNavigation: function(linkLocation, type, element) {
    if (!this.sendVotes()) {
      return;
    }
    var d = new Date();
    $.ajax({
      url : modules['resr'].URL,
      type : 'post',
      async : false,
      data : {
        api : '0.1',
        type : 'navigation',
        linkLocation : linkLocation,
        linkType : type,
        user : modules['resr'].getUsernameHash(),
        currentSubreddit : RESResearchUtils.currentSubreddit(),
        target : $(element).attr('href'),
        referrer : document.referrer,
        current : $(location).attr('href'),
        timezone : d.getTimezoneOffset(),
        lang : $('html').first().attr('lang') || ''
      }
    });
  },
  
  reportClick: function(type, parent) {
    if (!this.sendVotes()) {
      return;
    }
    var data = this.parseStats(parent);
    var d = new Date();
    $.ajax({
      url : modules['resr'].URL,
      type : 'post',
      async : false,
      data : {
        api : '0.1',
        type : 'link',
        user : modules['resr'].getUsernameHash(),
        currentSubreddit : RESResearchUtils.currentSubreddit(),
        linkSubreddit : data.linkSubreddit,
        linkType : type,
        articleLA : data.LA,
        articleRank : data.Rank,
        articleScore : data.Score,
        articleUps : data.Ups,
        articleDowns : data.Downs,
        articleComments : data.Comments,
        articleOP : data.OP,
        articleOPtime : data.OPtime,
        articleSponsored : data.Sponsored,
        articleDomain : data.Domain,
        articleLinkFlairLabel : data.LinkFlairLabel,
        articleLinkFlair : data.LinkFlair,
        current : $(location).attr('href'),
        referrer : document.referrer,
        timezone : d.getTimezoneOffset(),
        lang : $('html').first().attr('lang') || ''
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
    // Click: Image (Single)
    $('body').on('click', '.thing a.toggleImage:not(.gallery)', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('selfTextImage', e.timeStamp)) {
        var type = ele.toggleClass('resr-expanded').hasClass('resr-expanded') ? 'imageExpand' : 'imageCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Image Gallery
    $('body').on('click', '.thing a.toggleImage.gallery', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('selfTextImageGallery', e.timeStamp)) {
        var type = ele.toggleClass('resr-expanded').hasClass('resr-expanded') ? 'galleryExpand' : 'galleryCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Image Gallery Previous Button
    $('body').on('click', '.thing .RESGalleryControls a.previous', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('selfTextImageGalleryPrevious', e.timeStamp)) {
        mod.reportClick('galleryPrevious', ele.closest('.thing'));
      }
    });
    // Click: Image Gallery Next Button
    $('body').on('click', '.thing .RESGalleryControls a.next', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('selfTextImageGalleryNext', e.timeStamp)) {
        mod.reportClick('galleryNext', ele.closest('.thing'));
      }
    });
    // Click: Video
    $('body').on('click', '.thing div.video', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('selfTextVideo', e.timeStamp)) {
        var type = ele.toggleClass('resr-expanded').hasClass('resr-expanded') ? 'videoExpand' : 'videoCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Selftext
    $('body').on('click', '.thing div.selftext', function(e){
      var ele = $(this);
      if (ele.resrFloodAllow('selfText', e.timeStamp)) {
        var type = ele.toggleClass('resr-expanded').hasClass('resr-expanded') ? 'textExpand' : 'textCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Comments
    $('.thing ul li a.comments').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('comments', $(this).closest('.thing'));
    });
    // Click: Share
    $('body').on('click', '.thing li.share a:first', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('share', e.timeStamp)) {
        mod.reportClick('share', ele.closest('.thing'));
      }
    });
    /*
    $('.thing ul li.share a.option').first().not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('share', $(this).closest('.thing'));
    });
    */
    // Click: Unshare
    $('body').on('click', '.thing li.share a:last', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('unshare', e.timeStamp)) {
        mod.reportClick('unshare', ele.closest('.thing'));
      }
    });
    /*
    $('.thing ul li.share a.option').last().not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('shareCancel', $(this).closest('.thing'));
    });
    */
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
    // Note: Because of how singleClick is written, we must bind to mousedown
    // instead of click.
    $('body').on('mousedown', '.thing span.redditSingleClick', function(e) {
      var ele = $(this);
      if (ele.resrFloodAllow('singleClick', e.timeStamp)) {
        mod.reportClick('singleClick', $(this).closest('.thin'));
      }
    });
    // Click: siteTable_organic Prev
    $('#siteTable_organic .nextprev button.prev').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('organicPrev', $('#siteTable_organic .thing:visible'));
    });
    // Click: siteTable_organic Next
    $('#siteTable_organic .nextprev button.next').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportClick('organicNext', $('#siteTable_organic .thing:visible'));
    });

    // Navigation: Trending Subreddits
    $('.trending-subreddits-content li a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportNavigation('trending', $(this).text(), this);
    });
    // Navigation: Trending Subreddits - Comments
    $('.trending-subreddits-content a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportNavigation('trending', 'comments', this);
    });
    // Navigation: Tabs
    $('ul.tabmenu a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      mod.reportNavigation('tab', $(this).text(), this);
    });

    // Click: More Comments
    $('.thing span.morecomments a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      if (!mod.sendVotes()) {
        return;
      }
      var parent = $(this).closest('.thing').parent().closest('.thing');
      var linkType = 'moreComments';
      var article = mod.parseStats($('#siteTable .thing').first());
      var comment = mod.parseStats(parent);

      var d = new Date();
      $.post(modules['resr'].URL, {
        api : '0.1',
        type : 'vote',
        user : modules['resr'].getUsernameHash(),
        currentSubreddit : RESResearchUtils.currentSubreddit(),
        linkSubreddit : article.linkSubreddit,
        voteType : 'c',
        linkType : linkType,
        articleLA : article.LA,
        articleRank : article.Rank,
        articleScore : article.Score,
        articleUps : article.Ups,
        articleDowns : article.Downs,
        articleComments : article.Comments,
        articleOP : article.OP,
        articleOPtime : article.OPtime,
        articleSponsored : article.Sponsored,
        articleDomain : article.Domain,
        articleLinkFlairLabel : article.LinkFlairLabel,
        articleLinkFlair : article.LinkFlair,
        commentLA : comment.LA,
        commentScore : comment.Score,
        commentUps : comment.Ups,
        commentDowns : comment.Downs,
        commentComments : comment.Comments,
        commentOP : comment.OP,
        commentOPtime : comment.OPtime,
        current : $(location).attr('href'),
        referrer : document.referrer,
        timezone : d.getTimezoneOffset(),
        lang : $('html').first().attr('lang') || ''
      });
    });
    // Click: All Other Links
    //$('a').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
    //  mod.reportClick('link: ' + ($(this).attr('href').replace('/http(s)+:\/\/www\.reddit\.com\//g', '') || ''), $('#siteTable .thing').length == 1 ? $('#siteTable .thing') : $());
    //});
    
    // Bind to the click of the arrows.
    $('.arrow.up, .arrow.upmod, .arrow.down, .arrow.downmod').not('.resr-processed').addClass('resr-processed').resrClickFirst(function(e) {
      if (!mod.sendVotes()) {
        return;
      }
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
      //   c - load more comments (not used in this section)
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

      var d = new Date();
      $.post(modules['resr'].URL, {
        api : '0.1',
        type : 'vote',
        user : modules['resr'].getUsernameHash(),
        currentSubreddit : RESResearchUtils.currentSubreddit(),
        linkSubreddit : article.linkSubreddit,
        voteType : voteType,
        linkType : linkType,
        articleLA : article.LA,
        articleRank : article.Rank,
        articleScore : article.Score,
        articleUps : article.Ups,
        articleDowns : article.Downs,
        articleComments : article.Comments,
        articleOP : article.OP,
        articleOPtime : article.OPtime,
        articleSponsored : article.Sponsored,
        articleDomain : article.Domain,
        articleLinkFlairLabel : article.LinkFlairLabel,
        articleLinkFlair : article.LinkFlair,
        commentLA : comment.LA,
        commentScore : comment.Score,
        commentUps : comment.Ups,
        commentDowns : comment.Downs,
        commentComments : comment.Comments,
        commentOP : comment.OP,
        commentOPtime : comment.OPtime,
        current : $(location).attr('href'),
        referrer : document.referrer,
        timezone : d.getTimezoneOffset(),
        lang : $('html').first().attr('lang') || ''
      });
    });
	}
};
