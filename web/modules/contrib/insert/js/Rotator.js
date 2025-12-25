(function(Drupal) {
  'use strict';

  /**
   * The Rotator contains the functionality for rotating images, triggering the
   * stored image to be rotated and updating the image references already
   * inserted into textareas and editors.
   */
  Drupal.insert.Rotator = class {

    /**
     * @type {HTMLElement}
     */
    #element;

    /**
     * @type {HTMLElement}
     */
    #templates;

    /**
     * @param {HTMLElement} element
     * @param {HTMLElement} templates
     */
    constructor(element, templates) {
      this.#element = element;
      this.#templates = templates;

      this.#element.querySelectorAll('.insert-rotate-controls a')?.forEach(
        a => {
          a.addEventListener('click', async event => {
            event.preventDefault();

            const response = await fetch(a.getAttribute('href'));
            const data = await response.json();

            console.log(data);

            document.querySelector('input[name="changed"]').value
              = data.revision;

            this.#updateImageRotation(data.data);
          });
        }
      );
    }

    /**
     * Updates the preview image, the insert templates as well as any images
     * derivatives already placed.
     *
     * @param {{[key: string]: string}} styleInfo
     */
    #updateImageRotation(styleInfo) {
      const updatedStyleInfo = {};

      Object.entries(styleInfo).forEach(([styleName, url]) => {
        updatedStyleInfo[styleName] = url + (url.indexOf('?') === -1 ? '?' : '&');
        updatedStyleInfo[styleName] += 'insert-refresh=' + Date.now();
      });

      this.#updatePreviewImage(styleInfo);
      this.#updateTemplates(styleInfo);
      this.#updateInsertedImages(styleInfo);
    }

    /**
     * @param {{[key: string]: string}} styleInfo
     */
    #updatePreviewImage(styleInfo) {
      const previewImg = this.#element.closest('.image-widget')
        .querySelector('.image-preview__img-wrapper img');

      if (!previewImg) {
        return;
      }

      for (const cssClass of previewImg.classList) {
        const styleClass = cssClass.match('^image-style-(.+)');

        if (styleClass !== null && typeof styleInfo[styleClass[1]] !== 'undefined') {
          previewImg.setAttribute('src', styleInfo[styleClass[1]])
          previewImg.removeAttribute('width')
          previewImg.removeAttribute('height');

          break;
        }
      }
    }

    /**
     * @param {{[key: string]: string}} styleInfo
     */
    #updateTemplates(styleInfo) {
      Object.entries(styleInfo).forEach(([styleName, url]) => {
        this.#templates
          .querySelectorAll(`.insert-template[name*="[${styleName}]"]`)
          .forEach(templateElement => {
            let template = templateElement.value;

            const widthMatches = template.match(/width[ ]*=[ ]*"(\d*)"/i);
            const heightMatches = template.match(/height[ ]*=[ ]*"(\d*)"/i);

            if (heightMatches && heightMatches.length === 2) {
              template = template.replace(
                /(width[ ]*=[ ]*")(\d*)"/i,
                `width="${heightMatches[1]}"`
              );
            }

            if (widthMatches && widthMatches.length === 2) {
              template = template.replace(
                /(height[ ]*=[ ]*")(\d*)"/i,
                `height="${widthMatches[1]}"`
              );
            }

            templateElement.value = template.replace(/src="[^"]+"/, `src="${url}"`);
          });
      });
    }

    /**
     * @param {{[key: string]: string}} styleInfo
     */
    #updateInsertedImages(styleInfo) {
      Object.values(styleInfo).forEach(url => {
        const updatedImageCleanUrl = url.split('?')[0];

        Drupal.insert.FocusManager.textareas.forEach(textarea => {
          this.#updateTextarea(textarea, url, updatedImageCleanUrl);
        });

        Drupal.insert.FocusManager.editors.forEach(editor => {
          this.#updateEditor(editor, url, updatedImageCleanUrl);
        });
      });
    }

    /**
     * @param {HTMLTextAreaElement} textarea
     * @param {string} url
     * @param {string} updatedImageCleanUrl
     */
    #updateTextarea(textarea, url, updatedImageCleanUrl) {
      let textareaString = textarea.value;
      const temp = document.createElement('div');
      temp.innerHTML = textarea.value;

      temp.querySelectorAll('img').forEach((img, index) => {
        const imgCleanUrl = img.getAttribute('src').split('?')[0];

        if (imgCleanUrl === updatedImageCleanUrl) {
          const width = img.getAttribute('width');
          const height = img.getAttribute('height');

          if (width) {
            img.setAttribute('height', width);
          } else {
            img.removeAttribute('height');
          }
          if (height) {
            img.setAttribute('width', height);
          } else {
            img.removeAttribute('width');
          }

          img.setAttribute('src', url);

          let i = 0;

          textareaString = textareaString.replace(
            /<img[^>]*>/g,
            match => {
              if (i++ !== index) {
                return match;
              }

              const temp = document.createElement('div');
              temp.appendChild(img);
              return temp.innerHTML;
            }
          );
        }

        textarea.value = textareaString;
      });
    }

    /**
     * @param {ckeditor.Editor} editor
     * @param {string} url
     * @param {string} updatedImageCleanUrl
     */
    #updateEditor(editor, url, updatedImageCleanUrl) {

      editor.model.change(writer => {
        this.#updateEditorModel(
          writer.model.document.getRoot(),
          url,
          updatedImageCleanUrl
        );

        this.#updateEditorView(
          editor.editing.view.getDomRoot(),
          url,
          updatedImageCleanUrl
        );
      });
    }

    /**
     * @param {ckeditor.Element} root
     * @param {string} url
     * @param {string} updatedImageCleanUrl
     */
    #updateEditorModel(root, url, updatedImageCleanUrl) {
      const elements = Drupal.insert.Manager.findDescendants(
        root,
        element => {
          return element.getAttribute('htmlImgAttributes')?.attributes.src
            .split('?')[0] === updatedImageCleanUrl;
        }
      );

      elements.forEach(element => {
        const imgAttributes = element.getAttribute('htmlImgAttributes');
        const width = imgAttributes.attributes.width;
        const height = imgAttributes.attributes.height;

        if (width) {
          imgAttributes.attributes.height = width;
        }

        if (height) {
          imgAttributes.attributes.width = height;
        }

        imgAttributes.attributes.src = url;
        imgAttributes.src = url;

        element._setAttribute('htmlImgAttributes', imgAttributes);
      });
    }

    /**
     * @param {HTMLElement} root
     * @param {string} url
     * @param {string} updatedImageCleanUrl
     */
    #updateEditorView(root, url, updatedImageCleanUrl) {
      root.querySelectorAll('img').forEach(img => {
        if (img.getAttribute('src')?.split('?')[0] !== updatedImageCleanUrl) {
          return;
        }

        const width = img.getAttribute('width');
        const height = img.getAttribute('height');

        img.setAttribute('width', height);
        img.setAttribute('height', width);

        img.setAttribute('src', url);

        if (img.style.aspectRatio) {
          img.style.aspectRatio = `${height}/${width}`;
        }
      });
    }
  }

})(Drupal);
