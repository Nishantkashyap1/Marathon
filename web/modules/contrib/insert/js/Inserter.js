(function(Drupal) {
  'use strict';

  /**
   * The Inserter manages inserting content by interfacing to the Focus Manager
   * and a Handler instance. The Inserter will retrieve the insertion target
   * from the Focus Manager and use a Handler to create the content to insert.
   */
  Drupal.insert.Inserter = class {

    /**
     * The element Insert is initialized on.
     * @type {HTMLFieldSetElement}
     */
    #container;

    /**
     * The handler specific to the insertion method.
     * @type {Drupal.insert.Handler}
     */
    #handler;

    /**
     * The "style" selector.
     * @type {HTMLSelectElement}
     */
    #insertStyle;

    /**
     * The insert button.
     * @type {HTMLButtonElement}
     */
    #button;

    /**
     * @param {HTMLFieldSetElement} insertContainer
     * @param {Drupal.insert.Handler} handler
     */
    constructor(insertContainer, handler) {
      this.#container = insertContainer;
      this.#handler = handler;
      this.#insertStyle = this.#container.querySelector('.insert-style');
      this.#button = this.#container.querySelector('.insert-button');

      this.#button.addEventListener('click', event => {
        event.preventDefault();
        this.#insert();
      });
    }

    /**
     * @returns {HTMLFieldSetElement}
     */
    get container() {
      return this.#container;
    }

    /**
     * Entrypoint for inserting content into an editor or textarea.
     */
    #insert() {
      const target = Drupal.insert.FocusManager.getTarget();
      const content = this.#handler.buildContent();

      if (
        typeof CKEditor5 !== 'undefined'
        && target instanceof CKEditor5.core.Editor
      ) {
        this.#insertIntoEditor(target, content);
      } else if (target) {
        this.#insertAtCursor(target, content);
      }
    }

    /**
     * @param {ckeditor.Editor} editor
     * @param {string} content
     */
    #insertIntoEditor(editor, content) {
      editor.model.change(writer => {
        const viewFragment = editor.data.processor.toView(content);
        const modelFragment = editor.data.toModel(viewFragment);
        writer.model.insertContent(modelFragment);

        if (!this.#handler instanceof Drupal.insert.ImageHandler) {
          // Insert an empty space to step put of the inserted HTML structure
          // when focusing the editor. Using '\u2060' (word-joiner) is not
          // sufficient.
          writer.model.insertContent(
            writer.createText(' '),
            modelFragment.parent
          );
        }
      });
    }

    /**
     * @param {HTMLTextAreaElement} textarea
     * @param {string} content
     */
    #insertAtCursor(textarea, content) {
      const scroll = textarea.scrollTop;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;

      textarea.value = textarea.value.substring(0, startPos)
        + content
        + textarea.value.substring(endPos, textarea.value.length);

      textarea.selectionStart = textarea.selectionEnd = startPos + content.length;

      // Restore the initial scroll position
      textarea.scrollTop = scroll;
    }
  }

})(Drupal);
