/**
 * toc-scrollable.js
 *    Make the page's table of contents scrollable
 *  'TocScrollable' :Externally visible application name
 */

;(function(global) {

  let toc_scrollable = global.TocScrollable || {};
  global.TocScrollable = toc_scrollable;

  let APP = toc_scrollable;
  let self = APP;

  /**
   * basic settings -------------------------------------------------------------------------------
   */
  let config = {
    scroll_target: null,  // scroll target(It depends on the browser)
    sample_headings: ['h1', 'h2', 'h3','h4', 'h5', 'h6'],
    search_headings: new Array(),
  };

  /**
   * Decide scroll target in browser judgment -----------------------------------------------------
   */
  if (navigator.userAgent.toLowerCase().match(/webkit|msie 5/)) {
    if(navigator.userAgent.indexOf('Chrome') != -1){  // Webkit system（Safari, Chrome, iOS）
      config.scroll_target = document.documentElement;  // Chrome
    } else {
      config.scroll_target = document.body;  // Other than Chrome
    }
  } else {
    config.scroll_target = document.documentElement;  //IE (6 or more), Firefox, Opera
  }
  
  /**
   * Operation target -----------------------------------------------------------------------------
   */
  let app_target = {
    toc_area: null,
    target_headings: null,
    headings_map: new Map(),
    anchors: null,
    selected_anchors: null
  };

  /**
   * Application options --------------------------------------------------------------------------
   */
  APP.settings = {
    level: 2, 
    scroll_offset: 10,             // Page scroll adjustment value.
    detection_offset: 120,          // Headline detection range on the page.
    hidden_item_detect_offset: 20, // Detect hidden items in TOC box.
    toc_scroll_offset: 100,        // TOC scroll adjustment value
    target_section: null,          // Wrapper around the page header
    toc: null,                     // Table of contents location
    toc_anchor: '.anchor',         // Table of contents list tag class name
    mark: 'scrollable',            // class name of event added anchor
    class_current: 'current',      // class name of current anchor
    counter: null
  };
  
  let settings = APP.settings;

  /**
   * Application internal methods -----------------------------------------------------------------
   */

  // Get Page's Heading's NodeList (in order from top of page).
  let get_page_headings = function(area) {
    let elems, query;
    query = config.search_headings.map(function(item) {
      return area + ' ' + item;
    }).join(',');
    elems = document.querySelectorAll(query);
    return elems;
  };

  // Create Map of {#id, absolute position of heading} from NodeList of page Heading.
  let set_headings_map = function(headings) {
    let map = new Map();
    for (let i=0; i<headings.length; i++) {
      let elem, elem_id, pos;
      elem = headings[i];   // Get the element of Heading you want to scroll.
      pos = get_abspos(elem);
      elem_id = '#' + headings[i].getAttribute('id');
      map.set(elem_id, pos);
    }
    return map;
  };

  // Get the Heading's absolute coordinates from Page TOP considering the scroll.
  let get_abspos = function(elem) {
    let rect, abs_rect; 
    rect = elem.getBoundingClientRect();
    abs_rect = rect.top + window.pageYOffset;
    return abs_rect;
  };

  // Get a NodeList for each anchor in the table of contents.
  let get_toc_anchors = function(settings) {
    let set = settings;
    let anchors;
    let query = set.toc + ' ' + set.toc_anchor;
    anchors = document.querySelectorAll(query);
    return anchors;
  };

  // Add classes only to target TOC items.
  let mark_selected_anchors = function(target, mark) {
    let anchors = target.anchors;
    let map = target.headings_map;
    let href;
    for (let i=0; i<anchors.length; i++) {
      key = anchors[i].firstChild.getAttribute('href');
      if (map.has(key)) {
        anchors[i].classList.add(mark);
      }
    }
  };

  // Among the anchors of the table of contents get the node of scroll target (scrollable class).
  let get_selected_anchors = function(target, settings) {
    let set = settings;
    let anchors;
    let query = set.toc + ' .' + set.mark;
    anchors = document.querySelectorAll(query);
    return anchors;
  };

  /**
   * Assign an event to the selected anchor. ------------------------------------------------------
   */
  let set_anchor_event = function(anchors) {
    for (let i=0; i<anchors.length; i++) {
      let link, hash;
      link = anchors[i].firstChild;
      hash = link.getAttribute('href'); // Get in-page links.
      link.addEventListener('click', function (event) {
        let pos = 0;
        pos = app_target.headings_map.get(hash)
        scroll_to_top(pos);
        event.preventDefault();
      })
    }
  };

  let scroll_to_top = function(position) {
    let pos = position - self.settings.scroll_offset;
    global.scrollTo({
      top: pos,
      behavior: "smooth"
    });
  };

  /** 
   * Color the relevant lines of the table of contents as you scroll. -----------------------------
  */

  // Color change of back of where you are in the table of contents.
  let add_toc_style = function(key, anchors) {
      let result = {};
    let diff = 0;
    let s_offset = self.settings.toc_scroll_offset;
    let d_offset = self.settings.hidden_item_detect_offset;
    let current_class = settings.class_current; // class name of current anchor
    for (let i=0; i<anchors.length; i++) {
      let link = anchors[i].firstChild;
      let hash = link.getAttribute('href');
      if (key == hash) {
        init_toc_style(anchors, current_class);
        // Add a class to the current anchor.
        anchors[i].classList.add(current_class);
        // Adjust if the anchor in operation is not visible
        result = anchor_visible_or(anchors[i]);
        if (result.bottom_visible < d_offset) {  /* hidden-item-detect-offset */
          diff = (-(result.bottom_visible) + s_offset);
          scroll_anchor(diff);
        }
        if (result.top_visible < d_offset) {
          diff = (result.top_visible - s_offset);
          scroll_anchor(diff);
        }
      }
    }
  };

  // Initialize the color of each line of the table of contents.
  let init_toc_style = function(anchors, current_class) {
    for (let i=0; i<anchors.length; i++) {
      anchors[i].classList.remove(current_class);
    }
  };

  // Scroll up or down the table of contents area. 
  let scroll_anchor = function(diff) {
    let toc = app_target.toc_area;
    toc.scrollBy({
      top: diff,
      left: 0,
      behavior: "smooth"
    });
  };

  /**
   * Returns the difference between the bottom position of the table of contents area 
   * and the position of the anchor in operation. If the number is negative, the anchor is not visible.
   */
  let anchor_visible_or = function(anchor) {
    let anchor_rect = get_abspos(anchor);
    let tocbox = app_target.toc_area;
    let box_rect = get_abspos(tocbox);
    let bottom_pos = box_rect + tocbox.clientHeight;
    return {bottom_visible: (bottom_pos - anchor_rect), top_visible: (anchor_rect - box_rect)};
  }

  // Get window scroll amount.
  window.onscroll = function() {
    let match_rect = 0;
    let anchors = app_target.selected_anchors;
    let pos = Math.floor( config.scroll_target.scrollTop );  // Enter the scroll position.
    if (self.settings.counter) {
      self.settings.counter.innerHTML = pos;
    }
    match_rect = pos + self.settings.detection_offset;
    for (let [key, value] of app_target.headings_map) {
      if ((value > pos) && (value < match_rect)) {
        add_toc_style(key, anchors);
      }
    }
  };


  /**
   * Set and run ----------------------------------------------------------------------------------
   */
  APP.config = function(opts) {
    let set = self.settings;
    set = Object.assign(set, opts)
    config.search_headings = config.sample_headings.splice(0, set.level);
    app_target.toc_area = document.getElementById(settings.toc.slice(1));
    app_target.target_headings = get_page_headings(set.target_section);
    app_target.headings_map = set_headings_map(app_target.target_headings);
    app_target.anchors = get_toc_anchors(set);
    mark_selected_anchors(app_target, set.mark);
    app_target.selected_anchors = get_selected_anchors(app_target, set);

    self.run();
  };

  APP.run = function() {
    let target = app_target.selected_anchors;
    set_anchor_event(target);
  }

})(window);

