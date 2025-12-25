(function(QUnit, Drupal) {

  const baseDom = '<div class="insert-test-wrapper">\
    <input class="insert-filename" value="test-filename">\
    <input class="insert-description" name="field-name[description]" value="test-description">\
    <div class="insert-test">\
    <input class="insert-style" value="test">\
    <div class="insert-templates">\
    </div>\
    <div class="insert-button" data-insert-id="test-id"></div>\
    </div>\
    </div>';

  /**
   * @param {string} template
   * @returns {[Drupal.insert.FileHandler, HTMLDivElement]}
   */
  function instantiateFileHandler(template) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = baseDom;

    const templates = wrapper.querySelector('.insert-templates');
    templates.innerHTML = `<input class="insert-template" name="insert-template[test]" value="${template}">`;

    const container = wrapper.querySelector('.insert-test');
    const handler = new Drupal.insert.FileHandler(container);
    return [handler, wrapper];
  }

  /**
   * @param {Object} attach
   * @returns {[Drupal.insert.FileHandler, HTMLDivElement]}
   */
  function instantiateFileHandlerJson(attach) {
    return instantiateFileHandler(''
      + '<span data-insert-attach=\''
      + JSON.stringify(attach).replace(/"/g, '&quot;')
      + '\'>test</span>'
    );
  }

  let editor;

  QUnit.module('FileHandler', {
    beforeEach: () => {
      Drupal.insert.FocusManager = new Drupal.insert.Manager();
    },
    afterEach: async () => {
      if (editor) {
        const sourceElement = editor.sourceElement;
        await editor.destroy();
        sourceElement.remove();
        editor = undefined;
      }
      return true;
    }
  })

  QUnit.test('buildContent(): no attachments', assert => {
    let [fileHandler] = instantiateFileHandler('<span>test</span>');

    assert.strictEqual(
      fileHandler.buildContent(),
      '<span>test</span>'
    );

    [fileHandler] = instantiateFileHandler(
      '<span class=&quot;test&quot;>test</span>'
    );

    assert.strictEqual(
      fileHandler.buildContent(),
      '<span class="test">test</span>'
    );
  });

  QUnit.test('buildContent(): attribute attachments', assert => {
    let [fileHandler] = instantiateFileHandlerJson({
        "attributes": {
          "class": ["description"]
        }
      });

    let wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(
      wrapper.firstChild.classList.contains('test-description'),
      true,
      `Verified setting attribute: ${fileHandler.buildContent()}`
    );

    [fileHandler] = instantiateFileHandlerJson({
        "attributes": {
          "class": ["does-not-exist", "description"]
        }
      }
    );

    wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(
      wrapper.firstChild.classList.contains('test-description'),
      true,
      `Verified setting fallback attribute: '${fileHandler.buildContent()}`
    );

    [fileHandler] = instantiateFileHandlerJson({
        "attributes": {
          "class": ["filename", "description"]
        }
      });

    wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(
      wrapper.firstChild.classList.contains('test-filename'),
      true,
      `Verified not setting fallback attribute when first value is not empty: ${fileHandler.buildContent()}`
    );

    [fileHandler] = instantiateFileHandlerJson({
        "attributes": {
          "class": ["filename", "description"],
          "title": ["does-not-exist", "filename"]
        }
      });

    wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(
      wrapper.firstChild.classList.contains('test-filename'),
      true,
      `Verified setting two attributes: ${fileHandler.buildContent()}`
    );

    assert.strictEqual(
      wrapper.firstChild.getAttribute('title'),
      'test-filename'
    );
  });

  QUnit.test('buildContent(): content attachments', assert => {
    let [fileHandler] = instantiateFileHandlerJson({
      "content": ["description"]
    });

    let wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(wrapper.firstChild.innerText, 'test-description');

    [fileHandler] = instantiateFileHandlerJson({
      "content": ["does-not-exist", "description"]
    });

    wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(wrapper.firstChild.innerText, 'test-description');

    [fileHandler] = instantiateFileHandlerJson({
      "content": ["filename", "description"]
    });

    wrapper = document.createElement('div');
    wrapper.innerHTML = fileHandler.buildContent();

    assert.strictEqual(
      wrapper.firstChild.innerText,
      'test-filename',
      `Verified not setting fallback content when first value is not empty: ${fileHandler.buildContent()}`
    );
  });

  QUnit.test('Update attribute in textarea', assert => {
    const textarea = document.createElement('textarea');

    Drupal.insert.FocusManager.addTextarea(textarea);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "attributes": {
        "class": ["description"]
      }
    });

    textarea.value = fileHandler.buildContent();

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    const updatedWrapper = document.createElement('div');
    updatedWrapper.innerHTML = textarea.value;

    assert.true(
      updatedWrapper.firstChild.classList.contains('overwritten'),
      `Updated attribute: ${textarea.value}`
    );

    assert.strictEqual(
      updatedWrapper.firstChild.classList.length,
      1,
      `Updated attribute: ${textarea.value}`
    );
  });

  QUnit.test('Update attributes of multiple instances in textarea', assert => {
    const textarea = document.createElement('textarea');

    Drupal.insert.FocusManager.addTextarea(textarea);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "attributes": {
        "class": ["description"]
      }
    });

    textarea.value = fileHandler.buildContent() + fileHandler.buildContent();

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    const updatedWrapper = document.createElement('div');
    updatedWrapper.innerHTML = textarea.value;

    assert.true(
      updatedWrapper.querySelectorAll('span')[0].classList.contains('overwritten'),
      `Updated attribute of first element: ${textarea.value}`
    );

    assert.true(
      updatedWrapper.querySelectorAll('span')[1].classList.contains('overwritten'),
      `Updated attribute of second element: ${textarea.value}`
    );
  });

  QUnit.test('Update content in textarea', assert => {
    const textarea = document.createElement('textarea');

    Drupal.insert.FocusManager.addTextarea(textarea);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "content": ["description"]
    });

    textarea.value = fileHandler.buildContent();

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    const updatedWrapper = document.createElement('div');
    updatedWrapper.innerHTML = textarea.value;

    assert.strictEqual(
      updatedWrapper.querySelector('span').innerText,
      'overwritten',
      `Updated content: ${textarea.value}`
    );
  });

  QUnit.test('Update content of multiple instances in textarea', assert => {
    const textarea = document.createElement('textarea');

    Drupal.insert.FocusManager.addTextarea(textarea);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "content": ["description"]
    });

    textarea.value = fileHandler.buildContent() + fileHandler.buildContent();

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    const updatedWrapper = document.createElement('div');
    updatedWrapper.innerHTML = textarea.value;

    assert.strictEqual(
      updatedWrapper.querySelectorAll('span')[0].innerText,
      'overwritten',
      `Updated content of first element: ${textarea.value}`
    );

    assert.strictEqual(
      updatedWrapper.querySelectorAll('span')[1].innerText,
      'overwritten',
      `Updated content of second element: ${textarea.value}`
    );
  });

  QUnit.test('Update attribute in CKEditor instance', async (assert) => {
    const done = assert.async();

    editor = await Drupal.insert.testUtil.createEditor();

    Drupal.insert.FocusManager.addEditor(editor);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "attributes": {
        "class": ["description"]
      }
    });

    editor.model.change(writer => {
      const viewFragment = editor.data.processor.toView(fileHandler.buildContent());
      const modelFragment = editor.data.toModel(viewFragment);
      writer.model.insertContent(modelFragment);
    });

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 0]).data,
      'test',
      'Verified content before altering'
    );

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 0]).getAttribute('htmlSpan').classes[0],
      'overwritten'
    );

    done();
  });

  QUnit.test('Update attributes of multiple instances in CKEditor instance', async (assert) => {
    const done = assert.async();

    editor = await Drupal.insert.testUtil.createEditor();

    Drupal.insert.FocusManager.addEditor(editor);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "attributes": {
        "class": ["description"]
      }
    });

    editor.model.change(writer => {
      const viewFragment = editor.data.processor.toView(fileHandler.buildContent() + fileHandler.buildContent());
      const modelFragment = editor.data.toModel(viewFragment);
      writer.model.insertContent(modelFragment);
    });

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 0]).getAttribute('htmlSpan').classes[0],
      'overwritten',
      'Verified first item being updated'
    );

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 1]).getAttribute('htmlSpan').classes[0],
      'overwritten',
      'Verified second item to be updated'
    );

    done();
  });

  QUnit.test('Update content in CKEditor instance', async (assert) => {
    const done = assert.async();

    editor = await Drupal.insert.testUtil.createEditor();

    Drupal.insert.FocusManager.addEditor(editor);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "content": ["description"]
    });

    editor.model.change(writer => {
      const viewFragment = editor.data.processor.toView(fileHandler.buildContent() + fileHandler.buildContent());
      const modelFragment = editor.data.toModel(viewFragment);
      writer.model.insertContent(modelFragment);
    });

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 0]).data,
      'overwritten'
    );

    done();
  });

  QUnit.test('Update content of multiple instances in CKEditor instance', async (assert) => {
    const done = assert.async();

    editor = await Drupal.insert.testUtil.createEditor();

    Drupal.insert.FocusManager.addEditor(editor);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "content": ["description"]
    });

    editor.model.change(writer => {
      const viewFragment = editor.data.processor.toView(fileHandler.buildContent() + fileHandler.buildContent());
      const modelFragment = editor.data.toModel(viewFragment);
      writer.model.insertContent(modelFragment);
    });

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 1]).data,
      'overwritten',
      'Verified first item being updated'
    );

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 1]).data,
      'overwritten',
      'Verified second item being updated'
    );

    done();
  });

  QUnit.test('Update attributes in textarea and CKEditor instance', async (assert) => {
    const done = assert.async();

    const textarea = document.createElement('textarea');

    editor = await Drupal.insert.testUtil.createEditor();

    Drupal.insert.FocusManager.addTextarea(textarea);
    Drupal.insert.FocusManager.addEditor(editor);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "attributes": {
        "class": ["description"]
      }
    });

    textarea.value = fileHandler.buildContent();

    editor.model.change(writer => {
      const viewFragment = editor.data.processor.toView(fileHandler.buildContent());
      const modelFragment = editor.data.toModel(viewFragment);
      writer.model.insertContent(modelFragment);
    });

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    const updatedWrapper = document.createElement('div');
    updatedWrapper.innerHTML = textarea.value;

    assert.true(
      updatedWrapper.firstChild.classList.contains('overwritten'),
      `Updated attribute: ${textarea.value}`
    );

    assert.strictEqual(
      updatedWrapper.firstChild.classList.length,
      1,
      `Updated attribute: ${textarea.value}`
    );

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 0]).getAttribute('htmlSpan').classes[0],
      'overwritten'
    );

    done();
  });

  QUnit.test('Update content in textarea and CKEditor instance', async (assert) => {
    const done = assert.async();

    const textarea = document.createElement('textarea');

    editor = await Drupal.insert.testUtil.createEditor();

    Drupal.insert.FocusManager.addTextarea(textarea);
    Drupal.insert.FocusManager.addEditor(editor);

    const [fileHandler, wrapper] = instantiateFileHandlerJson({
      "id": "test-id",
      "content": ["description"]
    });

    textarea.value = fileHandler.buildContent();

    editor.model.change(writer => {
      const viewFragment = editor.data.processor.toView(fileHandler.buildContent());
      const modelFragment = editor.data.toModel(viewFragment);
      writer.model.insertContent(modelFragment);
    });

    const description = wrapper.querySelector('.insert-description');
    description.value = 'overwritten';
    description.dispatchEvent(new Event('input'));

    const updatedWrapper = document.createElement('div');
    updatedWrapper.innerHTML = textarea.value;

    assert.strictEqual(
      updatedWrapper.querySelector('span').innerText,
      'overwritten',
      `Updated content: ${textarea.value}`
    );

    assert.strictEqual(
      editor.model.document.getRoot().getNodeByPath([[0], 0]).data,
      'overwritten'
    );

    done();
  });

})(QUnit, Drupal);
