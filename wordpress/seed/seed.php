<?php
/**
 * Seed WordPress with the Kiln Studio demo content.
 *
 *   npm run seed     (from wordpress/, runs: wp eval-file wp-content/kiln-seed/seed.php)
 *
 * Reads web/content/kiln-studio.json, the same file the Next.js app uses in
 * fixture mode, so the seeded site and the fixture site show identical content.
 * Safe to run again: everything is matched by slug or seed key and updated in
 * place rather than duplicated.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run this with WP-CLI: wp eval-file seed.php\n");
    exit(1);
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

$content_file = WP_CONTENT_DIR . '/kiln-content/kiln-studio.json';
$images_dir   = WP_CONTENT_DIR . '/kiln-images/';

if (!function_exists('kiln_schema') || !function_exists('acf_setup_meta')) {
    WP_CLI::error('Activate Kiln Core and Secure Custom Fields (or ACF PRO) first.');
}
if (!is_readable($content_file)) {
    WP_CLI::error("Content file not found: {$content_file}. Check the mappings in .wp-env.json.");
}

$content = json_decode(file_get_contents($content_file), true, 512, JSON_THROW_ON_ERROR);

// Act as an administrator so content isn't filtered as if posted by a guest.
$admin = get_users(['role' => 'administrator', 'number' => 1])[0] ?? null;
if (!$admin) {
    WP_CLI::error('No administrator account found.');
}
wp_set_current_user($admin->ID);
kses_remove_filters();

// --- Site settings -----------------------------------------------------------

update_option('blogname', $content['site']['title']);
update_option('blogdescription', $content['site']['description']);
update_option('permalink_structure', '/%postname%/');

// --- Images ------------------------------------------------------------------

/** Upload each demo image once; later runs reuse it. Returns key => attachment ID. */
function kiln_seed_images(array $images, string $dir): array
{
    $ids = [];
    foreach ($images as $key => $image) {
        $existing = get_posts([
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'meta_key'    => '_kiln_seed_key',
            'meta_value'  => $key,
            'fields'      => 'ids',
            'numberposts' => 1,
        ]);
        if ($existing) {
            $ids[$key] = $existing[0];
            continue;
        }

        $source = $dir . $image['file'];
        if (!is_readable($source)) {
            WP_CLI::warning("Missing image {$source}, skipping.");
            continue;
        }
        $tmp = wp_tempnam($image['file']);
        copy($source, $tmp);

        $id = media_handle_sideload(['name' => $image['file'], 'tmp_name' => $tmp], 0);
        if (is_wp_error($id)) {
            WP_CLI::warning("Could not import {$image['file']}: " . $id->get_error_message());
            continue;
        }
        update_post_meta($id, '_wp_attachment_image_alt', $image['alt']);
        update_post_meta($id, '_kiln_seed_key', $key);
        $ids[$key] = $id;
        WP_CLI::log("Imported image {$image['file']}");
    }
    return $ids;
}

$image_ids = kiln_seed_images($content['images'], $images_dir);

// --- Block markup ------------------------------------------------------------

require_once __DIR__ . '/lib.php';

/** Create or update a post matched by slug. Returns its ID. */
function kiln_seed_post(string $type, string $slug, array $fields): int
{
    $existing = get_page_by_path($slug, OBJECT, $type);
    $postarr  = array_merge([
        'post_type'   => $type,
        'post_name'   => $slug,
        'post_status' => 'publish',
    ], $fields);
    if ($existing) {
        $postarr['ID'] = $existing->ID;
    }

    // Block attributes are JSON with escaped characters; wp_insert_post()
    // unslashes its input, so slash it first or the escapes are lost.
    $id = wp_insert_post(wp_slash($postarr), true);
    if (is_wp_error($id)) {
        WP_CLI::error("Could not save {$type} {$slug}: " . $id->get_error_message());
    }
    return $id;
}

