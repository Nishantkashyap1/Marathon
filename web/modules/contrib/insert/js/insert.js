(function(Drupal, drupalSettings) {
  'use strict';

  /**
   * @type {Drupal.insert.Inserter[]}
   */
  const registry = [];

  /**
   * Behavior to add "Insert" buttons.
   */
  Drupal.behaviors.insert = {};
  Drupal.behaviors.insert.attach = function(context) {

    if (!drupalSettings.insert) {
      return;
    }

    Drupal.insert.FocusManager = new Drupal.insert.Manager();

    // Populate the Focus Manager registry
    // Add all editors instantiated at the moment when the Insert module code
    // is loaded.

    Drupal.CKEditor5Instances?.forEach(editor => {
      Drupal.insert.FocusManager.addEditor(editor);
    });

    document.querySelectorAll('textarea').forEach(textarea => {
      Drupal.insert.FocusManager.addTextarea(textarea);
    });

    // Initialize Inserter managing content insertion
    context.querySelectorAll('.insert').forEach(element => {
      if (
        !element.hasChildNodes()
        || registry.find(inserter => inserter.container === element)
      ) {
        return;
      }

      const insertType = element.dataset.insertType;

      registry.push(
        new Drupal.insert.Inserter(
          element,
          new Drupal.insert[insertType === 'image'
            ? 'ImageHandler'
            : 'FileHandler'
          ](
            element,
            drupalSettings.insert.widgets[insertType]
          )
        ),
      );
    });
  };

})(Drupal, drupalSettings);
