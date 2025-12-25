(function (Drupal) {
  Drupal.behaviors.bodyClassFromUrl = {
    attach: function (context, settings) {
      const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');

      if (!path) return;

      const className = path.replace(/\//g, '-');
      document.body.classList.add(className);
    }
  };
})(Drupal);
