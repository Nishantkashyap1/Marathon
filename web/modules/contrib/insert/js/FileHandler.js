(function(Drupal) {
  'use strict';

  const SELECTORS = {
    description: 'input[name$="[description]"]',
    filename: 'input.insert-filename',
  };

  /**
   * The File Handler handles insertion of non-image files, e.g. provided by a
   * File field.
   **/
  Drupal.insert.FileHandler = class extends Drupal.insert.Handler {
    constructor(container, widgetSetting, selectors, wrapper) {
      super(container, widgetSetting, selectors || SELECTORS, wrapper);
    }
  };

})(Drupal);