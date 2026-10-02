import type { ToolContent } from '@/content/types';

export const resizeImageContent: ToolContent = {
  overviewHeading: 'What this image resizer does',
  overview: [
    'This tool changes the pixel dimensions of an image. You can type exact width and height, scale by percentage, or pick a preset for a social platform, a print size or a common screen size. An aspect-ratio lock keeps proportions correct while you work, so a portrait photo does not end up stretched.',
    'How a resize is done decides how good it looks. Shrinking a large photograph in one jump drops pixels unevenly, producing jagged edges and moire patterns on detail such as brickwork, fabric or hair. This tool halves the image down in steps first, then finishes with a high-quality pass.',
    'There is a ceiling worth knowing: enlarging an image does not add real detail, only interpolated pixels that look softer than a genuine high-resolution original.',
  ],
  howTo: {
    heading: 'How to resize an image',
    intro: 'Set the target size, then apply the same settings across a batch.',
    steps: [
      {
        name: 'Add your images',
        text: 'Drop in one file or up to sixty. Each row shows the current dimensions and aspect ratio before you change anything.',
      },
      {
        name: 'Choose pixels, percentage or a preset',
        text: 'Pixels is precise when a platform states a requirement, percentage is quick for halving, and presets cover common sizes.',
      },
      {
        name: 'Keep the aspect ratio locked unless you mean to change it',
        text: 'With the lock on, editing one dimension adjusts the other. Turn it off only when a form demands a fixed shape.',
      },
      {
        name: 'Decide what to do about the format',
        text: 'Keep JPG for small photographic files, PNG for graphics and transparency, or convert to WebP or AVIF for the smallest result.',
      },
      {
        name: 'Resize the batch and download',
        text: 'Every file is processed with the same rules, which suits product photos that must match. Save them individually or as one ZIP.',
      },
    ],
  },
  benefits: {
    heading: 'Why resize images here',
    intro: 'For batches that need identical treatment, and for anyone who has seen a good photo ruined by a careless downscale.',
    items: [
      {
        title: 'Step-down resampling that keeps detail',
        text: 'Halving repeatedly gives the algorithm far less to lose on each pass, so fine texture and thin lines survive.',
      },
      {
        title: 'Presets that match real requirements',
        text: 'Social, print and screen sizes are provided, so you need not convert between inches and pixels at a given resolution.',
      },
      {
        title: 'One setting across a whole batch',
        text: 'Sixty images resized to the same dimensions in one action, which turns a tedious evening into a single step.',
      },
      {
        title: 'Honest about enlargement',
        text: 'The tool tells you when you are upscaling rather than quietly producing a soft, oversized file.',
      },
      {
        title: 'Your files are not uploaded',
        text: 'Client photography and personal albums stay on your device, with no account to create and no connection required.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Every pixel is rearranged inside your browser tab. The site is static files with no application server, so there is no upload step and no copy of your image anywhere else.',
      'The browser decodes the image, draws it repeatedly onto an offscreen canvas during the step-down process, and encodes the final result. Nothing about the files or your settings is stored in cookies.',
      'Resizing is often the last step before publishing, so unreleased designs and pre-launch marketing assets are exactly the files that pass through online resizers. Doing it locally removes the question.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Enlarging cannot add real detail. Upscaled images are interpolated from existing pixels, so they look softer on close inspection and will not match a genuine higher-resolution original.',
      'Resizing alone does not always shrink a file much. A large PNG at half its dimensions can still be heavy, because format and encoding matter more than dimensions.',
      'Resampling is lossy. Resizing down and back up leaves an image visibly softer, so always work from the source rather than a previously resized copy.',
      'Turning the aspect-ratio lock off distorts the subject. Cropping to the target shape almost always looks better than stretching to it.',
    ],
  },
  faqs: [
    {
      question: 'What is the difference between resizing and compressing an image?',
      answer:
        'Resizing changes the pixel dimensions, so a 4000 by 3000 photo becomes 800 by 600. Compressing keeps the dimensions and reduces file size by encoding with less detail. Both make a file smaller for different reasons. Resize when a platform specifies dimensions, and compress when it sets a maximum file weight.',
    },
    {
      question: 'Why does a step-down resize look better than a single one?',
      answer:
        'Because resampling discards pixels, and one large jump means each surviving pixel is drawn from a wide, uneven neighbourhood, which produces jagged edges and moire patterns on fine detail. Halving repeatedly keeps each step small and local, so texture and thin lines stay smooth before the final precise pass.',
    },
    {
      question: 'Can I make an image larger without losing quality?',
      answer:
        'Not really. Enlargement fills in new pixels by interpolation, so fine detail is guessed rather than recovered and the result looks softer than the original. Slight enlargement is usually acceptable, while doubling the size of a small image rarely is. The tool flags upscaling so you know what you are asking for.',
    },
    {
      question: 'How do I resize several images to the same size at once?',
      answer:
        'Add up to sixty files and set the dimensions once, and every image is processed with the same rules. This works well when all the sources share an aspect ratio, such as photos from one camera. If their shapes differ, check the aspect-ratio lock before running the batch.',
    },
    {
      question: 'Does resizing remove the transparent background of a PNG?',
      answer:
        'No, provided you keep PNG, WebP or AVIF as the output format, because transparency is preserved exactly. Switching to JPG loses it, since JPG has no alpha channel, so the tool asks which solid colour should fill the transparent areas instead.',
    },
    {
      question: 'What size should I use for social media or print?',
      answer:
        'Treat the presets as a starting point. Social platforms publish recommended pixel dimensions and they change over time, so check current guidance when exactness matters. For print, multiply the physical size in inches by 300, which makes a 6 by 4 inch print roughly 1800 by 1200 pixels.',
    },
  ],
};
