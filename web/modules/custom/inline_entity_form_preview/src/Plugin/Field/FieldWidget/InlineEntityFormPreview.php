<?php

/**
 * @file
 *   Contains \Drupal\inline_entity_form\Plugin\Field\FieldWidget\InlineEntityFormPreview.
 */

namespace Drupal\inline_entity_form_preview\Plugin\Field\FieldWidget;

use Drupal\Core\Entity\EntityDisplayRepositoryInterface;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Render\Element;
use Drupal\inline_entity_form\Plugin\Field\FieldWidget\InlineEntityFormComplex;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\inline_entity_form_preview\Service\PreviewBuilderInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Simple inline widget with preview.
 *
 * @FieldWidget(
 *   id = "inline_entity_form_preview",
 *   label = @Translation("Inline entity form (With preview)"),
 *   multiple_values = true,
 *   field_types = {
 *     "entity_reference",
 *     "entity_reference_revisions"
 *   },
 * )
 */
class InlineEntityFormPreview extends InlineEntityFormComplex {

  /**
   * The preview builder service.
   *
   * @var \Drupal\inline_entity_form_preview\Service\PreviewBuilderInterface
   */
  protected $preview_builder;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    $instance = parent::create($container, $configuration, $plugin_id, $plugin_definition);
    $instance->preview_builder = $container->get('inline_entity_form_preview.builder');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    $defaults = parent::defaultSettings();
    $defaults += [
      'view_mode' => 'default!',
    ];

    return $defaults;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    // Get the widget form from inline_entity_form.
    $element = parent::settingsForm($form, $form_state);

    // Get the field target type.
    $target_type_id = $this->getFieldSetting('target_type');

    // Get the display modes for this entity type.
    $view_modes = $this->entityDisplayRepository->getViewModes($target_type_id);

    // Get the key and label from the registered display modes.
    $options = ['default!' => $this->t('-- Default --')]
      + (empty($view_modes) ? [] : array_filter(array_map(function($mode){
        return $mode['status'] ? $mode['label'] : NULL;
      }, $view_modes)));

    // Add the display mode select for the preview.
    $element['view_mode'] = [
      '#type' => 'select',
      '#title' => $this->t('Display Mode'),
      '#description' => $this->t('Select the display mode to be used for previewing content in the edit form.'),
      '#options' => $options,
      '#default_value' => $this->getSetting('view_mode'),
    ];

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    $element = parent::formElement($items, $delta, $element, $form, $form_state);

    // Get the field target type.
    $target_type_id = $this->getFieldSetting('target_type');

    // Get the view mode widget setting.
    $view_mode = $this->getSetting('view_mode');

    // Get the view modes for this entity type.
    $entity_view_modes = $this->entityDisplayRepository->getViewModes($target_type_id);

    // Validate the view mode.
    $view_mode = in_array($view_mode, array_keys($entity_view_modes))
      && !empty($entity_view_modes[$view_mode]['status']) ? $view_mode : 'full';

    $element['entities']['#table_fields'] = [
      'preview' => [
        'label' => $this->t('preview'),
        'type' => 'callback',
        'callback' => [$this->preview_builder, 'view'],
        'callback_arguments' => [
          'variables' => $view_mode,
          'langcode' => $items->getParent()->getValue()->language()->getId(),
        ],
      ]
    ];

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  protected function formMultipleElements(FieldItemListInterface $items, array &$form, FormStateInterface $form_state) {
    $element = parent::formMultipleElements($items, $form, $form_state);

    return $element;
  }
}
