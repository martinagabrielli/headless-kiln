<?php
/**
 * Field groups, registered in code from inc/schema.php.
 *
 * Works with Secure Custom Fields (the free WordPress.org plugin) or ACF PRO:
 * both expose the same acf_* API.
 */

if (!defined('ABSPATH')) {
    exit;
}

/** The block schema, loaded once. */
function kiln_schema(): array
{
    static $schema = null;
    if ($schema === null) {
        $schema = require __DIR__ . '/schema.php';
    }
    return $schema;
}

/** Deterministic field key, e.g. field_kiln_text_image_heading. */
function kiln_field_key(string $group, string ...$names): string
{
    $parts = array_map(fn ($part) => str_replace('-', '_', $part), [$group, ...$names]);
    return 'field_kiln_' . implode('_', $parts);
}

/** Turn a schema entry ([name, type, extra]) into an ACF field array. */
function kiln_build_field(string $group, array $definition, array $parents = []): array
{
    [$name, $type] = $definition;
    $extra = $definition[2] ?? [];

    $field = [
        'key'   => kiln_field_key($group, ...[...$parents, $name]),
        'label' => ucfirst(str_replace('_', ' ', $name)),
        'name'  => $name,
        'type'  => $type,
    ];

    // Return formats chosen for the GraphQL resolver in inc/graphql.php.
    if ($type === 'image') {
        $field['return_format'] = 'id';
        $field['preview_size']  = 'medium';
    }
    if ($type === 'link') {
        $field['return_format'] = 'array';
    }

    if ($type === 'repeater') {
        $field['layout']     = 'block';
        $field['sub_fields'] = array_map(
            fn ($sub) => kiln_build_field($group, $sub, [...$parents, $name]),
            $extra['sub_fields'] ?? []
        );
        unset($extra['sub_fields']);
    }

    return array_merge($field, $extra);
}

add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

    // One field group per block, located on that block only.
    foreach (kiln_schema() as $block => $config) {
        acf_add_local_field_group([
            'key'      => 'group_kiln_block_' . str_replace('-', '_', $block),
            'title'    => 'Block: ' . $config['title'],
            'fields'   => array_map(fn ($field) => kiln_build_field($block, $field), $config['fields']),
            'location' => [[['param' => 'block', 'operator' => '==', 'value' => 'acf/' . $block]]],
        ]);
    }

    acf_add_local_field_group([
        'key'      => 'group_kiln_workshop',
        'title'    => 'Workshop details',
        'position' => 'acf_after_title',
        'fields'   => [
            kiln_build_field('workshop', ['level', 'select', [
                'choices' => [
                    'beginner'     => 'Beginner',
                    'intermediate' => 'Intermediate',
                    'all-levels'   => 'All levels',
                ],
                'default_value' => 'beginner',
            ]]),
            kiln_build_field('workshop', ['duration', 'text', [
                'instructions' => 'For example, "Six Tuesday evenings, 7–9.30pm".',
            ]]),
            kiln_build_field('workshop', ['price', 'text', ['instructions' => 'For example, "£240".']]),
            kiln_build_field('workshop', ['summary', 'textarea', [
                'rows'         => 3,
                'instructions' => 'One or two sentences, shown in workshop lists.',
            ]]),
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'workshop']]],
    ]);

    // A small SEO group instead of an SEO plugin: the frontend builds all
    // metadata itself, so two fields are all it needs.
    acf_add_local_field_group([
        'key'      => 'group_kiln_seo',
        'title'    => 'Search and sharing',
        'position' => 'side',
        'fields'   => [
            kiln_build_field('page', ['seo_title', 'text', [
                'label'        => 'Title',
                'instructions' => 'Leave empty to use the page title.',
            ]]),
            kiln_build_field('page', ['seo_description', 'textarea', [
                'rows'         => 3,
                'label'        => 'Description',
                'instructions' => 'About 155 characters, shown in search results.',
            ]]),
        ],
        'location' => [
            [['param' => 'post_type', 'operator' => '==', 'value' => 'page']],
            [['param' => 'post_type', 'operator' => '==', 'value' => 'workshop']],
        ],
    ]);

    if (function_exists('acf_add_options_page')) {
        acf_add_options_page([
            'page_title' => 'Studio Settings',
            'menu_title' => 'Studio Settings',
            'menu_slug'  => 'studio-settings',
            'capability' => 'edit_posts',
            'icon_url'   => 'dashicons-store',
            'redirect'   => false,
        ]);
    }

    acf_add_local_field_group([
        'key'      => 'group_kiln_settings',
        'title'    => 'Studio details',
        'fields'   => [
            kiln_build_field('settings', ['address', 'textarea', ['rows' => 3, 'new_lines' => '']]),
            kiln_build_field('settings', ['email', 'email']),
            kiln_build_field('settings', ['phone', 'text']),
            kiln_build_field('settings', ['opening_hours', 'textarea', ['rows' => 4, 'new_lines' => '']]),
        ],
        'location' => [[['param' => 'options_page', 'operator' => '==', 'value' => 'studio-settings']]],
    ]);
});
