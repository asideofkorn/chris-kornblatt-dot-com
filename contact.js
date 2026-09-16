/* Assembles the email address at runtime so the full string never appears in
   the served HTML. Without JavaScript the address is still readable on the
   page, just written out in words rather than as a live mailto link. */
(function () {
  var links = document.querySelectorAll('a[data-email-user]');

  Array.prototype.forEach.call(links, function (link) {
    link.setAttribute('href', 'mailto:' +
      link.getAttribute('data-email-user') + '@' +
      link.getAttribute('data-email-domain') + '.' +
      link.getAttribute('data-email-tld'));
  });
})();
