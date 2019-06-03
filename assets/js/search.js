/**
 * search.js --- logic for site search.
 */

//  ---------------------------------------------------------------------------------------------
// utility function for search. 
(function(w) {
  let reRegExp = /[\\^$.*+?()[\]{}|]/g;
  let reHasRegExp = new RegExp(reRegExp.source);

  function escapeRegExp(string) {
    return (string && reHasRegExp.test(string))
        ? string.replace(reRegExp, '\\$&')
        : string;
  }

  function queryReplace(target, query, flag, repchar) {
    return target.replace(new RegExp(query, flag), repchar);
  }

  w.escapeRegExp = escapeRegExp;
  w.queryReplace = queryReplace;
})(window);

// ---------------------------------------------------------------------------------------------
// search logic
(function(w) {

  let lunrIndex, $search_results, pagesIndex;

  // Initialize search logic
  function initLunr() {
    $.getJSON("/Febris/search_data.json").done(function(index) {
        pagesIndex = index;
        lunrIndex = lunr(function() {
          let lunrConfig = this;
          lunrConfig.use(lunr.multiLanguage('en', 'jp'));
          lunrConfig.ref("url");
          lunrConfig.field("title", { boost: 10 });
          lunrConfig.field("contents");
          pagesIndex.forEach(function(page, index) {
            $.extend(page, { "id": index })
            lunrConfig.add(page);
          });

        });
      })
    .fail(function(jqxhr, textStatus, error) {
      let err = textStatus + ", " + error;
      console.error("Error getting index flie:", err);
    });
  }

  // Global function siteSearch
  function search(){
    $search_results = $("#search-results");
    $search_results.empty();
    let query = document.getElementById('search-query').value;
    if (query.length < 2) {
      return;
    }
    renderResults(results(query), query);
  }
  
  w.siteSearch = search;

  function results(query) {
    return lunrIndex.search(`*${query}*`).map(function(result) {
      return pagesIndex.filter(function(page) {
        return page.url === result.ref;
      })[0];
    });
  }

  function renderResults(results, query_str) {
    let query = query_str;
    
    if (!results.length) {
      $search_results.append('<p class="no-match">No matches found</p>');
      return;
    }

    // console.log(results.length + " documents match!");
    $search_results.append($('<p class="match-count"><span class="count">' + results.length + '</span> Documents match!</p>'));

    results.forEach(function(result) {
      // make escaped query
      let escaped_query = escapeRegExp(query);
      
      // generate list item and some temporary variable
      let result_list = $('<li class="match-item">');
      let href, href_inner, replaced_title, replaced_contents, contents_inner;

      // replace post title
      replaced_title = queryReplace(result.title, escaped_query, 'ig', '<mark>$&</mark>');
      href_inner = $("<span>").append(replaced_title);

      // generate title link
      href = $("<a>", {
        href: result.url,
      });
      href.append($(href_inner));

      result_list.append(href);
    
      // replace post contents
      replaced_contents = "";
      if (result.contents.length <= 100) {
        replaced_contents = result.contents;
      } else {
        replaced_contents = result.contents.slice(0, 100) + " ...";
      }
      replaced_contents = queryReplace(replaced_contents, escaped_query, 'ig', '<mark>$&</mark>');
      contents_inner = $("<p>").append(replaced_contents);
      result_list.append(contents_inner);

      $search_results.append(result_list);
    })
  }

  // reset form
  function reset() {
    alert('Reset the search results. Is it OK?');
    $search_results.empty();
  }
  window.searchReset = reset;

  initLunr();

})(window);



