$("document").ready(function(){
  $(".raw-data").hide();
  var stickyNav = $("nav").offset().top;
  $(window).scroll(function() {
    if ($(window).scrollTop() > stickyNav){
      $("nav").addClass("sticky");
    }
    else {
      $("nav").removeClass("sticky");
    }
  });
  $(".moveTo").on("click", function(){
    var clicked = $(this).attr('href');
    scrolling(clicked);
    return false;
  });
  function scrolling(clicked) {
    $('html, body').animate({
      scrollTop: $(clicked).offset().top - 80
    }, 100);
  }

  $(".get-raw-data").on("click", function(){
    $(".raw-data").fadeIn();
    return false;
  });
  $(".close").on("click", function(){
    $(".raw-data").fadeOut();
    return false;
  });

  // ---- For Bar Charts ---- //
  // ---------SCROLL--------- //
  (function($) {
    /**
     * Copyright 2012, Digital Fusion
     * Licensed under the MIT license.
     * http://teamdf.com/jquery-plugins/license/
     *
     * @author Sam Sehnert
     * @desc A small plugin that checks whether elements are within
     *     the user visible viewport of a web browser.
     *     only accounts for vertical position, not horizontal.
     */
    $.fn.visible = function(partial) {

        var $t            = $(this),
            $w            = $(window),
            viewTop       = $w.scrollTop(),
            viewBottom    = viewTop + $w.height(),
            _top          = $t.offset().top,
            _bottom       = _top + $t.height(),
            compareTop    = partial === true ? _bottom : _top,
            compareBottom = partial === true ? _top : _bottom;

      return ((compareBottom <= viewBottom) && (compareTop >= viewTop));

    };

  })(jQuery);

  var win = $(window);

  var allMods = $(".chart-graphic");

  allMods.each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      // console.log("already-visible");
    }
  });

  //preloaderMap sets the height of the map so DOM if fixed
  //for proper anchor when share links like https://.../#Podcast
  preloaderMap();

  win.scroll(function(event) {

    allMods.each(function(i, el) {
      var el = $(el);
      if (el.visible(true)) {
        // el.addClass("come-in");
        var ID = $(el).attr('id');
        allBarCharts.check(ID);
      }
    });

  });
  // ---------SCROLL-END----- //

  win.resize(function() {
    preloaderMap();
    allMods.each(function(i, el) {
      var ID = $(el).attr('id');
      allBarCharts.resize(ID);
    });
  });

});
