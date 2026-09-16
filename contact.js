/* Assembles the email address at runtime so the full string never appears in
   the served HTML. Without JavaScript the address is still readable on the
   page, just written out in words rather than as a live mailto link. */
(function () {
  var links = document.querySelectorAll('a[data-email-user]');

  Array.prototype.forEach.call(links, function (link) {
    var address =
      link.getAttribute('data-email-user') + '@' +
      link.getAttribute('data-email-domain') + '.' +
      link.getAttribute('data-email-tld');

    link.setAttribute('href', 'mailto:' + address);

    var copy = document.querySelector('[data-email-copy]');
    if (!copy || !navigator.clipboard) return;

    copy.hidden = false;
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(address).then(function () {
        copy.textContent = 'Copied';
        window.setTimeout(function () {
          copy.textContent = 'Copy address';
        }, 2000);
      });
    });
  });
})();
