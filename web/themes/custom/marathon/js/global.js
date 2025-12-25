(function (Drupal, once) {
  Drupal.behaviors.hideArticleDateByTid = {
    attach: function (context, settings) {
      // Use "once" to ensure this only runs once per context
      once('hide-article-date', '#edit-tid', context).forEach(function (select) {
        // Function to hide/show article-date
        function toggleArticleDate() {
          const value = select.value;
          const dates = context.querySelectorAll('.article-date');

          if (value === '3' || value === '4' || value === '5') {
            dates.forEach(d => d.classList.add('hidden'));
          } else {
            dates.forEach(d => d.classList.remove('hidden'));
          }
        }

        // Listen for change
        select.addEventListener('change', toggleArticleDate);

        // Run on attach to respect current selection
        toggleArticleDate();
      });
    }
  };
})(Drupal, once);
