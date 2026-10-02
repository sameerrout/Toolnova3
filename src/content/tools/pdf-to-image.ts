import type { ToolContent } from '@/content/types';

export const pdfToImageContent: ToolContent = {
  overviewHeading: 'What this PDF to image tool does',
  overview: [
    'This tool turns PDF pages into image files. Each page is rendered onto a canvas by pdf.js and saved as a PNG or JPG. You choose how much detail you want and which pages to convert, then download them one at a time or as a single ZIP archive.',
    'Resolution matters most. A higher scale gives a larger, sharper image with legible small print, which is what you want for printing. A lower scale is quicker and smaller, which suits thumbnails and previews.',
    'People use it to pull a chart out of a report, turn a certificate into an image for a website, or send one page to somebody who cannot open PDFs.',
  ],
  howTo: {
    heading: 'How to convert a PDF to images',
    intro: 'Rendering starts as soon as the file is open.',
    steps: [
      {
        name: 'Open your PDF',
        text: 'Drag the file in or browse. The first page renders straight away so you can judge settings against real content.',
      },
      {
        name: 'Choose PNG or JPG',
        text: 'PNG is lossless and keeps text crisp at a larger size. JPG is smaller and suits photographic pages.',
      },
      {
        name: 'Set the resolution',
        text: 'Move the scale slider until the preview text is readable, and watch the pixel dimensions update as you go.',
      },
      {
        name: 'Pick the pages to render',
        text: 'Convert everything or type a range such as 1-5, 8, 12-14, which helps when only a few pages carry the charts.',
      },
      {
        name: 'Download one page or all of them',
        text: 'Save pages individually, or build a ZIP whose files are named in page order so the sequence survives extraction.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF to image tool',
    intro: 'For getting a page out of a PDF and into something you can paste or print.',
    items: [
      {
        title: 'Real control over resolution',
        text: 'You choose the scale and see the resulting pixel dimensions, which separates a thumbnail from a printable image.',
      },
      {
        title: 'PNG for quality, JPG for size',
        text: 'Text and line drawings stay sharp as PNG, while photographic pages compress far better as JPG at adjustable quality.',
      },
      {
        title: 'Convert only the pages you need',
        text: 'On a long report you can render three pages rather than two hundred, saving time, memory and disk space.',
      },
      {
        title: 'ZIP download for whole documents',
        text: 'Every rendered page arrives in one archive with numbered names, so a catalogue can be rebuilt in order.',
      },
      {
        title: 'No upload, no account, no watermark',
        text: 'Confidential documents are not sent to a conversion service, and the images come back completely clean.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'The PDF is opened and rendered entirely in your browser. There is no backend and no conversion service, so a contract or medical report never leaves the device it was opened on.',
      'pdf.js reads the file from your disk and draws pages onto a canvas, which becomes a downloadable image. Nothing is logged, and the rendered pages are released when the tab closes.',
      'The site works offline once loaded. The background removal tool elsewhere on this site fetches model weights once; this tool fetches nothing.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Rasterising removes selectable text, links, form fields and bookmarks. The image shows what the page looked like, but it is not a searchable document.',
      'High scale settings on long PDFs use a lot of memory and take noticeably longer, and a phone browser can struggle with a fifty-page report at four times scale.',
      'Password-protected PDFs cannot be rendered until they are unlocked, and this tool does not attempt to break encryption.',
    ],
  },
  faqs: [
    {
      question: 'Does converting a PDF to an image remove the text?',
      answer:
        'Yes. The page is drawn as pixels, so the result is a picture of the page rather than the page itself. Text can no longer be selected, searched or copied, and links, form fields and bookmarks are lost. Keep the original PDF if you need those things later.',
    },
    {
      question: 'What resolution should I use for a readable image?',
      answer:
        'It depends on the destination. Around double scale gives a comfortable screen image for reading on a monitor. For printing, aim for text several hundred pixels tall, which usually means three or four times scale. Raise the scale until the preview text stops looking soft.',
    },
    {
      question: 'Should I choose PNG or JPG?',
      answer:
        'Choose PNG for pages that are mostly text, line drawings or screenshots, because it keeps edges and small type crisp. Choose JPG for photographic pages, scans with paper texture, or when the file must be small enough to email. JPG is lossy, so low quality settings blur text.',
    },
    {
      question: 'Can I convert only some pages of the PDF?',
      answer:
        'Yes. Enter a range such as 2-6, or a list like 1, 4, 9-11, and only those pages are rendered. This is the fastest way to work with a long report where you need a couple of charts, and it keeps memory use low on big documents.',
    },
    {
      question: 'Is my PDF uploaded when I convert it?',
      answer:
        'No. The process runs in your browser using pdf.js and the canvas API. The site is static files with no application server, so there is no endpoint that could receive your document. Watching the Network tab in developer tools during a conversion confirms this.',
    },
    {
      question: 'How do I download every page at once?',
      answer:
        'Switch on the ZIP option before converting. Each rendered page is added to one archive with numbered file names in page order, so extracting it gives you a folder to page through in sequence rather than a jumble of loose files with unpredictable ordering.',
    },
  ],
};
