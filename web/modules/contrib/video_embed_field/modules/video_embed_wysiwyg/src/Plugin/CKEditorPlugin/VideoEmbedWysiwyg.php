<?php

namespace Drupal\video_embed_wysiwyg\Plugin\CKEditorPlugin;

use Drupal\Component\Utility\NestedArray;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Form\FormState;
use Drupal\Core\Form\FormStateInterface;
use Drupal\ckeditor\CKEditorPluginBase;
use Drupal\ckeditor\CKEditorPluginConfigurableInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\editor\Entity\Editor;
use Drupal\video_embed_field\Plugin\Field\FieldFormatter\Video;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * The media_entity plugin for video_embed_field.
 *
 * @CKEditorPlugin(
 *   id = "video_embed",
 *   label = @Translation("Video Embed WYSIWYG")
 * )
 */
class VideoEmbedWysiwyg extends CKEditorPluginBase implements CKEditorPluginConfigurableInterface, ContainerFactoryPluginInterface {

  /**
   * The module extension list.
   *
   * @var \Drupal\Core\Extension\ModuleExtensionList
   */
  protected $moduleExtensionList;

  /**
   * Constructs a new DrupalMediaLibrary plugin object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param array $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Extension\ModuleExtensionList $extension_list_module
   *   The module extension list.
   */
  public function __construct(array $configuration, $plugin_id, array $plugin_definition, ModuleExtensionList $extension_list_module) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->moduleExtensionList = $extension_list_module;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new self(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('extension.list.module'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFile() {
    return $this->moduleExtensionList->getPath('video_embed_wysiwyg') . '/plugin/plugin.js';
  }

  /**
   * {@inheritdoc}
   */
  public function getButtons() {
    return [
      'video_embed' => [
        'label' => $this->t('Video Embed'),
        'image' => $this->moduleExtensionList->getPath('video_embed_wysiwyg') . '/plugin/icon.png',
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getConfig(Editor $editor) {
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state, Editor $editor) {
    $editor_settings = $editor->getSettings();
    $plugin_settings = NestedArray::getValue($editor_settings, [
      'plugins',
      'video_embed',
      'defaults',
      'children',
    ]);
    $settings = $plugin_settings ?: [];

    $form['defaults'] = [
      '#title' => $this->t('Default Settings'),
      '#type' => 'fieldset',
      '#tree' => TRUE,
      'children' => Video::mockInstance($settings)->settingsForm([], new FormState()),
    ];
    return $form;
  }

}
