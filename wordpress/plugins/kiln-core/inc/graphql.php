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
 * The newest version of a post's content, for previews: the post itself, its
 * latest autosave (made when an editor clicks Preview without saving) or its
 * latest revision, whichever was modified last.
 *
 * Autosaves are looked up for any user, because the account Next.js uses for
 * previews is usually not the editor who made the change.
 */
function kiln_preview_source(WP_Post $post): WP_Post
{
    $candidates = array_filter([
        $post,
        wp_get_post_autosave($post->ID) ?: null,
        ...array_values(wp_get_post_revisions($post->ID, ['numberposts' => 1])),
    ]);
    usort($candidates, fn ($a, $b) => strcmp($b->post_modified_gmt, $a->post_modified_gmt));

    return $candidates[0];
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
            $post = get_post($node->databaseId ?? 0);
            return $post ? kiln_resolve_blocks(parse_blocks($post->post_content)) : [];
        },
    ]);

    /*
     * Previews get their own field rather than WPGraphQL's asPreview argument,
     * which returns nothing for pages that only have an autosave. Only users
     * who can edit the post can read it.
     */
    register_graphql_object_type('KilnPreview', [
        'description' => 'The newest unpublished version of a page or workshop.',
        'fields'      => [
            'databaseId'  => ['type' => ['non_null' => 'Int']],
            'contentType' => ['type' => ['non_null' => 'String'], 'description' => 'page or workshop.'],
            'uri'         => ['type' => 'String'],
            'title'       => ['type' => 'String'],
            'blocks'      => ['type' => ['list_of' => 'KilnBlock']],
        ],
    ]);

    register_graphql_field('RootQuery', 'kilnPreview', [
        'type'    => 'KilnPreview',
        'args'    => ['id' => ['type' => ['non_null' => 'Int']]],
        'resolve' => function ($root, array $args) {
            // Each refusal says why, so a failed preview can be diagnosed from the error.
            $post = get_post($args['id']);
            if (!$post) {
                throw new \GraphQL\Error\UserError("No post with ID {$args['id']}.");
            }
            if (!in_array($post->post_type, ['page', 'workshop'], true)) {
                throw new \GraphQL\Error\UserError("Post {$post->ID} is a \"{$post->post_type}\"; only pages and workshops can be previewed.");
            }
            if (!is_user_logged_in()) {
                throw new \GraphQL\Error\UserError('Previews need a logged-in user. Next.js sends WP_PREVIEW_USER and WP_PREVIEW_PASSWORD; in GraphiQL, run the query as the authenticated user.');
            }
            if (!current_user_can('edit_post', $post->ID)) {
                throw new \GraphQL\Error\UserError('The logged-in user (' . wp_get_current_user()->user_login . ") can't edit post {$post->ID}.");
            }
            $source = kiln_preview_source($post);
            return [
                'databaseId'  => $post->ID,
                'contentType' => $post->post_type,
                'uri'         => kiln_post_path($post->ID),
                'title'       => $source->post_title,
                'blocks'      => kiln_resolve_blocks(parse_blocks($source->post_content)),
            ];
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
