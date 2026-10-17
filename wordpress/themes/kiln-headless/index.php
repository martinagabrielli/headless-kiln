<?php
/**
 * WordPress renders nothing for visitors: the public site is the Next.js app.
 * Anyone who lands on a WordPress URL is sent to the same path there.
 *
 * Previews are normally forwarded to the Next.js draft view by the Kiln Core
 * plugin before this file runs. If one gets here, something is misconfigured,
 * so say what instead of quietly showing the published page.
 */

if (!defined('ABSPATH')) {
    exit;
}

$frontend = defined('KILN_FRONTEND_URL') ? untrailingslashit(KILN_FRONTEND_URL) : '';

if (!empty($_GET['preview'])) {
    $problems = [];
    if (!function_exists('kiln_preview_url')) {
        $problems[] = 'The Kiln Core plugin is not active, or is an older version. Activate the latest copy.';
    }
    foreach (['KILN_FRONTEND_URL', 'KILN_PREVIEW_SECRET'] as $constant) {
        if (!defined($constant) || constant($constant) === '') {
            $problems[] = "{$constant} is not defined in wp-config.php.";
        }
    }
    if (!is_user_logged_in()) {
        $problems[] = 'You are not logged in on this WordPress site in this browser.';
    }
    if (!$problems) {
        $problems[] = 'Settings look correct, but this request was not forwarded. Request: '
            . esc_html(wp_unslash($_SERVER['REQUEST_URI'] ?? ''));
    }

    status_header(200);
    nocache_headers();
    echo '<!doctype html><meta charset="utf-8"><title>Preview not available</title>'
        . '<body style="font:16px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem">'
        . '<h1 style="font-size:1.5rem">The preview couldn\'t be opened in Next.js</h1><ul>';
    foreach ($problems as $problem) {
        echo '<li>' . esc_html($problem) . '</li>';
    }
    echo '</ul></body>';
    exit;
}

if ($frontend !== '') {
    $path = wp_parse_url(home_url(add_query_arg([])), PHP_URL_PATH) ?: '/';
    wp_redirect($frontend . $path, 302);
    exit;
}

status_header(200);
echo '<!doctype html><title>Kiln Studio</title><p>This WordPress install is a content backend. Set KILN_FRONTEND_URL to send visitors to the site.</p>';
