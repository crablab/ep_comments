describe("ep_comments_page - Comment Reply", function(){
  //create a new pad with comment before each test run
  beforeEach(function(cb){
    helper.newPad(function() {
      chooseToShowComments(true, function() {
        createComment(function() {
          // make sure Etherpad has enough space to display comments
          $('#iframe-container iframe').css("max-width", "1000px");
          cb();
        });
      });
    });
    this.timeout(60000);
  });

  after(function(cb) {
    // undo what was done on before()
    $('#iframe-container iframe').css("max-width", "");
    cb();
  });

  xit("Ensures a comment can be replied", function(done) {
    createReply(false, function(){
      done();
    });
  });

  xit("Ensures a comment reply can have suggestion", function(done) {
    createReply(true, function(){
      var outer$ = helper.padOuter$;
      var $replySuggestion = outer$(".comment-changeTo-form");
      expect($replySuggestion.is(":visible")).to.be(true);
      done();
    });
  });

  xit("Clears the comment reply form after submitting a reply with suggestion", function(done) {
    createReply(true, function(){
      var outer$ = helper.padOuter$;
      var $replyForm = outer$("form.new-comment");
      var $replyField = $replyForm.find(".comment-content");
      var $replyWithSuggestionCheckbox = $replyForm.find(".suggestion-checkbox");
      var $replySuggestionTextarea = $replyForm.find(".to-value");
      expect($replyField.text()).to.be("");
      expect($replyWithSuggestionCheckbox.is(":checked")).to.be(false);
      expect($replySuggestionTextarea.text()).to.be("");
      done();
    });
  });

  xit("Replaces the original text with reply suggestion", function(done) {
    createReply(true, function(){
      var inner$ = helper.padInner$;
      var outer$ = helper.padOuter$;

      // click to accept suggested change of the reply
      var $replyAcceptChangeButton = outer$(".sidebar-comment-reply .comment-changeTo-form input[type='submit']")[0];
      $replyAcceptChangeButton.click();

      // check the pad text
      var $firstTextElement = inner$("div").first();
      // cake waitFor
      helper.waitFor(function(){
        console.log($firstTextElement.text())
        return $firstTextElement.text() === "My suggestion";
      });
      expect($firstTextElement.text()).to.be("My suggestion");

      done();
    });
  });

  xit("Replaces the original text with reply suggestion after replacing original text with comment suggestion", function(done) {
    createReply(true, function(){
      var inner$ = helper.padInner$;
      var outer$ = helper.padOuter$;

      // click to accept suggested change of the original comment
      var $commentAcceptChangeButton = outer$(".sidebar-comment .comment-changeTo-form input[type='submit']").first();
      $commentAcceptChangeButton.click();

      // click to accept suggested change of the reply
      var $replyAcceptChangeButton = outer$(".sidebar-comment-reply .comment-changeTo-form input[type='submit']");
      $replyAcceptChangeButton.click();

      // check the pad text
      var $firstTextElement = inner$("div").first();
      expect($firstTextElement.text()).to.be("My suggestion");

      done();
    });
  });

  var createComment = function(callback) {
    var inner$ = helper.padInner$;
    var outer$ = helper.padOuter$;
    var chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    var $firstTextElement = inner$("div").first();

    // simulate key presses to delete content
    $firstTextElement.sendkeys('{selectall}'); // select all
    $firstTextElement.sendkeys('{del}'); // clear the first line
    $firstTextElement.sendkeys('This content will receive a comment'); // insert text

    // get the comment button and click it
    $firstTextElement.sendkeys('{selectall}'); // needs to select content to add comment to
    var $commentButton = chrome$(".addComment");
    $commentButton.click();

    // fill the comment form and submit it
    var $commentField = chrome$("textarea.comment-content");
    $commentField.val("My comment");
    var $hasSuggestion = outer$(".suggestion-checkbox");
    $hasSuggestion.click();
    var $suggestionField = outer$("textarea.to-value");
    $suggestionField.val("Change to this suggestion");
    var $submittButton = chrome$(".comment-buttons input[type=submit]");
    $submittButton.click();

    // wait until comment is created and comment id is set
    helper.waitFor(function() {
      return getCommentId() !== null;
    })
    .done(callback);
  }

  var createReply = function(withSuggestion, callback){
    var outer$ = helper.padOuter$;
    var commentId = getCommentId();
    var existingReplies = outer$(".sidebar-comment-reply").length;

    // if comment icons are enabled, make sure we display the comment box:
    if (commentIconsEnabled()) {
      // click on the icon
      var $commentIcon = outer$("#commentIcons #icon-"+commentId).first();
      $commentIcon.click();
    }

    // fill reply field
    var $replyField = outer$(".comment-content");
    $replyField.val("My reply");

    // fill suggestion
    if (withSuggestion) {
      // show suggestion field
      var $replySuggestionCheckbox = outer$(".suggestion-checkbox");
      $replySuggestionCheckbox.click();

      // fill suggestion field
      var $suggestionField = outer$("textarea.to-value");
      $suggestionField.val("My suggestion");
    }

    // submit reply
    var $submitReplyButton = outer$("form.new-comment input[type='submit']").first();
    $submitReplyButton.click();

    // wait for the reply to be saved
    helper.waitFor(function() {
      return outer$(".sidebar-comment-reply").length === existingReplies + 1;
    })
    .done(callback);
  }

  var getCommentId = function() {
    helper.waitFor(function(){
      var inner$ = helper.padInner$;
      if(inner$) return true;
    }).done(function(){
      var inner$ = helper.padInner$;
      var comment = inner$(".comment").first();
      var cls = comment.attr('class');
      var classCommentId = /(?:^| )(c-[A-Za-z0-9]*)/.exec(cls);
      var commentId = (classCommentId) ? classCommentId[1] : null;
      return commentId;
    });
  }

  var chooseToShowComments = function(shouldShowComments, callback) {
    var chrome$ = helper.padChrome$;

    //click on the settings button to make settings visible
    var $settingsButton = chrome$(".buttonicon-settings");
    $settingsButton.click();

    //check "Show Comments"
    var $showComments = chrome$('#options-comments')
    if ($showComments.is(':checked') !== shouldShowComments) $showComments.click();

    // hide settings again
    $settingsButton.click();

    callback();
  }

  var commentIconsEnabled = function() {
    return helper.padOuter$("#commentIcons").length > 0;
  }

});
