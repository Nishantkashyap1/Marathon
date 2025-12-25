(function (Drupal) {
  'use strict';

  const SELECTORS = {
    alt: 'input[name$="[alt]"], textarea[name$="[alt]"]',
    title: 'input[name$="[title]"], textarea[name$="[title]"]',
    description: 'input[name$="[description]"], textarea[name$="[description]"]'
  };

  /**
   * The names of the pseudo-styles that images may be inserted in without
   * having to specify the alternative text (if set to required).
   * @type {string[]}
   */
  const noAltTextInsertStyles = ['link'];

  Drupal.insert.ImageHandler = class extends Drupal.insert.FileHandler {

    /**
     * @type {HTMLInputElement}
     */
    #altField;

    /**
     * @type {HTMLSelectElement}
     */
    #insertStyle;

    /**
     * @type {Drupal.insert.Rotator}
     */
    #rotator;

    /**
     * @inheritDoc
     */
    constructor(container, widgetSettings, wrapper) {
      super(container, widgetSettings, SELECTORS, wrapper);

      this.#insertStyle = this._container.querySelector('.insert-style');

      const rotatorElement = this._container.querySelector('.insert-rotate');

      if (rotatorElement) {
        this.#rotator = new Drupal.insert.Rotator(
          rotatorElement,
          this._container.querySelector('.insert-templates'),
        );
      }

      this.#initAltField();
      this._disable(!this.#checkAltField());
    }

    /**
     * @inheritDoc
     * @param {string} template
     * @returns {string}
     */
    _attachValues(template) {
      template = super._attachValues(template);
      return this.#updateImageDimensions(template);
    }

    /**
     * Checks for a maximum dimension and scales down the width if necessary.
     * @param {string} template
     * @returns {string} Updated template
     */
    #updateImageDimensions(template) {
      const widthMatches = template.match(/width[ ]*=[ ]*"(\d*)"/i);
      const heightMatches = template.match(/height[ ]*=[ ]*"(\d*)"/i);

      if (
        this._settings.maxWidth
        && widthMatches && parseInt(widthMatches[1]) > this.settings.maxWidth
      ) {
        const insertRatio = this._settings.maxWidth / widthMatches[1];
        const width = this._settings.maxWidth;
        template = template
          .replace(/width[ ]*=[ ]*"?(\d*)"?/i, `width="${width}"`);

        if (heightMatches) {
          const height = Math.round(heightMatches[1] * insertRatio);
          template = template
            .replace(/height[ ]*=[ ]*"?(\d*)"?/i, `height="${height}"`);
        }
      }

      return template;
    }

    /**
     * Initializes the alternative text input element, if any.
     */
    #initAltField() {
      this.#altField = this._container.parentNode
        .querySelector(this._selectors.alt);

      // If no alt field is found, look for a description field as the
      // ImageHandler may be used to insert an image per file field.
      if (!this.#altField) {
        this.#altField = this._container.parentNode
          .querySelector(this._selectors.description);
      }

      if (!this.#altField) {
        return;
      }

      this.#altField.addEventListener('input', () => {
        this._disable(!this.#checkAltField());
      });

      this.#insertStyle.addEventListener('change', () => {
        this._disable(!this.#checkAltField());
      });
    }

    /**
     * Checks whether the alternative text configuration, its input and the
     * selected style allows the image to get inserted. For example, if the
     * alternative text is required, it may not be empty to allow inserting an
     * image, as long as the image shall not be inserted in the form of a
     * plain text link.
     * @returns {boolean}
     *   TRUE if alternative text configuration/input is valid, FALSE if not.
     */
    #checkAltField() {
      return !this.#altField
        || !this.#altField.getAttribute('required')
        || this.#altField.getAttribute('required')
          && this.#altField.value.trim() !== ''
        || noAltTextInsertStyles.includes(this.#insertStyle.value);
    }

    /**
     * @inheritDoc
     */
    _disable(disable) {
      super._disable(disable);

      const overlay = this._container
        .querySelector('.insert-button-overlay');

      if (overlay) {
        overlay.addEventListener('mouseover', () => {
          this.#altField.classList.add('insert-required');
        });

        overlay.addEventListener('mouseout', () => {
          this.#altField.classList.remove('insert-required');
        });
      }
    }

  }

})(Drupal);