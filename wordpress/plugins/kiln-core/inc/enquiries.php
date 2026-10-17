<?php
/**
 * Contact form endpoint: POST /wp-json/kiln/v1/enquiries
 *
 * Only the Next.js server calls this. Visitors post to Next.js, which checks the
 * form (honeypot, rate limit, field sizes) and forwards it with a shared secret
 * in the X-Kiln-Secret header. Each enquiry is saved as a private post, so
 * nothing is lost if email delivery fails, and the studio is emailed a copy.
 *
 *   KILN_ENQUIRY_SECRET   shared with Next.js ENQUIRY_SECRET
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('kiln/v1', '/enquiries', [
        'methods'             => 'POST',
        'permission_callback' => function (WP_REST_Request $request) {
            $sent = (string) $request->get_header('x-kiln-secret');
            return defined('KILN_ENQUIRY_SECRET') && $sent !== '' && hash_equals(KILN_ENQUIRY_SECRET, $sent);
        },
        'args' => [
            'name'     => ['required' => true, 'type' => 'string', 'maxLength' => 120, 'sanitize_callback' => 'sanitize_text_field'],
            'email'    => ['required' => true, 'type' => 'string', 'format' => 'email', 'sanitize_callback' => 'sanitize_email'],
            'message'  => ['required' => true, 'type' => 'string', 'maxLength' => 4000, 'sanitize_callback' => 'sanitize_textarea_field'],
            'workshop' => ['required' => false, 'type' => 'string', 'maxLength' => 200, 'sanitize_callback' => 'sanitize_text_field'],
        ],
        'callback' => 'kiln_create_enquiry',
    ]);
});

function kiln_create_enquiry(WP_REST_Request $request)
{
    $name     = $request['name'];
    $email    = $request['email'];
    $message  = $request['message'];
    $workshop = $request['workshop'] ?? '';

    if (!is_email($email)) {
        return new WP_Error('kiln_invalid_email', 'Enter a valid email address.', ['status' => 400]);
    }

    $subject = $workshop !== '' ? "Enquiry about {$workshop}" : 'General enquiry';

    $post_id = wp_insert_post([
        'post_type'    => 'enquiry',
        'post_status'  => 'private',
        'post_title'   => "{$name}: {$subject}",
        'post_content' => $message,
        'meta_input'   => [
            'enquiry_name'     => $name,
            'enquiry_email'    => $email,
            'enquiry_workshop' => $workshop,
        ],
    ], true);

    if (is_wp_error($post_id)) {
        return new WP_Error('kiln_enquiry_not_saved', 'The enquiry could not be saved.', ['status' => 500]);
    }

    $studio_email = function_exists('get_field') ? get_field('email', 'option') : '';
    $to = is_email($studio_email) ? $studio_email : get_option('admin_email');

    wp_mail(
        $to,
        "[Kiln Studio] {$subject}",
        "From: {$name} <{$email}>\n\n{$message}",
        ["Reply-To: {$name} <{$email}>"]
    );

    return new WP_REST_Response(['id' => $post_id], 201);
}

// Show who sent each enquiry on its edit screen.
add_action('add_meta_boxes_enquiry', function () {
    add_meta_box('kiln-enquiry-sender', 'Sender', function (WP_Post $post) {
        $email = get_post_meta($post->ID, 'enquiry_email', true);
        printf(
            '<p><strong>%s</strong><br><a href="mailto:%s">%s</a></p><p>%s</p>',
            esc_html(get_post_meta($post->ID, 'enquiry_name', true)),
            esc_attr($email),
            esc_html($email),
            esc_html(get_post_meta($post->ID, 'enquiry_workshop', true) ?: 'General enquiry')
        );
    }, 'enquiry', 'side');
});
