<?php
/**
 * Everything WordPress says to the Next.js frontend.
 *
 * - Revalidation: tells Next.js which paths to rebuild after a change.
 * - Previews: points the editor's Preview button at the Next.js draft view.
 *
 * Settings come from constants in wp-config.php (wp-env sets them from
 * .wp-env.json). They are never stored in the database or in this plugin, so
 * secrets stay out of git and out of database exports.
 *
 *   KILN_FRONTEND_URL          e.g. https://kiln.example.com (no trailing slash)
 *   KILN_REVALIDATION_SECRET   shared with Next.js REVALIDATION_SECRET
 *   KILN_PREVIEW_SECRET        shared with Next.js PREVIEW_SECRET
 */

if (!defined('ABSPATH')) {
    exit;
}

function kiln_frontend_url(): ?string
{
    return defined('KILN_FRONTEND_URL') ? untrailingslashit(KILN_FRONTEND_URL) : null;
}

/** Root-relative path of a post, e.g. /workshops/glazing/. */
function kiln_post_path(int $post_id): string
{
    if ((int) get_option('page_on_front') === $post_id) {
        return '/';
    }
    return wp_make_link_relative(get_permalink($post_id)) ?: '/';
}

/**
 * Ask Next.js to rebuild the given paths. "*" rebuilds the whole site, for
 * changes that show up on every page (navigation, studio details).
 *
 * Fire-and-forget: saving in the editor never waits on the frontend.
 */
function kiln_revalidate(array $paths): void
{
    $url = kiln_frontend_url();
    if (!$url || !defined('KILN_REVALIDATION_SECRET')) {
        return;
    }

    wp_remote_post($url . '/api/revalidate/', [
        'headers'  => [
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . KILN_REVALIDATION_SECRET,
        ],
        'body'     => wp_json_encode(['paths' => array_values(array_unique($paths))]),
        'blocking' => false,
        'timeout'  => 5,
    ]);
}

/** Paths affected when a page or workshop changes. */
function kiln_paths_for_post(WP_Post $post): array
{
    $paths = [kiln_post_path($post->ID)];
    if ($post->post_type === 'workshop') {
        // Workshops are listed on the home page and the workshops page.
        $paths[] = '/';
        $paths[] = '/workshops/';
    }
    return $paths;
}

// Content saved in the block editor. Fires after the post, its terms and its
// meta are all saved.
add_action('wp_after_insert_post', function (int $post_id, WP_Post $post, bool $update, ?WP_Post $before) {
    if (!in_array($post->post_type, ['page', 'workshop'], true) || wp_is_post_revision($post_id)) {
        return;
    }
    $was_public = $before && $before->post_status === 'publish';
    $is_public  = $post->post_status === 'publish';

    if ($is_public) {
        kiln_revalidate(kiln_paths_for_post($post));
    } elseif ($was_public) {
        // Unpublished or trashed: menus and lists may still link to it.
        kiln_revalidate(['*']);
    }
}, 10, 4);

// Field boxes below the editor (workshop details, SEO) save in a second request
// after the post itself, so they need their own trigger.
add_action('acf/save_post', function ($post_id) {
    if ($post_id === 'options') {
        kiln_revalidate(['*']);
        return;
    }
    $post = is_numeric($post_id) ? get_post((int) $post_id) : null;
    if ($post && $post->post_status === 'publish' && in_array($post->post_type, ['page', 'workshop'], true)) {
        kiln_revalidate(kiln_paths_for_post($post));
    }
}, 20);

add_action('wp_update_nav_menu', fn () => kiln_revalidate(['*']));

/**
 * Preview links.
 *
 * The Preview button opens the Next.js draft route with a signed, short-lived
 * token instead of the raw secret, so the secret never reaches the browser or
 * its history. Next.js checks the signature and expiry, then fetches the latest
 * revision with an application password.
 */
/** Signed link into the Next.js draft view, or null if previews aren't configured. */
function kiln_preview_url(WP_Post $post): ?string
{
    $url = kiln_frontend_url();
    if (!$url || !defined('KILN_PREVIEW_SECRET') || !in_array($post->post_type, ['page', 'workshop'], true)) {
        return null;
    }
    $expires = time() + 10 * MINUTE_IN_SECONDS;
    $token   = hash_hmac('sha256', $post->ID . ':' . $expires, KILN_PREVIEW_SECRET);

    return add_query_arg([
        'id'      => $post->ID,
        'expires' => $expires,
        'token'   => $token,
    ], $url . '/api/draft/');
}

add_filter('preview_post_link', function (string $link, WP_Post $post) {
    return kiln_preview_url($post) ?? $link;
}, 10, 2);

/**
 * Catch previews that reach WordPress anyway.
 *
 * The block editor doesn't always use the filtered link above: it can open
 * WordPress's own preview URL (?preview=true&preview_id=21). Those requests
 * land here and are sent on to the Next.js draft view for the right post.
 */
add_action('template_redirect', function () {
    if (empty($_GET['preview'])) {
        return;
    }
    $id = absint($_GET['preview_id'] ?? $_GET['page_id'] ?? $_GET['p'] ?? 0);
    if (!$id && is_singular()) {
        $id = get_queried_object_id();
    }
    $post = $id ? get_post($id) : null;
    if (!$post || !current_user_can('edit_post', $post->ID)) {
        return;
    }
    $url = kiln_preview_url($post);
    if ($url) {
        wp_redirect($url, 302);
        exit;
    }
}, 1);
