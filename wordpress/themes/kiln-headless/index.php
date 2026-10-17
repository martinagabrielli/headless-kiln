<?php
/**
 * WordPress renders nothing for visitors: the public site is the Next.js app.
 * Anyone who lands on a WordPress URL is sent to the same path there.
 */

if (!defined('ABSPATH')) {
    exit;
}

$frontend = defined('KILN_FRONTEND_URL') ? untrailingslashit(KILN_FRONTEND_URL) : '';

if ($frontend !== '') {
    $path = wp_parse_url(home_url(add_query_arg([])), PHP_URL_PATH) ?: '/';
    wp_redirect($frontend . $path, 302);
    exit;
}

status_header(200);
echo '<!doctype html><title>Kiln Studio</title><p>This WordPress install is a content backend. Set KILN_FRONTEND_URL to send visitors to the site.</p>';
