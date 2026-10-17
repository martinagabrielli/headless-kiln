<?php
/**
 * Content types and menu locations.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function () {
    register_post_type('workshop', [
        'labels' => [
            'name'          => 'Workshops',
            'singular_name' => 'Workshop',
            'add_new_item'  => 'Add workshop',
            'edit_item'     => 'Edit workshop',
            'all_items'     => 'All workshops',
        ],
        'public'              => true,
        'show_in_rest'        => true, // block editor
        'menu_icon'           => 'dashicons-art',
        'supports'            => ['title', 'editor', 'thumbnail', 'page-attributes', 'revisions'],
        // No archive: the /workshops/ listing is an ordinary page built from
        // blocks, so editors control its copy like any other page.
        'has_archive'         => false,
        'rewrite'             => ['slug' => 'workshops', 'with_front' => false],
        'show_in_graphql'     => true,
        'graphql_single_name' => 'workshop',
        'graphql_plural_name' => 'workshops',
    ]);

    // Contact form submissions. Never public, never in GraphQL.
    register_post_type('enquiry', [
        'labels' => [
            'name'          => 'Enquiries',
            'singular_name' => 'Enquiry',
            'edit_item'     => 'View enquiry',
        ],
        'public'          => false,
        'show_ui'         => true,
        'show_in_rest'    => false,
        'show_in_graphql' => false,
        'menu_icon'       => 'dashicons-email-alt',
        'supports'        => ['title', 'editor'],
        'capability_type' => 'post',
        'capabilities'    => ['create_posts' => 'do_not_allow'],
        'map_meta_cap'    => true,
    ]);
});

add_action('after_setup_theme', function () {
    register_nav_menus([
        'primary' => 'Primary navigation',
    ]);
});
