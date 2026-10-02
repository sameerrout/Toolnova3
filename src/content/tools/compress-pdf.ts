import type { ToolContent } from '@/content/types';

export const compressPdfContent: ToolContent = {
  overviewHeading: 'What this PDF compressor does',
  overview: [
    'This tool reduces the size of a PDF by drawing each page onto a canvas and re-encoding the result as a compressed image, then assembling those images into a new PDF. In other words, it rasterises the document. Three quality levels are offered, from one that keeps small print readable to one that trades sharpness for the smallest file.',
    'It is aimed at documents that are genuinely too big: scans from an office copier, photographed paperwork, image-heavy brochures, anything built from pictures of pages. In those files the images account for nearly all the bytes, so re-encoding them makes a real difference. A PDF that is mostly text behaves very differently, because its size comes from fonts and drawing instructions.',
    'That difference is worth understanding before you press the button. Compressing a text-only document will barely change its size and can make it slightly larger, because a page of crisp text stored as a picture costs more than the same page stored as text. This kind of compression is a trade between size and fidelity, and it is never lossless.',
  ],
  howTo: {
    heading: 'How to compress a PDF',
    intro:
      'Work through the quality levels with the preview open, because the right setting depends on the document rather than on a rule of thumb.',
    steps: [
      {
        name: 'Add the PDF',
        text: 'Drop the file in or choose it with the picker. The tool reports the current size and indicates whether the document looks image-heavy, which hints at how much can be saved.',
      },
      {
        name: 'Pick a quality level',
        text: 'High keeps text and line art crisp and suits contracts and forms. Medium is a sensible default for scans. Low produces the smallest file and is best for documents read on screen rather than printed.',
      },
      {
        name: 'Compare the preview',
        text: 'The tool shows an estimated output size next to the original and renders a page so you can judge the result. Look at the smallest text: if it smudges or breaks up, move up a level.',
      },
      {
        name: 'Compress and check the result',
        text: 'Run the compression and open the finished document. Margins, thin rules and handwriting suffer first, so check those areas if they matter. The original on your disk is never modified.',
      },
      {
        name: 'Save the smaller file',
        text: 'Download the compressed PDF, or save it under a new name so the original stays available. If the result is still too large, try the next level down and compare the two.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF compressor',
    intro:
      'It is useful when a document is too heavy to send, and when the file in question is one you would not upload to a stranger.',
    items: [
      {
        title: 'Substantial savings on scans',
        text: 'Scanned and photographed documents shrink the most, because their bulk is image data and that is what gets re-encoded. A stack of photographed invoices can become emailable.',
      },
      {
        title: 'Three levels, one decision',
        text: 'High, medium and low cover the useful range without a wall of sliders, and each level shows an estimated output size before you commit to it.',
      },
      {
        title: 'No upload before the saving',
        text: 'Nothing is sent anywhere to be compressed. The work happens on your own processor, so there is no slow upload first and no copy left on a server afterwards.',
      },
      {
        title: 'Built for confidential paperwork',
        text: 'Contracts, payslips, medical letters and identity documents are the files people most often need to shrink and least want to hand over. Here they stay in the tab throughout.',
      },
      {
        title: 'Honest output, and a way to stop',
        text: 'The tool reports what it actually produced rather than promising a percentage, and the cancel button stops a long job and releases the work immediately.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Compression is performed by your browser using the canvas API. Images are decoded, resized and re-encoded on your own machine, and the new PDF is assembled there too. With no upload endpoint in the application, there is no route by which your document could reach a server.',
      'A consequence is that your processor does the work, which is why a large scan can take a while and why a phone may warm up slightly. The compensation is that the file never travels: a two-hundred-page scan on a slow connection compresses at the same speed as one on fibre.',
      'Once the job is finished the tab holds nothing worth keeping. No copy of the document is written to local storage or cookies, and the analytics the site loads after consent record page views only. That code has no path to your file.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Compressing a text-only PDF will barely change its size, because there are no images to re-encode. Rasterising a text page can even make the file slightly larger.',
      'Pages are rewritten as images, so text stops being selectable or searchable and any links, form fields or annotations on the page are not carried over. Keep the original if you need those.',
      'The low setting produces visible softening around small text, thin lines and handwriting. Check the preview at the size you intend to read it before replacing anything important.',
      'Password-protected PDFs cannot be opened here. Remove the password in a PDF reader and compress the unlocked copy.',
    ],
  },
  faqs: [
    {
      question: 'Why did my PDF barely get smaller?',
      answer:
        'Because most of its bytes were never images. Text, fonts and vector drawings are already stored efficiently in a PDF, so re-encoding a page as a picture has little to remove. Scanned and photographed documents shrink the most, since their size is almost entirely image data. An image-free file may even grow slightly.',
    },
    {
      question: 'What is the difference between the three quality levels?',
      answer:
        'They set how aggressively each page is re-encoded. High keeps small text and fine lines legible and suits contracts or forms. Medium is a sensible default for scans. Low produces the smallest file by discarding more detail, and suits documents read on screen rather than printed.',
    },
    {
      question: 'Will the text still be selectable after compression?',
      answer:
        'No. Each page is rendered to an image, so the output behaves like a scan: it looks the same but there is no text layer underneath to select, search or copy, and a screen reader cannot read it. If you need selectable text, keep the original and reduce the size another way.',
    },
    {
      question: 'Is this compression lossless?',
      answer:
        'No, and no tool that shrinks image-heavy PDFs meaningfully is. Compression here discards image detail that cannot be recovered, which is why a preview and an estimated size are shown before you run it, and why the original file on your disk is untouched until you save a new one.',
    },
    {
      question: 'Is the PDF sent anywhere to be compressed?',
      answer:
        'No. Your browser decodes and re-encodes the pages on your own device, and the site is deployed as static files with no backend. Opening the Network tab while a compression runs shows requests for the page and its scripts only, never for your document.',
    },
    {
      question: 'Can I compress a PDF that is too large to email?',
      answer:
        'That is the usual reason to use it. Compress at medium first and check the preview, then move down a level if you need more reduction. Mail providers also cap attachments, so check the recipient\u2019s limit. If the file is still too large, splitting it into parts is often simpler.',
    },
  ],
};
