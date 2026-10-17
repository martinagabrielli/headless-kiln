<?php
/**
 * Block registration.
 *
 * Every block is a folder in blocks/ with a block.json. Adding a block means
 * adding that folder plus its fields in inc/schema.php; nothing here changes.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function () {
    foreach (glob(KILN_CORE_DIR . 'blocks/*', GLOB_ONLYDIR) as $dir) {
        if (file_exists("$dir/block.json")) {
            register_block_type($dir);
        }
    }
});

// The site's blocks get their own section in the inserter.
add_filter('block_categories_all', function (array $categories) {
    return array_merge([['slug' => 'kiln', 'title' => 'Kiln Studio', 'icon' => null]], $categories);
});

/**
 * Editor-only preview shared by every block.
 *
 * The public site is rendered by Next.js, so this output is only ever seen in
 * the editor canvas. It shows the block's name and heading, which is enough for
 * an editor to find their way around a page; the real design is one click away
 * in the Preview button, which opens the Next.js draft view.
 */
function kiln_render_block_preview(array $block, string $content = '', bool $is_preview = false): void
{
    if (!$is_preview) {
        return;
    }

    $heading = function_exists('get_field') ? get_field('heading') : '';

    printf(
        '<div style="padding:16px 20px;border:1px solid #c3c4c7;border-radius:6px;background:#fff;'
        . 'font:14px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;">'
        . '<div style="color:#646970;font-size:12px;">%s</div>'
        . '<div style="color:#1d2327;font-size:16px;margin-top:4px;">%s</div>'
        . '</div>',
        esc_html($block['title'] ?? $block['name']),
        esc_html(is_string($heading) && $heading !== '' ? $heading : 'Select to edit')
    );
}

/**
 * Pages and workshops are built only from the site's own blocks.
 *
 * The frontend has a designed React component for each of them; a core block
 * would fall back to plain HTML and break the design system.
 */
add_filter('allowed_block_types_all', function ($allowed, $context) {
    $post_type = $context->post->post_type ?? null;
    if (!in_array($post_type, ['page', 'workshop'], true)) {
        return $allowed;
    }
    return array_map(fn ($block) => 'acf/' . $block, array_keys(kiln_schema()));
}, 10, 2);
