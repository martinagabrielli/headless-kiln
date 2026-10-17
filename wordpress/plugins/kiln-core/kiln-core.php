<?php
/**
 * Plugin Name: Kiln Core
 * Description: Content model, blocks and GraphQL schema for the headless Kiln Studio site.
 * Version:     1.0.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Requires Plugins: wp-graphql
 * Author:      Martina Gabrielli
 * License:     MIT
 *
 * Everything the site needs lives in this plugin rather than the theme, so the
 * content model survives a theme switch and the theme stays a placeholder.
 * It needs WPGraphQL plus Secure Custom Fields or ACF PRO.
 */

if (!defined('ABSPATH')) {
    exit;
}

define('KILN_CORE_DIR', plugin_dir_path(__FILE__));

require_once KILN_CORE_DIR . 'inc/fields.php';
require_once KILN_CORE_DIR . 'inc/post-types.php';
require_once KILN_CORE_DIR . 'inc/blocks.php';
require_once KILN_CORE_DIR . 'inc/graphql.php';
require_once KILN_CORE_DIR . 'inc/frontend.php';
require_once KILN_CORE_DIR . 'inc/enquiries.php';

add_action('admin_notices', function () {
    if (function_exists('acf_add_local_field_group')) {
        return;
    }
    echo '<div class="notice notice-error"><p>Kiln Core needs Secure Custom Fields or ACF PRO. '
        . 'Install one of them to edit blocks and workshops.</p></div>';
});
