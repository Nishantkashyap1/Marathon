(function (Drupal) {
  'use strict';

  /**
   * Returns whether a provided editor element is the one to be synced by
   * Insert.
   * @param {ckeditor.Element} element
   * @param {string} syncId
   * @returns {boolean}
   */
  function isSyncedElement(element, syncId) {
    if (element.getAttribute('dataInsertAttach')) {
      const attach = JSON.parse(element.getAttribute('dataInsertAttach'));

      if (attach.id === syncId) {
        return true;
      }
    }

    for (const key of element.getAttributeKeys()) {
      const attribute = element.getAttribute(key);
      const attributes = attribute.attributes;

      if (!attributes || !attributes['data-insert-attach']) {
        continue;
      }

      const attach = JSON.parse(attributes['data-insert-attach']);

      if (attach.id === syncId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Base class for handling content types, that is building the content to be
   * inserted as per content type, e.g. image or (non-image) file.
   */
  Drupal.insert.Handler = class {

    /**
     * Selectors for accessing input elements of the field Insert is attached
     * to.
     * @type {{[key: string]: string}}
     * @protected
     */
    _selectors;

    /**
     * The HTML element Insert is initialized on.
     * @type {HTMLFieldSetElement}
     * @protected
     */
    _container;

    /**
     * Insert widget settings.
     * @type {object}
     * @protected
     */
    _settings;

    /**
     * @type {HTMLElement}
     */
    #wrapper;

    /**
     * @type {HTMLButtonElement}
     */
    #button;

    /**
     * The button overlay allows hover events over the button in disabled
     * state. The overlay is used only when the button is disabled and is used
     * to highlight invalid components when hovering the button.
     * @type {HTMLSpanElement|undefined}
     * @protected
     */
    _buttonOverlay;

    /**
     * @param {HTMLFieldSetElement} container
     * @param {object} widgetSettings
     * @param {{[key: string]: string}} selectors
     * @param {HTMLElement} wrapper
     */
    constructor(container, widgetSettings, selectors, wrapper) {
      this._container = container;
      this._settings = widgetSettings || {};
      this._selectors = selectors;
      this.#wrapper = wrapper || container.parentElement;
      this.#button = container.querySelector('.insert-button');

      this.#connectSelectors();
    }

    /**
     * Attaches the "input" event to this handler's selectors for updating
     * attached values of inserted elements
     */
    #connectSelectors() {
      Object.values(this._selectors).forEach(selector => {
        this.#wrapper
          .querySelector(selector)?.addEventListener('input', () => {
          this.#update();
        });
      });
    }

    /**
     * @returns {string}
     */
    buildContent() {
      return this._attachValues(this.#getTemplate());
    }

    /**
     * Returns the template for the currently selected insert style.
     * @returns {string}
     */
    #getTemplate() {
      const style = this._container.querySelector('.insert-style').value;
      return this._container
        .querySelector('input.insert-template[name$="[' + style + ']"]').value;
    }

    /**
     * Attaches attributes and content according to data-insert-attach
     * definition.
     * @param {string} template
     * @returns {string}
     * @protected
     */
    _attachValues(template) {
      const values = this.#aggregateValues();
      const tempContainer = document.createElement('div');

      tempContainer.innerHTML = template;
      tempContainer.querySelectorAll('[data-insert-attach]').forEach(element => {
        this.#setValues(element, values);
      });

      return tempContainer.innerHTML;
    }

    /**
     * Updates all registered textareas and editors with the current values
     * managed by this Handler instance.
     */
    #update() {
      const syncId = this.#button.dataset.insertId;

      if (syncId === undefined) {
        return;
      }

      const values = this.#aggregateValues();

      Drupal.insert.FocusManager.textareas.forEach(textarea => {
        this.#updateTextarea(textarea, syncId, values);
      });

      Drupal.insert.FocusManager.editors.forEach(editor => {
        this.#updateEditor(editor, syncId);
      });
    }

    /**
     * Updates a particular textarea with a set of values.
     * @param {HTMLTextAreaElement} textarea
     * @param {string} syncId
     * @param {{[key: string]: string}} values
     */
    #updateTextarea(textarea, syncId, values) {
      const temp = document.createElement('div');
      temp.innerHTML = textarea.value;

      const elements = this.#findByAttachmentId(temp, syncId);

      if (elements.length) {
        elements.forEach(element => {
          this.#setValues(element, values);
        });
        textarea.value = temp.innerHTML;
      }
    }

    /**
     * Finds attachments for a specific syncId.
     * @param {HTMLElement} dom
     * @param {string} syncId
     * @returns {HTMLElement[]}
     */
    #findByAttachmentId(dom, syncId) {
      const attachments = [];

      dom.querySelectorAll('[data-insert-attach]').forEach(element => {
        const insertAttach = JSON.parse(element.dataset.insertAttach);

        if (insertAttach.id === syncId) {
          attachments.push(element);
        }
      });

      return attachments;
    }

    /**
     * Updates a particular editor with a set of values.
     * @param {ckeditor.Editor} editor
     * @param {string} syncId
     */
    #updateEditor(editor, syncId) {
      editor.model.change(writer => {
        writer.model.document.getRoot();

        const elements = Drupal.insert.Manager.findDescendants(
          writer.model.document.getRoot(),
          element => isSyncedElement(element, syncId)
        );

        elements.forEach(element => {
          const elementToReplace = element.is('element')
            ? element
            : element.parent;

          const position = writer.createPositionAfter(elementToReplace);
          const viewFragment = editor.data.processor
            .toView(this.buildContent());
          const modelFragment = editor.data.toModel(viewFragment);

          // Updating an element that is already inserted, it might have
          // received some alterations of attributes, i.e. aligning an image.
          // Therefore, any missing attributes are just copied over to the new
          // replacement element.
          const childNode = modelFragment.getNodeByPath([0]);
          for (const [key, value] of elementToReplace.getAttributes()) {
            if (!childNode.hasAttribute(key)) {
              childNode._setAttribute(key, value);
            }
          }

          writer.model.insertContent(modelFragment, position);
          writer.remove(elementToReplace);
        });
      });
    }

    /**
     * Sets attributes and/or content on a node according to its
     * data-insert-attach definition.
     * @param {HTMLElement} element
     * @param {{[key: string]: string}} values
     * @returns {HTMLElement}
     */
    #setValues(element, values) {
      const attach = JSON.parse(element.dataset.insertAttach || null);

      this.#setAttributes(element, values, attach);
      this.#setContent(element, values, attach);

      return element;
    }

    /**
     * @param {HTMLElement} element
     * @param {{[key: string]: string}} values
     * @param {object} attach
     */
    #setAttributes(element, values, attach) {
      if (!attach?.attributes) {
        return;
      }
      
      for (const [attributeName, keys] of Object.entries(attach.attributes)) {
        for (const key of keys) {
          if (!values[key]) {
            continue;
          }

          if (values[key] === '') {
            element.removeAttribute(attributeName);
          } else {
            element.setAttribute(attributeName, values[key]);
          }

          break;
        }
      }
    }

    /**
     * @param {HTMLElement} element
     * @param {{[key: string]: string}} values
     * @param {object} attach
     */
    #setContent(element, values, attach) {
      if (!attach?.content) {
        return;
      }

      for (const key of attach.content) {
        if (values[key]) {
          element.innerText = values[key];
          break;
        }
      }
    }

    /**
     * Returns all values gathered using this._selectors.
     * @returns {{[key: string]: string}}
     */
    #aggregateValues() {
      const values = {};
      const fieldDataWrapper = this._container.parentNode;

      Object.entries(this._selectors).forEach(([key, selector]) => {
        var value = fieldDataWrapper.querySelector(selector)?.value;
        values[key] = value ? this.#htmlEntities(value) : value;
      });

      return values;
    }

    /**
     * @param {string} string
     * @returns {string}
     */
    #htmlEntities(string) {
      return string
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    /**
     * Toggles disabled state of the insert button.
     * @param {boolean} disable
     * @protected
     */
    _disable(disable) {
      const wrapper = this._container
        .querySelector('.insert-button-wrapper');
      const button = wrapper.querySelector('.insert-button');

      if (disable) {
        const overlay = document.createElement('span');
        overlay.classList.add('insert-button-overlay');
        wrapper.appendChild(overlay);
        wrapper.removeChild(button);
        overlay.appendChild(button);

        button.setAttribute('disabled', 'true');
      } else {

        const overlay = wrapper.querySelector('.insert-button-overlay');

        if (!overlay) {
          return;
        }

        overlay.removeChild(button);
        wrapper.removeChild(overlay);
        wrapper.appendChild(button);

        button.removeAttribute('disabled');
      }
    }
  }

})(Drupal);