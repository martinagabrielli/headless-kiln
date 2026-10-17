<?php
/**
 * GraphQL schema additions.
 *
 * The frontend asks for a page's blocks and gets each block's fields already
 * resolved: images as {url, alt, width, height}, links as {title, url, target},
 * repeaters as nested arrays. Doing this here, where the field definitions
 * live, keeps the frontend free of ACF storage details (flattened repeater keys,
 * attachment IDs, field-key references), and it means one plugin (WPGraphQL)
 * is enough: no block or ACF bridge plugins to keep in step.
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Image attachment ID -> the shape next/image needs. */
function kiln_image($attachment_id): ?array
{
    $attachment_id = (int) $attachment_id;
    if (!$attachment_id) {
        return null;
    }
    $src = wp_get_attachment_image_src($attachment_id, 'full');
    if (!$src) {
        return null;
    }
    return [
        'url'    => $src[0],
        'width'  => (int) $src[1],
        'height' => (int) $src[2],
        'alt'    => (string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
    ];
}

/** Internal links become root-relative, so they work on the frontend's domain. */
function kiln_relative_url(string $url): string
{
    $home = wp_parse_url(home_url(), PHP_URL_HOST);
    $host = wp_parse_url($url, PHP_URL_HOST);
    return ($host && $host === $home) ? wp_make_link_relative($url) : $url;
}

function kiln_link($link): ?array
{
    if (!is_array($link) || empty($link['url'])) {
        return null;
    }
    return [
        'title'  => (string) ($link['title'] ?? ''),
        'url'    => kiln_relative_url($link['url']),
        'target' => !empty($link['target']) ? $link['target'] : null,
    ];
}

/** Format one field value by its type, recursing into repeater rows. */
function kiln_format_field(array $field, $value)
{
    switch ($field['type']) {
        case 'image':
            return kiln_image($value);
        case 'link':
            return kiln_link($value);
        case 'number':
            return ($value === '' || $value === null) ? null : (float) $value;
        case 'repeater':
            if (!is_array($value)) {
                return [];
            }
            $sub_fields = [];
            foreach ($field['sub_fields'] ?? [] as $sub) {
                $sub_fields[$sub['name']] = $sub;
            }
            return array_values(array_map(function ($row) use ($sub_fields) {
                $out = [];
                foreach ($sub_fields as $name => $sub) {
                    $out[$name] = kiln_format_field($sub, $row[$name] ?? null);
                }
                return $out;
            }, $value));
        default:
            return ($value === '' || $value === false) ? null : $value;
    }
}

/**
 * Resolve a block's stored field data into formatted values.
 *
 * Block fields live inside the post content, not in post meta, so ACF has to be
 * told to read them from the block's data for the duration of the lookup.
 */
function kiln_block_fields(array $block): array
{
    $data = $block['attrs']['data'] ?? [];
    if (!is_array($data) || !$data || !function_exists('acf_setup_meta')) {
        return [];
    }

    $block_id = 'block_' . md5(wp_json_encode($data));
    acf_setup_meta($data, $block_id, true);
    $objects = get_field_objects($block_id) ?: [];
    acf_reset_meta($block_id);

    $fields = [];
    foreach ($objects as $name => $field) {
        $fields[$name] = kiln_format_field($field, $field['value'] ?? null);
    }
    return $fields;
}

/** parse_blocks() output -> the KilnBlock GraphQL shape. */
function kiln_resolve_blocks(array $blocks): array
{
    $resolved = [];
    foreach ($blocks as $block) {
        // parse_blocks() returns the whitespace between blocks as nameless blocks.
        if (empty($block['blockName'])) {
            continue;
        }
        $is_field_block = str_starts_with($block['blockName'], 'acf/');
        $resolved[] = [
            'name'        => $block['blockName'],
            'anchor'      => !empty($block['attrs']['anchor']) ? sanitize_title($block['attrs']['anchor']) : null,
            'fields'      => $is_field_block ? wp_json_encode((object) kiln_block_fields($block)) : null,
            'html'        => $is_field_block ? null : render_block($block),
            'innerBlocks' => kiln_resolve_blocks($block['innerBlocks'] ?? []),
        ];
    }
    return $resolved;
}

/**
 * The post whose content a GraphQL node shows.
 *
 * For a preview (asPreview: true) WPGraphQL can report the published post's ID,
 * so pick the newest autosave or revision explicitly; otherwise a preview would
 * show the published content instead of the draft.
 */
function kiln_content_post($node): ?WP_Post
{
    $post = get_post($node->databaseId ?? 0);
    if (!$post || empty($node->isPreview) || $post->post_type === 'revision') {
        return $post ?: null;
    }

    $candidates = array_filter([
        wp_get_post_autosave($post->ID, get_current_user_id()) ?: null,
        ...array_values(wp_get_post_revisions($post->ID, ['numberposts' => 1])),
    ]);
    usort($candidates, fn ($a, $b) => strcmp($b->post_modified_gmt, $a->post_modified_gmt));

    return $candidates[0] ?? $post;
}

function kiln_level_label(?string $level): ?string
{
    $labels = ['beginner' => 'Beginner', 'intermediate' => 'Intermediate', 'all-levels' => 'All levels'];
    return $labels[$level] ?? null;
}

add_action('graphql_register_types', function () {
    register_graphql_object_type('KilnBlock', [
        'description' => 'A block with its fields resolved and formatted.',
        'fields'      => [
            'name'        => ['type' => ['non_null' => 'String'], 'description' => 'Block name, e.g. acf/hero.'],
            'anchor'      => ['type' => 'String', 'description' => 'HTML anchor set in the editor, for links like /visit/#enquire.'],
            'fields'      => ['type' => 'String', 'description' => 'Formatted field values as a JSON object (field blocks only).'],
            'html'        => ['type' => 'String', 'description' => 'Rendered HTML (core blocks only).'],
            'innerBlocks' => ['type' => ['list_of' => 'KilnBlock']],
        ],
    ]);

    register_graphql_field('NodeWithContentEditor', 'kilnBlocks', [
        'type'        => ['list_of' => 'KilnBlock'],
        'description' => 'The content as resolved blocks.',
        'resolve'     => function ($node) {
            $post = kiln_content_post($node);
            return $post ? kiln_resolve_blocks(parse_blocks($post->post_content)) : [];
        },
    ]);

    register_graphql_object_type('KilnSeo', [
        'fields' => [
            'title'       => ['type' => 'String'],
            'description' => ['type' => 'String'],
        ],
    ]);

    foreach (['Page', 'Workshop'] as $type) {
        register_graphql_field($type, 'kilnSeo', [
            'type'    => 'KilnSeo',
            'resolve' => fn ($node) => [
                'title'       => get_field('seo_title', $node->databaseId) ?: null,
                'description' => get_field('seo_description', $node->databaseId) ?: null,
            ],
        ]);
    }

    $workshop_fields = [
        'level'      => fn ($id) => get_field('level', $id) ?: null,
        'levelLabel' => fn ($id) => kiln_level_label(get_field('level', $id) ?: null),
        'duration'   => fn ($id) => get_field('duration', $id) ?: null,
        'price'      => fn ($id) => get_field('price', $id) ?: null,
        'summary'    => fn ($id) => get_field('summary', $id) ?: null,
    ];
    foreach ($workshop_fields as $name => $read) {
        register_graphql_field('Workshop', $name, [
            'type'    => 'String',
            'resolve' => function ($node) use ($read) {
                return function_exists('get_field') ? $read($node->databaseId) : null;
            },
        ]);
    }

    register_graphql_object_type('StudioSettings', [
        'fields' => [
            'address'      => ['type' => 'String'],
            'email'        => ['type' => 'String'],
            'phone'        => ['type' => 'String'],
            'openingHours' => ['type' => 'String'],
        ],
    ]);

    register_graphql_field('RootQuery', 'studioSettings', [
        'type'    => 'StudioSettings',
        'resolve' => function () {
            if (!function_exists('get_field')) {
                return null;
            }
            return [
                'address'      => get_field('address', 'option') ?: null,
                'email'        => get_field('email', 'option') ?: null,
                'phone'        => get_field('phone', 'option') ?: null,
                'openingHours' => get_field('opening_hours', 'option') ?: null,
            ];
        },
    ]);
});
