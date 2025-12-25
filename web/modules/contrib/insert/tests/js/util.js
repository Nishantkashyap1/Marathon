(function(ClassicEditor) {
  Drupal.insert.testUtil = {
    async createEditor() {
      const container  = document.createElement('div');
      container.setAttribute('id', 'editor');
      document.querySelector('body').append(container);

      return ClassicEditor.create(container, {
        // In order to avoid having a build process to have an editor constructor featuring the
        // GeneralHtmlSupport plugin, the super build is used from the CKEditor CDN. Since that
        // build features plugins that require configuration and plugins that require a license,
        // those plugins need to be specifically disabled.
        removePlugins: [
          'AIAssistant',
          'CaseChange',
          'CKBox',
          'CKBoxEditing',
          'CKBoxImageEdit',
          'CKBoxImageEditEditing',
          'CKBoxUtils',
          'CloudServices',
          'CloudServicesUploadAdapter',
          'Comments',
          'CommentsRepository',
          'ContentTemplates',
          'DocumentOutline',
          'EasyImage',
          'ExportPdf',
          'ExportWord',
          'FormatPainter',
          'PasteFromOffice',
          'Pagination',
          'PasteFromOfficeEnhanced',
          'PresenceList',
          'RealTimeCollaborationClient',
          'RealTimeCollaborativeEditing',
          'RealTimeCollaborativeComments',
          'RealTimeCollaborativeRevisionHistory',
          'RealTimeCollaborativeTrackChanges',
          'RevisionHistory',
          'RevisionTracker',
          'SlashCommand',
          'TableOfContents',
          'Template',
          'TrackChanges',
          'TrackChangesData',
          'TrackChangesEditing',
          'Users',
          'WProofreader',
        ],
        htmlSupport: {
          allow: [
            {
              name: /.*/,
              attributes: true,
              classes: true,
              styles: true
            },
          ],
        },
      });
    }
  }
})(CKEDITOR.ClassicEditor);