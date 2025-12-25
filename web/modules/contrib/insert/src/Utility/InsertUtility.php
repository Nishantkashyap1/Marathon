<?php

namespace Drupal\insert\Utility;

use Drupal\Component\Utility\Html;
use Drupal\Core\Form\FormStateInterface;
use Drupal\file\FileInterface;
use Drupal\image\Entity\ImageStyle;
use Masterminds\HTML5\Parser\DOMTreeBuilder;
use Masterminds\HTML5\Parser\Scanner;
use Masterminds\HTML5\Parser\Tokenizer;

/**
 *
 */
class InsertUtility {

  /**
   * @param string $pluginId
   * @param string|array (optional) $insertTypes
   * @return bool
   */
  public static function isSourceWidget($pluginId, $insertTypes = NULL) {
    return in_array($pluginId, static::getSourceWidgets($insertTypes));
  }

  /**
   * @param string|array (optional) $insertTypes
   * @return string[]
   */
  protected static function getSourceWidgets($insertTypes = NULL) {
    if (is_string($insertTypes)) {
      $insertTypes = [$insertTypes];
    }

    $sources = \Drupal::moduleHandler()->invokeAll('insert_widgets');
    $widgets = [];

    foreach ($sources as $insertType => $widgetIds) {
      if (
        count($widgetIds) > 0
        && ($insertTypes === NULL || in_array($insertType, $insertTypes))
      ) {
        $widgets = array_merge($widgets, $widgetIds);
      }
    }

    return $widgets;
  }

  /**
   * @param string $insertType
   * @return array
   */
  public static function aggregateStyles($insertType) {
    $styles = \Drupal::moduleHandler()->invokeAll(
      'insert_styles',
      [$insertType]
    );

    uasort($styles, function ($a, $b) {
      $weightA = !($a instanceof ImageStyle) && isset($a['weight'])
        ? $a['weight'] : 0;
      $weightB = !($b instanceof ImageStyle) && isset($b['weight'])
        ? $b['weight'] : 0;
      if ($weightA === 0 && $weightB === 0) {
        $labelA = $a instanceof ImageStyle ? $a->label() : $a['label'];
        $labelB = $b instanceof ImageStyle ? $b->label() : $b['label'];
        return strcasecmp($labelA, $labelB);
      }
      return $weightA < $weightB ? -1 : 1;
    });

    return $styles;
  }

  /**
   * @param array $stylesList
   * @return array
   */
  public static function stylesListToOptions(array $stylesList) {
    foreach ($stylesList as $styleName => $style) {
      /* @var ImageStyle|array $style */
      $stylesList[$styleName] = is_array($style)
        ? $style['label']
        : $style->label();
    }
    return $stylesList;
  }

  /**
   * An #element_validate function lists on the settings form.
   * Since, when all list items are activated, items added later on should be
   * enabled by default, the setting value needs to be changed to be able to
   * detect that all items were enabled when having set the value the last time.
   *
   * @param array $element
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   */
  public static function validateList(array $element, FormStateInterface &$form_state) {
    if (array_key_exists('#options', $element)
      && array_values($element['#value']) == array_keys($element['#options'])
    ) {
      $form_state->setValue('<all>', '<all>');
    }
  }

  /**
   * @param \Drupal\file\FileInterface $file
   * @return bool
   */
  public static function isImage($file) {
    /** @var \Drupal\Core\Image\Image $image */
    $image = \Drupal::service('image.factory')->get($file->getFileUri());

    return $image->isValid();
  }

  /**
   * @param \Drupal\file\FileInterface $file
   * @param string $styleName
   * @param bool (optional) $absolute
   * @return null|string
   */
  public static function buildDerivativeUrl(FileInterface $file, $styleName, $absolute = FALSE) {
    /** @var \Drupal\image\Entity\ImageStyle $style */
    $style = ImageStyle::load($styleName);

    if ($style !== NULL) {
      $url = $style->buildUrl($file->getFileUri());
      if (!$absolute) {
        $parsedUrl = parse_url($url);
        $url = $parsedUrl['path'];
        if (!empty($parsedUrl['query'])) {
          $url .= '?' . $parsedUrl['query'];
        }
      }
      return $url;
    }

    return NULL;
  }

}
