<?php
/**
 * Pure helpers for seed.php: turn the content JSON into ACF block markup.
 * Kept free of side effects so they can be checked without WordPress
 * (see seed/check-markup.php).
 */

function kiln_seed_snake(string $camel): string
{
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $camel));
}

function kiln_seed_camel(string $snake): string
{
    return lcfirst(str_replace('_', '', ucwords($snake, '_')));
}

/**
 * Convert the JSON's nested, camelCase field values into ACF's stored block
 * data: snake_case names, a "_name" => field key reference for every value,
 * and repeaters flattened to items = 2, items_0_quote, items_1_quote...
 */
function kiln_seed_block_data(string $group, array $definitions, array $values, array $image_ids, string $prefix = '', array $parents = []): array
{
    $data = [];
    foreach ($definitions as $definition) {
        [$name, $type] = $definition;
        $value     = $values[kiln_seed_camel($name)] ?? null;
        $meta_name = $prefix . $name;

        $data['_' . $meta_name] = kiln_field_key($group, ...[...$parents, $name]);

        switch ($type) {
            case 'repeater':
                $rows = is_array($value) ? array_values($value) : [];
                $data[$meta_name] = count($rows);
                foreach ($rows as $i => $row) {
                    $data += kiln_seed_block_data(
                        $group,
                        $definition[2]['sub_fields'],
                        $row,
                        $image_ids,
                        "{$meta_name}_{$i}_",
                        [...$parents, $name]
                    );
                }
                break;
            case 'image':
                $data[$meta_name] = $value ? ($image_ids[$value] ?? '') : '';
                break;
            case 'link':
                $data[$meta_name] = $value
                    ? ['title' => $value['title'], 'url' => $value['url'], 'target' => $value['target'] ?? '']
                    : '';
                break;
            default:
                $data[$meta_name] = $value ?? '';
        }
    }
    return $data;
}

function kiln_seed_markup(array $blocks, array $image_ids): string
{
    $schema = kiln_schema();
    $markup = [];

    foreach ($blocks as $block) {
        $slug = substr($block['name'], strlen('acf/'));
        if (!isset($schema[$slug])) {
            WP_CLI::warning("Unknown block {$block['name']}, skipping.");
            continue;
        }
        $attrs = [
            'name' => $block['name'],
            'data' => kiln_seed_block_data($slug, $schema[$slug]['fields'], $block['fields'] ?? [], $image_ids),
            'mode' => 'preview',
        ];
        if (!empty($block['anchor'])) {
            $attrs['anchor'] = $block['anchor'];
        }
        $markup[] = serialize_block([
            'blockName'    => $block['name'],
            'attrs'        => $attrs,
            'innerBlocks'  => [],
            'innerHTML'    => '',
            'innerContent' => [],
        ]);
    }
    return implode("\n\n", $markup);
}
