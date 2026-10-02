import type { ToolContent } from '@/content/types';

export const imageToPdfContent: ToolContent = {
  overviewHeading: 'What this image to PDF tool does',
  overview: [
    'This tool gathers photographs and scans into one tidy PDF. It accepts JPG, PNG, WebP, AVIF and BMP files, keeps them in the order you choose, and lays each on a page you control: A4, Letter, or a page sized to the image itself. Orientation, margins and fit are all adjustable.',
    'Where possible images are embedded without being re-encoded, which keeps them sharp and avoids the double compression that happens when the same photo is decoded twice. Only formats the PDF standard cannot store directly are converted.',
    'Typical jobs are ordinary ones: photographing a stack of receipts into a single record, scanning both sides of an ID card, or gathering a portfolio into one submission a client can open.',
  ],
  howTo: {
    heading: 'How to convert images to PDF',
    intro: 'The conversion runs locally and takes seconds for a normal set of photos.',
    steps: [
      {
        name: 'Add your images',
        text: 'Drag files in or browse. All five supported formats can be mixed in one batch, and rows can be reordered.',
      },
      {
        name: 'Choose a page size',
        text: 'A4 and Letter suit anything printed or formally submitted. Fit to image removes borders and suits screenshots.',
      },
      {
        name: 'Set orientation and margins',
        text: 'Automatic orientation turns each page to suit its image, so landscape photos are not squeezed onto portrait pages.',
      },
      {
        name: 'Pick how the image fits',
        text: 'Fit shows the whole picture, fill covers the page and crops, and stretch distorts the image to the page shape.',
      },
      {
        name: 'Build and download the PDF',
        text: 'The document is assembled in the tab at the images\u2019 original resolution and offered as a download.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this image to PDF tool',
    intro: 'For paperwork that has to look deliberate when someone else opens it.',
    items: [
      {
        title: 'Mixed formats in one document',
        text: 'Phone photos, screenshots and exported graphics merge in a single pass instead of being converted individually.',
      },
      {
        title: 'Embedded without needless re-encoding',
        text: 'JPEG data is copied into the PDF unchanged, so there is no second round of compression and no visible loss.',
      },
      {
        title: 'Predictable, printable pages',
        text: 'Real A4 and Letter sizes with your chosen margins print as expected rather than arriving cropped at the edge.',
      },
      {
        title: 'Order and orientation under your control',
        text: 'Reorder pages, rotate individual images, and let automatic orientation handle mixed portrait and landscape shots.',
      },
      {
        title: 'No upload, no account, no quota',
        text: 'There is no free tier of twenty files to run into, and nothing is registered or emailed to you afterwards.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Conversion happens entirely inside your browser. The site is static files with no application server behind it, so there is no upload endpoint, no temporary storage and no retention period.',
      'Your images are decoded locally, arranged into a PDF in memory and handed back as a download. Watching the Network panel during a conversion shows no request carrying your files.',
      'This matters for what people convert most: receipts carry card details, ID scans carry document numbers, and medical letters carry diagnoses. Nothing is written to cookies or local storage.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'A photograph of a page is not a scan. Camera noise and uneven lighting stay in the file, and any text is part of the picture, so it cannot be selected or searched in the finished PDF.',
      'The tool does not straighten skewed photographs, remove shadows or crop backgrounds, so square up your shots first if that matters.',
      'Batch size is limited by device memory rather than by policy. Several hundred high-resolution photos can exhaust a phone browser, so split large jobs.',
      'Each page holds a single image, so a PDF of two hundred photos is a large file and a heavy print job.',
    ],
  },
  faqs: [
    {
      question: 'Which image formats can I convert to PDF?',
      answer:
        'JPG and PNG are supported along with WebP, AVIF and BMP, and you can mix all of them in one document. JPEG images are copied into the PDF in their original compressed form, so no quality is lost. Other formats are re-encoded at high quality because PDF does not define them natively.',
    },
    {
      question: 'Are my photos uploaded anywhere?',
      answer:
        'No. The conversion runs in your browser and the site has no backend at all. Your images are read from your device, arranged into a PDF in memory and handed back as a download. Watching the Network tab in developer tools during a conversion shows no request containing your files.',
    },
    {
      question: 'How do I make the PDF pages match my images exactly?',
      answer:
        'Choose fit to image as the page size and set the margin to zero. Each page is then sized to the pixel dimensions of its image, so there are no white borders and no cropping. This suits screenshots, digital artwork and anything meant for a screen rather than paper.',
    },
    {
      question: 'Will the images lose quality when they become a PDF?',
      answer:
        'JPEG images are embedded without re-encoding, so they match the originals. PNG, WebP, AVIF and BMP must be converted because PDF does not store those formats directly, and they are written at high quality. Photos usually look the same, while transparent graphics are flattened onto a background.',
    },
    {
      question: 'Can I control the order of the pages?',
      answer:
        'Yes. Pages appear in the order you added the files, and you can drag rows to rearrange them before converting. Individual images can be rotated if they were taken sideways, and any file can be removed from the list if you change your mind.',
    },
    {
      question: 'Is there a limit on how many images I can combine?',
      answer:
        'There is no fixed limit, because nothing is uploaded and no quota applies. The real ceiling is device memory, since a few hundred high-resolution photographs in one document can be too much for a phone browser. Splitting a very large job into two or three documents keeps it reliable.',
    },
  ],
};
