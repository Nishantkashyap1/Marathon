(function(QUnit, Drupal) {

  let editor;

  QUnit.module('FocusManager', {
    beforeEach: () => {
      Drupal.insert.FocusManager = new Drupal.insert.Manager();
    },
    afterEach: async () => {
      for (const textarea of document.getElementsByClassName('insert-test')) {
        textarea.remove();
      }

      if (editor) {
        const sourceElement = editor.sourceElement;
        await editor.destroy();
        sourceElement.remove();
        editor = undefined;
      }

      return true;
    }
  })

  QUnit.test('Instantiation', assert => {
    const focusManager = new Drupal.insert.Manager();
    assert.ok(
      focusManager instanceof Drupal.insert.Manager,
      'Instantiated FocusManager'
    );
  });

  QUnit.test('addEditor / getEditors', async (assert) => {
    const done = assert.async();

    const focusManager = new Drupal.insert.Manager();
    editor = await Drupal.insert.testUtil.createEditor();

    focusManager.addEditor(editor);

    assert.strictEqual(focusManager.editors.length, 1, 'Added one editor');
    assert.strictEqual(
      focusManager.editors[0].id,
      editor.id,
      'editors() returns editor'
    );

    done();
  });

  QUnit.test('addTextareas / getTextareas', assert => {
    const focusManager = new Drupal.insert.Manager();
    const textarea = document.createElement('textarea');
    textarea.classList.add('insert-test');
    document.querySelector('body').appendChild(textarea);

    focusManager.addTextarea(textarea);

    assert.strictEqual(
      focusManager.textareas.length,
      1,
      'Added one textarea'
    );
    assert.strictEqual(
      focusManager.textareas[0],
      textarea,
      'textareas() returns textarea'
    );
  });

  QUnit.test('getTarget', async assert => {
    const done = assert.async();

    const focusManager = new Drupal.insert.Manager();

    const textarea = document.createElement('textarea');
    textarea.classList.add('insert-test');
    document.querySelector('body').appendChild(textarea);

    editor = await Drupal.insert.testUtil.createEditor();

    focusManager.addTextarea(textarea);
    focusManager.addEditor(editor);

    assert.strictEqual(
      focusManager.getTarget().id,
      editor.id,
      'Returning first editor instance when nothing has been focused yet'
    );

    textarea.focus();

    assert.strictEqual(
      focusManager.getTarget(),
      textarea,
      'Returning textarea after focusing'
    );

    editor.focus();

    assert.strictEqual(
      focusManager.getTarget().id,
      editor.id,
      'Returning editor after focusing'
    );

    textarea.focus();

    assert.strictEqual(
      focusManager.getTarget(),
      textarea,
      'Returning textarea after re-focusing'
    );

    textarea.blur();

    assert.strictEqual(
      focusManager.getTarget(),
      textarea,
      'Returning textarea after bluring'
    );

    setTimeout(() => {
      assert.strictEqual(
        focusManager.getTarget(),
        textarea,
        'Returning textarea after some sleep'
      );

      done();
    }, 1000);
  });

})(QUnit, Drupal);