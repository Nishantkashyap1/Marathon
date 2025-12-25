(function(QUnit, Drupal) {

  QUnit.module('Inserter', {
    afterEach: () => {
      for (const temp of document.getElementsByClassName('insert-test')) {
        temp.remove();
      }
    }
  });

  const dom = '<input class="insert-style" type="hidden" value="test">\
    <div class="insert-templates">\
    <input class="insert-template" type="hidden" name="insert-template[test]" value="<span attr=&quot;__unused__&quot;>__filename__</span>">\
    </div>\
    <button class="insert-button">Insert</button>';

  QUnit.test('Insert content into textarea', assert => {
    const container = document.createElement('div');
    container.classList.add('insert-test');
    container.innerHTML = dom;
    document.querySelector('body').append(container);

    const textarea = document.createElement('textarea');

    Drupal.insert.FocusManager = new Drupal.insert.Manager();
    Drupal.insert.FocusManager.addTextarea(textarea);

    const inserter = new Drupal.insert.Inserter(
      container,
      new Drupal.insert.FileHandler(container)
    );

    document.querySelector('.insert-button').dispatchEvent(new Event('click'));

    assert.strictEqual(
      textarea.value,
      '<span attr="__unused__">__filename__</span>',
      'Content is inserted'
    );
  });

})(QUnit, Drupal);
