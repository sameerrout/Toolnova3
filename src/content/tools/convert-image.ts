import type { ToolContent } from '@/content/types';

export const convertImageContent: ToolContent = {
  overviewHeading: 'What this image converter does',
  overview: [
    'This tool converts images between the formats browsers and websites actually use. You can open JPG, PNG, WebP, AVIF, BMP and GIF files and write out JPG, PNG, WebP or AVIF. Quality is adjustable for the lossy formats, so you can trade file size against detail rather than accepting a fixed setting.',
    'Transparency is handled explicitly. PNG, WebP and AVIF carry an alpha channel, so transparent areas survive a conversion between them. JPG has no alpha channel at all, so transparent pixels must become something, and the tool asks you to choose the background colour instead of painting them black.',
    'Two limits catch people out. Photographs from an iPhone are usually HEIC or HEIF, which most browsers cannot decode, so they cannot be converted here. Animated GIFs are converted as a single still frame, so the motion is lost.',
  ],
  howTo: {
    heading: 'How to convert an image',
    intro: 'Conversion is immediate, and one target format can be applied to a whole batch.',
    steps: [
      {
        name: 'Add your images',
        text: 'Drag files in or browse. Formats can be mixed in one batch, because the source format does not restrict the output.',
      },
      {
        name: 'Choose the output format',
        text: 'JPG for maximum compatibility, PNG for lossless quality and transparency, WebP for balance, or AVIF for the smallest files.',
      },
      {
        name: 'Set the quality for lossy formats',
        text: 'JPG, WebP and AVIF accept a quality value. Higher settings keep more detail and produce larger files, while PNG ignores it.',
      },
      {
        name: 'Handle transparency if there is any',
        text: 'If the source is transparent and you choose JPG, pick a fill colour such as white. PNG, WebP and AVIF keep the transparency.',
      },
      {
        name: 'Convert and download',
        text: 'File names are kept and only the extension changes, so converted results stay easy to match with the originals.',
      },
    ],
  },
  benefits: {
    heading: 'Why convert images here',
    intro: 'Useful when a website, a form or a device insists on a format you do not have.',
    items: [
      {
        title: 'One tool for the formats that matter',
        text: 'Six input formats and four outputs cover website assets, print files, app icons and screenshots without switching tools.',
      },
      {
        title: 'Transparency dealt with honestly',
        text: 'Alpha channels are preserved where possible, and where they are not you choose the replacement colour in advance.',
      },
      {
        title: 'Quality you decide',
        text: 'A single control sets how much detail the encoder keeps, from a small web file to a near-original archive copy.',
      },
      {
        title: 'Modern formats without extra software',
        text: 'Converting to WebP or AVIF normally means an image editor or a command line tool. Here it is a dropdown.',
      },
      {
        title: 'Batch conversion with a ZIP download',
        text: 'Mixed folders convert in one pass, and the ZIP keeps everything together instead of triggering a dozen downloads.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Conversion happens inside your browser using its built-in decoding and encoding. This site is static files with no application server, so nothing could receive your images even if it were wanted.',
      'Your file is decoded from disk, drawn to an offscreen canvas where the format changes, and encoded into a download. No file names or settings are recorded, and memory is released when the tab closes.',
      'One detail matters for photographs. Camera images often carry EXIF metadata including the device, the date and, frequently, GPS coordinates. Re-encoding through a canvas discards that metadata, so a converted photo does not carry its location with it.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'HEIC and HEIF files, which iPhones produce by default, cannot be decoded by most browsers and therefore cannot be converted here. Export them as JPG from the Photos app first.',
      'Animated GIFs convert as a single still frame. The animation is not carried into any output format, so a converted GIF shows only its first frame.',
      'Repeated conversion between lossy formats degrades the image a little each time, so work from the best original you have rather than a previously converted copy.',
      'AVIF encoding is not available in every browser version. Where it is unsupported the option is not offered rather than being substituted silently.',
    ],
  },
  faqs: [
    {
      question: 'Can I convert HEIC photos from my iPhone?',
      answer:
        'Not in the browser, and this is a limitation of browser decoding rather than of this tool. Chrome, Firefox, Edge and Safari do not decode HEIC or HEIF images on the web. Export the photos as JPG from the Photos app, or set the iPhone camera format to most compatible, then convert them here.',
    },
    {
      question: 'What happens to transparent areas when I convert to JPG?',
      answer:
        'JPG has no alpha channel, so transparency cannot be kept and transparent pixels must become a solid colour. The tool asks which colour to use, with white the common choice for documents and product shots. If transparency matters, convert to PNG, WebP or AVIF instead, which all preserve it.',
    },
    {
      question: 'Will converting a GIF keep the animation?',
      answer:
        'No. An animated GIF is converted as a single still frame, so the motion is lost. Every output format available here is a still image format. If you need to keep an animation, convert it to a video format with a video tool rather than an image converter.',
    },
    {
      question: 'Which format should I choose for a website?',
      answer:
        'WebP is a sensible default, since all current browsers support it, it compresses well and it keeps transparency. AVIF usually produces smaller files but takes longer to encode and has newer support. JPG remains the most universally accepted format, while PNG repays its extra size on graphics with sharp edges.',
    },
    {
      question: 'Does converting an image reduce its quality?',
      answer:
        'Converting to a lossy format such as JPG, WebP or AVIF does discard some detail, and how much depends on the quality value you choose. Converting to PNG is lossless. Repeated conversion between lossy formats accumulates small losses, so convert from the best original you have.',
    },
    {
      question: 'Is there a limit on how many images I can convert at once?',
      answer:
        'Batches are handled together and the practical limit is device memory, because each image must be decoded before it is re-encoded. A few dozen high-resolution photographs is comfortable on a desktop and can be slow on a phone. Splitting a very large folder into several runs works well.',
    },
  ],
};