function kiln_seed_seo(int $post_id, array $seo): void
{
    update_field(kiln_field_key('page', 'seo_title'), $seo['title'] ?? '', $post_id);
    update_field(kiln_field_key('page', 'seo_description'), $seo['description'] ?? '', $post_id);
}

// --- Workshops ---------------------------------------------------------------

foreach ($content['workshops'] as $order => $workshop) {
    $id = kiln_seed_post('workshop', $workshop['slug'], [
        'post_title'   => $workshop['title'],
        'post_content' => kiln_seed_markup($workshop['blocks'], $image_ids),
        'menu_order'   => $order,
    ]);
    if (isset($image_ids[$workshop['image']])) {
        set_post_thumbnail($id, $image_ids[$workshop['image']]);
    }
    foreach (['level', 'duration', 'price', 'summary'] as $field) {
        update_field(kiln_field_key('workshop', $field), $workshop[$field], $id);
    }
    kiln_seed_seo($id, $workshop['seo'] ?? []);
    WP_CLI::log("Saved workshop {$workshop['slug']}");
}

// --- Pages -------------------------------------------------------------------

$page_ids = [];
foreach ($content['pages'] as $order => $page) {
    $id = kiln_seed_post('page', $page['slug'], [
        'post_title'   => $page['title'],
        'post_content' => kiln_seed_markup($page['blocks'], $image_ids),
        'menu_order'   => $order,
    ]);
    kiln_seed_seo($id, $page['seo'] ?? []);
    $page_ids[$page['uri']] = $id;
    WP_CLI::log("Saved page {$page['uri']}");
}

update_option('show_on_front', 'page');
update_option('page_on_front', $page_ids['/']);

// --- Navigation --------------------------------------------------------------

$menu    = wp_get_nav_menu_object('Primary');
$menu_id = $menu ? $menu->term_id : wp_create_nav_menu('Primary');

foreach (wp_get_nav_menu_items($menu_id) ?: [] as $item) {
    wp_delete_post($item->ID, true);
}
foreach ($content['menu'] as $position => $item) {
    // Link to the page itself, not a URL, so the menu follows slug changes.
    wp_update_nav_menu_item($menu_id, 0, [
        'menu-item-title'     => $item['label'],
        'menu-item-object'    => 'page',
        'menu-item-object-id' => $page_ids[$item['uri']],
        'menu-item-type'      => 'post_type',
        'menu-item-status'    => 'publish',
        'menu-item-position'  => $position + 1,
    ]);
}
$locations            = get_theme_mod('nav_menu_locations', []);
$locations['primary'] = $menu_id;
set_theme_mod('nav_menu_locations', $locations);

// --- Studio settings ---------------------------------------------------------

$settings = [
    'address'       => $content['settings']['address'],
    'email'         => $content['settings']['email'],
    'phone'         => $content['settings']['phone'],
    'opening_hours' => $content['settings']['openingHours'],
];
foreach ($settings as $name => $value) {
    update_field(kiln_field_key('settings', $name), $value, 'option');
}

// --- Preview access ----------------------------------------------------------

// Next.js fetches unpublished revisions with an application password. Create
// one for local use and print it once; WordPress only stores its hash.
$app_name = 'Next.js previews (local)';
$has_app  = false;
foreach (WP_Application_Passwords::get_user_application_passwords($admin->ID) as $app) {
    $has_app = $has_app || $app['name'] === $app_name;
}
if (!$has_app && wp_is_application_passwords_available_for_user($admin)) {
    [$password] = WP_Application_Passwords::create_new_application_password($admin->ID, ['name' => $app_name]);
    WP_CLI::log('');
    WP_CLI::log('Add these to web/.env.local to enable previews:');
    WP_CLI::log("WP_PREVIEW_USER={$admin->user_login}");
    WP_CLI::log("WP_PREVIEW_PASSWORD=\"{$password}\"");
    WP_CLI::log('');
}

flush_rewrite_rules();

WP_CLI::success('Kiln Studio content is in place.');
