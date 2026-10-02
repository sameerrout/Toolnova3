import type { ToolContent } from '@/content/types';

export const compressImageContent: ToolContent = {
  overviewHeading: 'What this image compressor does',
  overview: [
    'This tool makes image files smaller. You can compress by quality, moving a slider until the preview looks acceptable, or by target size, where you type a limit in kilobytes and the tool finds the highest quality that still fits. JPG, PNG, WebP and AVIF are supported, and the output format can change at the same time.',
    'Format often matters more than the quality slider. A screenshot saved as PNG is frequently far larger than it needs to be, and converting it to high-quality JPG or WebP cuts the size substantially with little visible change. Photographs are already compressed, so WebP or AVIF usually beats lowering JPEG quality alone.',
    'Batches of up to sixty files are processed together, and results can be downloaded individually or as one ZIP archive.',
  ],
  howTo: {
    heading: 'How to compress images',
    intro: 'Compression is quick, and the preview updates so you judge the result rather than guessing.',
    steps: [
      {
        name: 'Add your images',
        text: 'Drop in up to sixty files at once. The list shows each original size and the batch total before you change anything.',
      },
      {
        name: 'Choose quality mode or target size mode',
        text: 'Quality mode suits careful visual judgement. Target size mode suits a hard limit, such as a form that rejects heavy uploads.',
      },
      {
        name: 'Set the value and check the preview',
        text: 'Slide down until artefacts appear, then step back up. Target size mode finds the best quality that meets your limit.',
      },
      {
        name: 'Pick an output format',
        text: 'WebP and AVIF usually give the smallest files, JPG is the most widely accepted, and PNG is right when transparency must be kept.',
      },
      {
        name: 'Compress and download',
        text: 'Compare before and after sizes in the results list, then save files individually or take the whole set as one ZIP.',
      },
    ],
  },
  benefits: {
    heading: 'Why compress images here',
    intro: 'For hitting an upload limit, shrinking a gallery, and emailing photos that are currently too heavy.',
    items: [
      {
        title: 'A target size that is actually met',
        text: 'You state the limit and the tool finds the best quality that fits, so you know the file is small enough.',
      },
      {
        title: 'Format conversion included',
        text: 'A folder of oversized PNG screenshots becomes compact WebP in one pass instead of two separate jobs.',
      },
      {
        title: 'Batch work with a real overview',
        text: 'Up to sixty files at once, with the saving shown per file, so the one image that barely shrank stands out.',
      },
      {
        title: 'No upload, so no upload wait',
        text: 'Compression starts immediately rather than after a transfer, and a folder of photographs never leaves your laptop.',
      },
      {
        title: 'Quality you can see before committing',
        text: 'The preview shows the compressed result, so the decision about visible artefacts is made on the real output.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Compression here is local work. The browser decodes each file, re-encodes it with your settings and offers the result as a download. The site is static and has no backend, so there is no upload endpoint.',
      'That matters for the images people compress most: personal albums, scanned documents, client photography and screenshots of internal dashboards all routinely pass through free online compressors, which receive a full copy first.',
      'Once loaded, the tool keeps working with the network disconnected. Nothing about your files or settings is written to local storage, and closing the tab releases the processed images.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Compression by quality or target size is lossy. Discarded detail is gone for good, so keep your originals and compress copies instead of the only version you have.',
      'PNG output ignores the quality slider, because PNG compression is lossless. To make a PNG genuinely smaller you must convert it to a lossy format or accept modest savings.',
      'Target size mode lowers quality until the limit is met. Under a very small limit such as twenty kilobytes the result looks visibly degraded, especially text on a screenshot.',
      'Converting a transparent image to JPG fills the transparent area with a solid colour of your choosing, so keep PNG, WebP or AVIF output when transparency matters.',
    ],
  },
  faqs: [
    {
      question: 'Will compressing an image reduce its quality?',
      answer:
        'Yes, if you use quality or target size mode, because both re-encode the image with less detail. The aim is to compress only as far as the purpose requires: a web thumbnail can lose a great deal, a print image very little. Keep the original, since compression cannot be undone.',
    },
    {
      question: 'How does compression to an exact file size work?',
      answer:
        'The tool encodes the image at a series of quality settings and narrows in on the highest quality that still fits your limit, which is quicker and more reliable than adjusting a slider by hand. If even the lowest sensible quality overshoots, it scales the image down slightly as well.',
    },
    {
      question: 'Which format gives the smallest file?',
      answer:
        'For photographs, AVIF is usually smallest, followed by WebP, then JPG. For screenshots, diagrams and graphics with flat colours, converting PNG to WebP or high-quality JPG often cuts the size substantially. Compatibility differs, so choose WebP or JPG when the image must work in older software.',
    },
    {
      question: 'Are my images uploaded to a server to be compressed?',
      answer:
        'No. Compression runs in your browser using the canvas encoding APIs. This site is static files with no application server, so there is nowhere for images to be sent. Watching the Network tab in developer tools during a batch shows no request carrying your files.',
    },
    {
      question: 'How many images can I compress at once?',
      answer:
        'Up to sixty files per batch. The limit keeps memory use reasonable on phones and tablets, because each image must be decoded into memory before it is re-encoded. Work through a larger collection in batches, and your chosen settings are retained between runs.',
    },
    {
      question: 'Can I compress a PNG and keep its transparency?',
      answer:
        'Yes, by keeping PNG as the output format, although savings will be modest because PNG compression is already lossless. Converting a transparent image to JPG requires a solid background colour, which the tool asks you to choose. WebP and AVIF keep transparency and usually compress better than PNG.',
    },
  ],
};
