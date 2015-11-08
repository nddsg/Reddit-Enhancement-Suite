// Based on Java's hashCode() function.
String.prototype.redditresearchHashCode = function(){
  var hash = 0;
  for (var i = 0; i < this.length; i++) {
    hash = ((hash << 5) - hash) + this.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Function to set the redditresearch click bindings first
$.fn.redditresearchClickFirst = function(handler) {
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
$.fn.redditresearchOnclickMove = function() {
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
$.fn.redditresearchFloodAllow = function(message, timestamp) {
  var time = $(this).data('flood:' + message);
  if (time != timestamp) {
    $(this).data('flood:' + message, timestamp);
    return true;
  }
  return false;
};

$.fn.redditresearchIsFirst = function() {
  if (typeof $(this).data('redditresearch:visited') == 'undefined') {
    $(this).data('redditresearch:visited', true);
    return true;
  }
  return false;
}

modules['redditresearch'] = {
  URL : 'https://dsg.nd.edu/rr/vote.php',
	moduleID : 'redditresearch',
	moduleName : 'RedditResearch',
	surveyCode: 'Determining Survey Code..',
	category : 'Research',
	alwaysEnabled : true,
	description : '<h2>Informed Consent Form</h2>'
    + '<h3>Purpose of the Study:</h3>'
    + '<p>This is a study in computational social science that is being conducted by Dr. Tim Weninger, assistant professor of Computer Science and Engineering at the University of Notre Dame in Notre Dame, Indiana. The purpose of this study is to examine how the presentation of online content shapes user opinions and online behavior.</p>'
    + '<h3>What will be done:</h3>'
    + '<p>If, and only if, you choose to opt-in to the study, this module will report certain aspects of your Reddit usage to the study administrators automatically. The information to be reported, at most, will contain information about your votes, and clicks and navigation within Reddit.com. Your username will be anonymized via a one-way hash function and will be assigned a random number before analysis begins. <em>It will be impossible for even the study administrators to match your username with your actions.</em> Furthermore, in keeping with the Reddit tradition of fierce anonymization, we will never, ever, collect or ask for personal information.</p>'
    + '<p>At the conclusion of the study, we will perform analysis to explore how the presentation of information influences voting and other behavior.</p>'
    + '<h3>Benefits of this Study:</h3>'
    + '<p>You will be contributing to knowledge about behavior in online social news spaces, especially in the determination of the role that the herd effect, the “hivemind”, vote spamming, and other influencers play in opinion formation and online behavior.</p>'
    + '<h3>Risks or discomforts:</h3>'
    + '<p>No risks or discomforts are anticipated from taking part in this study.</p>'
    + '<h3>Confidentiality:</h3>'
    + '<p>Your responses will be kept completely confidential. We will NOT record your IP address, nor will we record your username. The source code of the module is open source and plainly available at the RedditResearch Github repository or by examining your browser’s javascript environment. The data will be stored on privately-owned computer systems that are protected by very strict firewall and state of the art security measures.</p>'
    + '<h3>Decision to quit at any time:</h3>'
    + '<p>Your participation is voluntary, and is strictly opt-in; if you choose to opt-in, you are free to discontinue your participation from this study at any time by deactivating the RedditResearch module.</p>'
    + '<h3>How the findings will be used:</h3>'
    + '<p>The results of the study will be used for scholarly purposes only. The results from the study will be presented in educational settings and at professional conferences, and the results might be published in a professional journal in the field of sociology and/or computer science.</p>'
    + '<h3>Contact information:</h3>'
    + '<p>If you have concerns or questions about this study, please contact Dr. Tim Weninger at <a href="mailto:tweninge@nd.edu">tweninge@nd.edu</a> or the University of Notre Dame Institutional Review Board at <a href="mailto:compliance@nd.edu">compliance@nd.edu</a>. This research is sponsored by the Air Force Office of Scientific Research.</p>'
    + '<p>By beginning the study, you acknowledge that you have read this information and agree to participate in this research, with the knowledge that you are free to withdraw your participation at any time without penalty.</p>',
	options: {
		Consent: {
			name: 'I consent to participation in the RedditResearch project',
			type: 'boolean',
			value: true,
			description: 'I consent to participation in the RedditResearch project'
		},
	},
	isEnabled: function() {
		return RedditResearchConsole.getModulePrefs(this.moduleID);
	},
	include: [
		/^https?:\/\/([a-z]+)\.reddit\.com\/[\?]*/i
	],
	exclude: [
		/^https?:\/\/(?:[-\w\.]+\.)?reddit\.com\/ads\/[-\w\.\_\?=]*/i,
		/^https?:\/\/(?:[-\w\.]+\.)?reddit\.com\/[-\w\.\/]*\/submit\/?$/i
	],
	isMatchURL: function() {
		return RedditResearchUtils.isMatchURL(this.moduleID);
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

    RedditResearchUtils.watchForElement('siteTable', modules['redditresearch'].registerPostVoteHook);
    RedditResearchUtils.watchForElement('selfText', modules['redditresearch'].registerPostVoteHook);
    RedditResearchUtils.watchForElement('newComments', modules['redditresearch'].registerPostVoteHook);

    if (this.sendVotes()) {
      // Notify dsg.nd.edu/rr of a page load.
      var d = new Date();
      $.ajax({
        url : modules['redditresearch'].URL,
        type : 'post',
        async : false,
        data : {
          api : '0.1',
          type : 'pageload',
          user : modules['redditresearch'].getUsernameHash(),
          currentSubreddit : RedditResearchUtils.currentSubreddit(),
          url : document.URL,
          referrer : document.referrer,
          timezone : d.getTimezoneOffset(),
          lang : $('html').first().attr('lang') || ''
        }
      });
    }

    modules['redditresearch'].registerPostVoteHook();
	},

	save: function() {
		var json = JSON.stringify(this.options);
		RedditResearchStorage.setItem('RedditResearchoptions.redditresearch', json);
	},

	load: function() {
		var json = RedditResearchStorage.getItem('RedditResearchoptions.redditresearch');
		if (json) {
			this.options = JSON.parse(json);
		}
	},
  
  getUsernameHash : function() {
    if (typeof this.usernameHash == 'undefined') {
      this.usernameHash = RedditResearchUtils.loggedInUser().redditresearchHashCode();
      this.save();
    }
    return this.usernameHash;
  },
  
  
  updateSurveyCode : function(){
    user = RedditResearchUtils.loggedInUser();
		interimSurveyCodes = ['You need to be logged in to participate.','Determining Survey Code..','Sorry, you do not qualify for this HIT because your account is too new.'];
		
    if(interimSurveyCodes.indexOf(this.surveyCode) === -1){
      return;
    }
    else {
      $.get('/user/'+ RedditResearchUtils.loggedInUser() +'/', function(data){
        
      var accntcreated = (Date.parse($($.parseHTML(data)).find('time').attr('dateTime'))/1000);
      var today = Math.round(new Date().getTime()/1000);
      var weeks = (today - accntcreated)/60/60/24/7;
    
      var surveyCode = modules['redditresearch'].getUsernameHash().toString();
		  surveyCode = surveyCode.substr(1);
		
      if (weeks > 1) {
		    modules['redditresearch'].surveyCode = 'A' + surveyCode +'4';
          }
      else{
        modules['redditresearch'].surveyCode = 'Sorry, you do not qualify for this HIT because your account is too new.';
          }
      $('div.sCode').html('<h3> Survey Code: ' + modules['redditresearch'].surveyCode + '</h3> <p></p>');
          
      });
    }
    this.save()
    return;
      
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
      url : modules['redditresearch'].URL,
      type : 'post',
      async : false,
      data : {
        api : '0.1',
        type : 'navigation',
        linkLocation : linkLocation,
        linkType : type,
        user : modules['redditresearch'].getUsernameHash(),
        currentSubreddit : RedditResearchUtils.currentSubreddit(),
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
      url : modules['redditresearch'].URL,
      type : 'post',
      async : false,
      data : {
        api : '0.1',
        type : 'link',
        user : modules['redditresearch'].getUsernameHash(),
        currentSubreddit : RedditResearchUtils.currentSubreddit(),
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
    var mod = modules['redditresearch'];
    
    // Bind to various links on the page.
    // Click: Title
    $('.thing p.title a.title').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('title', $(this).closest('.thing'));
    });
    // Click: Thumbnail
    $('.thing a.thumbnail').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('thumbnail', $(this).closest('.thing'));
    });
    // Click: Domain
    $('.thing p.title span.domain a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('domain', $(this).closest('.thing'));
    });
    // Click: Author
    $('.thing p.tagline a.author').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('author', $(this).closest('.thing'));
    });
    // Click: Subreddit
    $('.thing p.tagline a.subreddit').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('subreddit', $(this).closest('.thing'));
    });
    
    
    // Click: Subscribe 
    $('span.fancy-toggle-button.subscribe-button.toggle a.option.add').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('subscribe', $(this).closest('.thing'));
    });
    // Click: Unsubscribe
    $('span.fancy-toggle-button.subscribe-button.toggle a.option.active.remove.login-required').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('unsubscribe', $(this).closest('.thing'));
    });
    $('span.fancy-toggle-button.subscribe-button.toggle a.option.remove.active').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('unsubscribe', $(this).closest('.thing'));
    });
    
    
    // Click: Image (Single)
    $('body').on('click', '.thing a.toggleImage:not(.gallery)', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('selfTextImage', e.timeStamp)) {
        var type = ele.toggleClass('redditresearch-expanded').hasClass('redditresearch-expanded') ? 'imageExpand' : 'imageCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Image Gallery
    $('body').on('click', '.thing a.toggleImage.gallery', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('selfTextImageGallery', e.timeStamp)) {
        var type = ele.toggleClass('redditresearch-expanded').hasClass('redditresearch-expanded') ? 'galleryExpand' : 'galleryCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Image Gallery Previous Button
    $('body').on('click', '.thing .RESGalleryControls a.previous', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('selfTextImageGalleryPrevious', e.timeStamp)) {
        mod.reportClick('galleryPrevious', ele.closest('.thing'));
      }
    });
    // Click: Image Gallery Next Button
    $('body').on('click', '.thing .RESGalleryControls a.next', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('selfTextImageGalleryNext', e.timeStamp)) {
        mod.reportClick('galleryNext', ele.closest('.thing'));
      }
    });
    // Click: Video
    $('body').on('click', '.thing div.video', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('selfTextVideo', e.timeStamp)) {
        var type = ele.toggleClass('redditresearch-expanded').hasClass('redditresearch-expanded') ? 'videoExpand' : 'videoCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Selftext
    $('body').on('click', '.thing div.selftext', function(e){
      var ele = $(this);
      if (ele.redditresearchFloodAllow('selfText', e.timeStamp)) {
        var type = ele.toggleClass('redditresearch-expanded').hasClass('redditresearch-expanded') ? 'textExpand' : 'textCollapse';
        mod.reportClick(type, ele.closest('.thing'));
      }
    });
    // Click: Comments
    $('.thing ul li a.comments').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('comments', $(this).closest('.thing'));
    });
    // Click: Share
    $('body').on('click', '.thing li.share a:first', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('share', e.timeStamp)) {
        mod.reportClick('share', ele.closest('.thing'));
      }
    });
    // Click: Unshare
    $('body').on('click', '.thing li.share a:last', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('unshare', e.timeStamp)) {
        mod.reportClick('unshare', ele.closest('.thing'));
      }
    });
    // Click: Saved/Unsaved
    $('.thing ul li.link-save-button a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      var parent = $(this).closest('.thing');
      mod.reportClick(parent.hasClass('saved') ? 'unsaved' : 'saved', parent);
    });
    // Click: Hide
    $('.thing form.hide-button a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('hide', $(this).closest('.thing'));
    });
    // Click: Report - Initial
    $('.thing form.report-button span.option.main a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('reportInitial', $(this).closest('.thing'));
    });
    // Click: Report - Confirm
    $('.thing form.report-button span.option.error a.yes').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('reportConfirm', $(this).closest('.thing'));
    });
    // Click: Report - Cancel
    $('.thing form.report-button span.option.error a.no').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('reportCancel', $(this).closest('.thing'));
    });
    // Click: Single Click
    // Note: Because of how singleClick is written, we must bind to mousedown
    // instead of click.
    $('body').on('mousedown', '.thing span.redditSingleClick', function(e) {
      var ele = $(this);
      if (ele.redditresearchFloodAllow('singleClick', e.timeStamp)) {
        mod.reportClick('singleClick', $(this).closest('.thin'));
      }
    });
    // Click: siteTable_organic Prev
    $('#siteTable_organic .nextprev button.prev').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('organicPrev', $('#siteTable_organic .thing:visible'));
    });
    // Click: siteTable_organic Next
    $('#siteTable_organic .nextprev button.next').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportClick('organicNext', $('#siteTable_organic .thing:visible'));
    });

    // Navigation: Trending Subreddits
    $('.trending-subreddits-content li a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportNavigation('trending', $(this).text(), this);
    });
    // Navigation: Trending Subreddits - Comments
    $('.trending-subreddits-content a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportNavigation('trending', 'comments', this);
    });
    // Navigation: Tabs
    $('ul.tabmenu a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      mod.reportNavigation('tab', $(this).text(), this);
    });

    // Click: More Comments
    $('.thing span.morecomments a').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
      if (!mod.sendVotes()) {
        return;
      }
      var parent = $(this).closest('.thing').parent().closest('.thing');
      var linkType = 'moreComments';
      var article = mod.parseStats($('#siteTable .thing').first());
      var comment = mod.parseStats(parent);

      var d = new Date();
      $.post(modules['redditresearch'].URL, {
        api : '0.1',
        type : 'vote',
        user : modules['redditresearch'].getUsernameHash(),
        currentSubreddit : RedditResearchUtils.currentSubreddit(),
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

    // Bind to the click of the arrows.
    $('.arrow.up, .arrow.upmod, .arrow.down, .arrow.downmod').not('.redditresearch-processed').addClass('redditresearch-processed').redditresearchClickFirst(function(e) {
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
      $.post(modules['redditresearch'].URL, {
        api : '0.1',
        type : 'vote',
        user : modules['redditresearch'].getUsernameHash(),
        currentSubreddit : RedditResearchUtils.currentSubreddit(),
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
