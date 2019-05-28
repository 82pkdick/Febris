;(function(global) {

// ===== Main namespace =====
if (typeof(global.$site) == 'undefined') {
  global.$site = {};
  global.$site.config = {};
}

global.$site.config = {
  baseurl: "",
  url:     "http://localhost:4000",
  port:     4000,
  host:    "127.0.0.1",
  
  // custom configurations
  title:   "Febris",
  description: "My Description. Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
  author_name: "82pkdick",
  author_email: "82pkdick@gmail.com",
  author_twitter: "82pkdick",
  author_github: "82pkdick",
};

})(window);

console.dir(window.$site.config);
