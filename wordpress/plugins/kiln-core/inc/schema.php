<?php
/**
 * The single source of truth for every block and its fields.
 *
 * Field groups are registered from this array in code (inc/fields.php) rather
 * than built in the admin and stored in the database, so they are versioned,
 * reviewable and identical on every environment. The seed script reads the same
 * array to write demo content, so a field can never exist in one place and be
 * missing in the other.
 *
 * Field keys are derived, never typed: field_kiln_{block}_{field} and, for
 * repeater rows, field_kiln_{block}_{repeater}_{sub_field}. See kiln_field_key().
 *
 * Each field is [name, type, extra settings].
 */

if (!defined('ABSPATH')) {
    exit;
}

return [
    'hero' => [
        'title'  => 'Hero',
        'icon'   => 'cover-image',
        'fields' => [
            ['eyebrow', 'text'],
            ['heading', 'text', ['required' => 1]],
            ['text', 'textarea', ['rows' => 3]],
            ['image', 'image'],
            ['primary_link', 'link'],
            ['secondary_link', 'link'],
        ],
    ],
    'page-header' => [
        'title'  => 'Page Header',
        'icon'   => 'heading',
        'fields' => [
            ['eyebrow', 'text'],
            ['heading', 'text', ['required' => 1]],
            ['intro', 'textarea', ['rows' => 3]],
        ],
    ],
    'text-image' => [
        'title'  => 'Text and Image',
        'icon'   => 'align-pull-left',
        'fields' => [
            ['heading', 'text'],
            ['text', 'wysiwyg', ['media_upload' => 0, 'toolbar' => 'basic']],
            ['image', 'image'],
            ['image_position', 'select', [
                'choices'       => ['right' => 'Right', 'left' => 'Left'],
                'default_value' => 'right',
            ]],
            ['link', 'link'],
        ],
    ],
    'rich-text' => [
        'title'  => 'Rich Text',
        'icon'   => 'editor-paragraph',
        'fields' => [
            ['heading', 'text'],
            ['content', 'wysiwyg', ['media_upload' => 0]],
        ],
    ],
    'workshops-grid' => [
        'title'  => 'Workshops List',
        'icon'   => 'list-view',
        'fields' => [
            ['heading', 'text'],
            ['intro', 'textarea', ['rows' => 2]],
            ['limit', 'number', [
                'instructions' => 'How many workshops to show. Leave empty to show all.',
                'min'          => 1,
            ]],
        ],
    ],
    'testimonials' => [
        'title'  => 'Testimonials',
        'icon'   => 'format-quote',
        'fields' => [
            ['heading', 'text'],
            ['items', 'repeater', [
                'button_label' => 'Add testimonial',
                'sub_fields'   => [
                    ['quote', 'textarea', ['rows' => 3]],
                    ['name', 'text'],
                    ['detail', 'text', ['instructions' => 'For example, the workshop they took.']],
                ],
            ]],
        ],
    ],
    'faq' => [
        'title'  => 'FAQ',
        'icon'   => 'editor-help',
        'fields' => [
            ['heading', 'text'],
            ['items', 'repeater', [
                'button_label' => 'Add question',
                'sub_fields'   => [
                    ['question', 'text'],
                    ['answer', 'wysiwyg', ['media_upload' => 0, 'toolbar' => 'basic']],
                ],
            ]],
        ],
    ],
    'gallery' => [
        'title'  => 'Gallery',
        'icon'   => 'format-gallery',
        'fields' => [
            ['heading', 'text'],
            ['items', 'repeater', [
                'button_label' => 'Add image',
                'sub_fields'   => [
                    ['image', 'image'],
                    ['caption', 'text'],
                ],
            ]],
        ],
    ],
    'cta' => [
        'title'  => 'Call to Action',
        'icon'   => 'megaphone',
        'fields' => [
            ['heading', 'text', ['required' => 1]],
            ['text', 'textarea', ['rows' => 2]],
            ['link', 'link'],
        ],
    ],
    'contact-form' => [
        'title'  => 'Contact Form',
        'icon'   => 'email',
        'fields' => [
            ['heading', 'text'],
            ['intro', 'textarea', ['rows' => 2]],
        ],
    ],
];
