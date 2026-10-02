import type { ToolContent } from '@/content/types';

export const watermarkPdfContent: ToolContent = {
  overviewHeading: 'What this PDF watermark tool does',
  overview: [
    'This tool draws a text watermark across the pages of a PDF: Draft, Confidential, a client name, a date, a reference number, or anything else you type. You control the wording, the font size, the colour, the opacity, the rotation angle and whether the text sits once on the page or repeats in a tiled pattern.',
    'The text is drawn with PDF-LIB using the standard Type 1 fonts that every PDF reader already knows: Helvetica, Times and Courier, each in regular, bold, italic and bold italic. Those font definitions are part of the PDF specification, so nothing is downloaded to render your watermark and the finished file grows by only a few kilobytes.',
    'Because the watermark is real text rather than a stamped image, it stays sharp at any zoom level and prints cleanly at any size. It is worth being clear about what it is not: a watermark is a notice, not a lock. Anyone with a PDF editor can remove or cover it. For actual protection you want encryption, which is what the Protect PDF tool provides.',
  ],
  howTo: {
    heading: 'How to add a watermark to a PDF',
    intro:
      'Set the wording and appearance first, then check the preview, because a watermark that is too dark makes a document hard to read.',
    steps: [
      {
        name: 'Open the PDF',
        text: 'Add the PDF by dropping it in or browsing for it. The first page is rendered so every change is visible against real content rather than a blank sheet.',
      },
      {
        name: 'Type the watermark text',
        text: 'Enter the wording you want, such as Draft or Confidential, then pick a style: Helvetica for a clean look, Times for something more formal, Courier for a typewriter feel. Choose a size that reads easily without swamping the page.',
      },
      {
        name: 'Set colour and opacity',
        text: 'Choose a colour and bring the opacity down. Somewhere between ten and thirty per cent is usually enough for the watermark to be noticed while the text underneath stays readable. Full opacity in a dark colour will obscure the page.',
      },
      {
        name: 'Choose a position or tiling',
        text: 'Place the watermark once in one of the preset positions, or tile it so the text repeats across the page. Tiling is harder to crop out of a screenshot; a single placement is quieter. A diagonal angle near forty-five degrees is the conventional look.',
      },
      {
        name: 'Apply and save',
        text: 'Run the watermark and check a page with dense text and one with a large image, since the effect reads differently on each. Save the result under a new name so your original stays unmarked.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF watermark tool',
    intro:
      'It covers the everyday jobs: marking a draft, labelling a client copy, or making it obvious where a document came from.',
    items: [
      {
        title: 'Fonts that are always available',
        text: 'The standard Type 1 fonts are built into the PDF format, so your watermark renders on a machine that has never seen your fonts. No font file is downloaded or embedded.',
      },
      {
        title: 'Sharp text, small files',
        text: 'Because the watermark is drawn as text rather than pasted as a picture, it stays crisp at every zoom level and adds only a few kilobytes. An image stamp would blur when magnified and cost far more space.',
      },
      {
        title: 'Quiet enough to read through',
        text: 'Opacity, colour and rotation can be combined so the watermark is clearly visible without hiding the content. A lower opacity is the difference between a usable document and a reprint.',
      },
      {
        title: 'One stamp or a full pattern',
        text: 'A phrase in a corner is enough for an internal draft. A repeated diagonal pattern is better when a page may be photographed, because a single mark is easy to crop out of a picture.',
      },
      {
        title: 'No upload, no account',
        text: 'The document stays in your browser for the whole job. That matters when the file is a contract, a payslip or a medical report, and it means there is nothing to sign up for.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'The watermark is drawn locally. Your browser opens the PDF from your disk, PDF-LIB adds the text to each page, and the new file is handed back as a download. The site is served as static files with no backend, so there is no upload step in this tool.',
      'There is a less obvious benefit to using standard fonts: no font file has to be fetched from a content network to render your wording. The page itself is the only thing that loads.',
      'The tool forgets your document as soon as the tab closes. Watermark wording, file names and page content never reach storage, cookies or a server. The only third-party script on the page is opt-in analytics for page views, and it sees nothing from inside your file.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'A watermark is not a security measure. It can be removed or covered by anyone with a PDF editor, and it does not stop copying, screenshots or printing. Use encryption when a document must actually be restricted.',
      'The watermark is applied to every page. To mark only part of a document, split out the pages you need, watermark that file, then merge it back with the rest.',
      'The standard fonts cover Western European languages, including accented characters, but not scripts such as Cyrillic, Greek, Arabic, Hebrew, Devanagari or Chinese. Those need an embedded font, which this tool does not use.',
      'The watermark sits above the page content. At high opacity and a central position it will cover text, so a low opacity or an edge placement usually suits dense documents better.',
    ],
  },
  faqs: [
    {
      question: 'Does a watermark protect my PDF from copying?',
      answer:
        'No. A watermark is a visible notice, not an access control. Anyone with a PDF editor can delete the layer or paint over it, and it does not prevent screenshots, text copying or printing. If a document genuinely needs restricting, apply encryption and a password with the Protect PDF tool instead.',
    },
    {
      question: 'Can I watermark only certain pages?',
      answer:
        'The watermark is applied to every page of the document you load. To mark only some of them, split the PDF first, watermark the part that needs it, then merge the watermarked file back with the untouched pages using the Split PDF and Merge PDF tools. The result matches a per-page option.',
    },
    {
      question: 'Will the watermark appear correctly on another computer?',
      answer:
        'Yes. The watermark uses the standard Type 1 fonts defined in the PDF specification, which every reader has built in, so it renders the same on a Windows PC, a Mac, a phone or a print shop machine. No font installation or download is required at either end.',
    },
    {
      question: 'Can I use non-English text in a watermark?',
      answer:
        'Accented Western European characters work, including the letters used in French, German, Spanish, Portuguese and the Nordic languages. Other writing systems, such as Cyrillic, Greek, Arabic, Hebrew, Devanagari or Chinese, are not covered by the standard fonts this tool relies on, so those characters will not render.',
    },
    {
      question: 'How light should the watermark be?',
      answer:
        'Most documents look right at roughly ten to thirty per cent opacity with a mid-tone colour. Start near twenty per cent, check the preview against a page of dense text, and lower it if the wording competes with the content. A watermark that cannot be read through is usually a reprint waiting to happen.',
    },
    {
      question: 'Is the document uploaded, and can I use this offline?',
      answer:
        'Nothing is uploaded. The watermark is drawn in your browser tab and the file never leaves your device, so no account is needed and there is no server copy. Once the page has loaded it works with no connection at all, which suits confidential paperwork on a restricted network.',
    },
  ],
};
