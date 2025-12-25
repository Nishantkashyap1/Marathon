(function(Drupal) {
  'use strict';

  /**
   * The Focus Manager keeps track of the CKEditor instances and text areas on
   * the page, including which of the elements is currently focused and was
   * previously focused to determine the target for an insertion operation.
   */
  class FocusManager {

    /**
     * Finds descending elements of a CKEditor model element according to a
     * predicate function looping through the provided element's descendants.
     * @param {ckeditor.Element} element
     * @param {(child: ckeditor.Element) => boolean} predicate
     * @returns {ckeditor.Element[]}
     */
    static findDescendants(element, predicate) {
      let elements = [];

      if (predicate(element)) {
        elements = [...elements, element];
      } else if (element.getChildren) {
        for (const child of element.getChildren()) {
          const childElements = this.findDescendants(child, predicate);
          if (childElements) {
            elements = [...elements, ...childElements];
          }
        }
      }

      return elements;
    }

    /**
     * Registry of the CKEditor instances tracked by the FocusManager
     * @type {ckeditor.Editor[]}
     */
    #editors;

    /**
     * Registry of the textareas tracked by the FocusManager
     * @type {HTMLTextAreaElement[]}
     */
    #textareas;

    /**
     * The current target for inserting.
     * @type {ckeditor.Editor|HTMLTextAreaElement|undefined}
     */
    #focusTarget;

    /**
     * The previous target used as a fallback when inserting while there is no
     * current target.
     * @type {ckeditor.Editor|HTMLTextAreaElement|undefined}
     */
    #previousFocusTarget;

    /**
     * The default target used when there has been no interaction with any
     * editor or textarea yet.
     * @type {ckeditor.Editor|HTMLTextAreaElement|undefined}
     */
    defaultTarget;

    constructor() {
      this.#editors = [];
      this.#textareas = [];

      this.init();
    }

    init() {
      const firstEditorElement= document.querySelector('.ck-editor__editable');

      this.defaultTarget = firstEditorElement
        ? firstEditorElement.ckeditorInstance
        : document.querySelector('textarea') || undefined;
    }

    /**
     * @returns {ckeditor.Editor[]}
     */
    get editors() {
      return this.#editors;
    }

    /**
     * @returns {HTMLTextAreaElement[]}
     */
    get textareas() {
      return this.#textareas;
    }

    /**
     * @param {ckeditor.Editor} editor
     */
    addEditor(editor) {
      if (!this.#editors.map(editor => editor.id).includes(editor.id)) {
        this.#attachEditorEvents(editor);
        this.#editors.push(editor);
      }
    }

    /**
     * @param {ckeditor.Editor} editor
     */
    #attachEditorEvents(editor) {
      editor.editing.view.document.on('change:isFocused', (event, data, isFocused) => {
        if (isFocused) {
          this.#focusTarget = editor;
        } else {
          this.#previousFocusTarget = editor;

          if (this.#focusTarget && this.#focusTarget.id === editor.id) {
            this.#focusTarget = undefined;
          }
        }
      });
    }

    /**
     * @param {HTMLTextAreaElement} textarea
     */
    addTextarea(textarea) {
      if (!this.#textareas.includes(textarea)) {
        this.#attachTextareaEvents(textarea);
        this.#textareas.push(textarea);
      }
    }

    /**
     * @param {HTMLTextAreaElement} textarea
     */
    #attachTextareaEvents(textarea) {
      textarea.addEventListener('focus', event => {
        this.#focusTarget = event.target;
      });

      textarea.addEventListener('blur', () => {
        this.#previousFocusTarget = textarea;

        if (this.#focusTarget && this.#focusTarget === textarea) {
          this.#focusTarget = undefined;
        }
      });
    }

    /**
     * Returns the best guessed target to insert content into.
     * @returns {ckeditor.Editor|HTMLTextAreaElement|undefined}
     */
    getTarget() {
      if (this.#focusTarget) {
        return this.#focusTarget;
      }

      if (this.#previousFocusTarget) {
        return this.#previousFocusTarget;
      }

      // Only return the default target if it is tracked by the focus manager
      if (this.defaultTarget) {
        if (
          typeof CKEditor5 !== 'undefined'
          && this.defaultTarget instanceof CKEditor5.core.Editor
          && this.#editors.find(
            editor => editor.id === this.defaultTarget.id
          )
        ) {
          return this.defaultTarget;
        }

        if (
          this.#textareas.find(
            textarea => textarea === this.defaultTarget
          )
        ) {
            return this.defaultTarget;
        }
      }

      if (this.#editors.length) {
        return this.#editors[0];
      }

      if (this.#textareas.length) {
        return this.#textareas[0];
      }

      console.warn('Insert: Unable to determine the insertion target');
    }
  }

  Drupal.insert.Manager = FocusManager;

})(Drupal);