(function (Drupal, CKEditor5) {

  class ExtendAllowedHtml extends CKEditor5.core.Plugin {
    init() {
      const {editor} = this;
      const {schema} = editor.model;

      // The editor landscape on the current page might change, i.e. by
      // switching the text format on a long text input. In that event, a new
      // CKEditor instance is initialised on the textarea. While Drupal core
      // maintains the live CKEditor instances per Drupal.CKEditor5Instances,
      // there is no event notifying about a new editor being attached
      // (see https://www.drupal.org/project/drupal/issues/3319358).
      if (Drupal.insert?.FocusManager) {
        editor.on('ready', () => {
          // Track the editor once it is ready. This is necessary when the
          // Insert module code is already loaded at the time the editor
          // landscape changes.
          Drupal.insert.FocusManager.addEditor(editor);

          // Re-init the focus manager logic as changing the editor landscape
          // might imply a change on the default insert target.
          Drupal.insert.FocusManager.init();
        });
      }

      if (schema.isRegistered('imageInline')) {
        schema.extend('imageInline', {
          allowAttributes: ['dataInsertAttach', 'dataInsertType'],
        });
      }

      if (schema.isRegistered('imageBlock')) {
        schema.extend('imageBlock', {
          allowAttributes: ['dataInsertAttach', 'dataInsertType'],
        });
      }

      editor.model.schema.extend('$text', {allowAttributes: 'dataInsertAttach'});
      editor.model.schema.extend('$text', {allowAttributes: 'dataInsertType'});

      editor.conversion
        .for('upcast')
        .attributeToAttribute({
          view: 'data-insert-attach',
          model: 'dataInsertAttach',
        });

      editor.conversion
        .for('upcast')
        .attributeToAttribute({
          view: 'data-insert-type',
          model: 'dataInsertType',
        });

      editor.conversion
        .for('upcast')
        .add(viewToModel());
    }
  }

  /**
   * Returns a converter that consumes the `data-insert-attach` and
   * `data-insert-type` attributes.
   * @returns {function}
   *   A function that adds an event listener to upcastDispatcher.
   */
  function viewToModel() {
    return (dispatcher) => {
      dispatcher.on(
        'element',
        (evt, data, conversionApi) => {
          const viewLink = data.viewItem;
          const attributes = {
            attributes: ['data-insert-attach', 'data-insert-type']
          };

          if (!conversionApi.consumable.consume(viewLink, attributes)) {
            return;
          }

          const modelElement = data.modelCursor
            && data.modelCursor.is('element')
            ? data.modelCursor
            : data.modelCursor.nodeBefore;

          conversionApi.writer.setAttribute(
            'dataInsertAttach',
            viewLink.getAttribute('data-insert-attach'),
            modelElement
          );

          conversionApi.writer.setAttribute(
            'dataInsertType',
            viewLink.getAttribute('data-insert-type'),
            modelElement
          );
        },
        {priority: 'low'},
      );
    };
  }

  CKEditor5.insert = CKEditor5.insert || {ExtendAllowedHtml};

})(Drupal, CKEditor5);