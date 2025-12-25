<?php

namespace Drupal\inline_entity_form_preview\Twig;

use Drupal\Core\Database\Connection;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class InlineEntityFormPreviewTwigExtension extends AbstractExtension {

  protected Connection $database;

  public function __construct(Connection $database) {
    $this->database = $database;
  }

  /**
   * {@inheritdoc}
   */
  public function getFunctions() {
    return [
      new TwigFunction('term_node_count', [$this, 'termNodeCount']),
    ];
  }

  /**
   * Count published nodes associated with a taxonomy term.
   *
   * @param int $tid
   *   Term ID.
   *
   * @return int
   *   Node count.
   */
  public function termNodeCount(int $tid): int {
    if (empty($tid)) {
      return 0;
    }

    $query = $this->database->select('taxonomy_index', 'ti');
    $query->addExpression('COUNT(DISTINCT ti.nid)', 'node_count');
    $query->join('node_field_data', 'n', 'n.nid = ti.nid');
    $query->join('taxonomy_term_field_data', 't', 't.tid = ti.tid');

    $query->condition('ti.tid', $tid);
    $query->condition('n.status', 1);

    // Since your term list is from vocabulary "theme".
    $query->condition('t.vid', 'theme');

    return (int) $query->execute()->fetchField();
  }

}
