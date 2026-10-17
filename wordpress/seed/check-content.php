<?php
/**
 * Check that the demo content matches the block schema, without WordPress.
 *
 *   php wordpress/seed/check-content.php
 *
 * Fails if the content JSON uses a block or field the schema doesn't define,
 * or an image key that doesn't exist. Runs in CI, so a renamed field can't
 * silently drop content from the seeded site.
 */

define('ABSPATH', __DIR__ . '/');

// The few WordPress functions the helpers touch.
function add_action(...$args): void {}
function serialize_block(array $block): string
{
    return '<!-- wp:' . substr($block['blockName'], 0) . ' ' . json_encode($block['attrs']) . ' /-->';
}
final class WP_CLI
{
    public static array $warnings = [];
    public static function warning(string $message): void { self::$warnings[] = $message; }
}

require __DIR__ . '/../plugins/kiln-core/inc/fields.php';
require __DIR__ . '/lib.php';

$content = json_decode(file_get_contents(__DIR__ . '/../../web/content/kiln-studio.json'), true, 512, JSON_THROW_ON_ERROR);
$schema  = kiln_schema();
$errors  = [];

/** Every key used in the content must be a field in the schema. */
function kiln_check_fields(string $where, array $definitions, array $values, array $images, array &$errors): void
{
    $known = [];
    foreach ($definitions as $definition) {
        $known[kiln_seed_camel($definition[0])] = $definition;
    }
    foreach ($values as $key => $value) {
        if (!isset($known[$key])) {
            $errors[] = "{$where}: unknown field \"{$key}\"";
            continue;
        }
        [, $type] = $known[$key];
        if ($type === 'image' && $value !== null && !isset($images[$value])) {
            $errors[] = "{$where}.{$key}: unknown image \"{$value}\"";
        }
        if ($type === 'repeater') {
            foreach ((array) $value as $i => $row) {
                kiln_check_fields("{$where}.{$key}[{$i}]", $known[$key][2]['sub_fields'], $row, $images, $errors);
            }
        }
    }
}

$documents = [];
foreach ($content['pages'] as $page) {
    $documents["page {$page['uri']}"] = $page['blocks'];
}
foreach ($content['workshops'] as $workshop) {
    $documents["workshop {$workshop['slug']}"] = $workshop['blocks'];
    if (!isset($content['images'][$workshop['image']])) {
        $errors[] = "workshop {$workshop['slug']}: unknown image \"{$workshop['image']}\"";
    }
}

$fake_ids = array_combine(array_keys($content['images']), range(1, count($content['images'])));
$blocks   = 0;

foreach ($documents as $where => $document_blocks) {
    foreach ($document_blocks as $i => $block) {
        $slug = substr($block['name'], strlen('acf/'));
        if (!isset($schema[$slug])) {
            $errors[] = "{$where} block {$i}: unknown block \"{$block['name']}\"";
            continue;
        }
        kiln_check_fields("{$where} {$block['name']}", $schema[$slug]['fields'], $block['fields'] ?? [], $content['images'], $errors);
        $blocks++;
    }
    kiln_seed_markup($document_blocks, $fake_ids);
}

$errors = array_merge($errors, WP_CLI::$warnings);

if ($errors) {
    fwrite(STDERR, "Content does not match the schema:\n  - " . implode("\n  - ", $errors) . "\n");
    exit(1);
}

echo "Content matches the schema: " . count($documents) . " documents, {$blocks} blocks.\n";
