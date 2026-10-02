import type { ToolContent } from '@/content/types';

export const editPdfContent: ToolContent = {
  overviewHeading: 'What this PDF editing tool does',
  overview: [
    'This tool lets you mark up a PDF and save the result as a new document. You can place text boxes, highlight passages, draw rectangles around figures, and sketch freehand lines or signatures. Each page is rendered so you work against the real layout, and page count and dimensions are preserved on export.',
    'Your marks are flattened into the saved file. That is deliberate: a flattened PDF looks identical in every reader and cannot be moved or deleted by a recipient.',
    'Be clear about what this is not. It is not a word processor for PDFs. Existing paragraphs cannot be retyped or reflowed, because PDF stores text as positioned glyphs. Genuine content changes need the original source document.',
  ],
  howTo: {
    heading: 'How to edit a PDF',
    intro: 'Your annotations are drawn straight onto the rendered page.',
    steps: [
      {
        name: 'Open the PDF and find your page',
        text: 'Drop the file in and navigate to the section you need. Pages render at full size, so marks land where you expect.',
      },
      {
        name: 'Add a text box where something needs saying',
        text: 'Choose the text tool, click where the note belongs and type. Font size, colour and opacity are adjustable.',
      },
      {
        name: 'Highlight, box or underline what matters',
        text: 'Highlight lays a translucent colour over a passage, while rectangles and lines frame a figure, total or clause.',
      },
      {
        name: 'Draw or sign freehand',
        text: 'The pen follows your pointer or finger, which is the practical way to add a signature, initials or a tick.',
      },
      {
        name: 'Flatten the annotations and save',
        text: 'Saving writes your marks permanently into a new PDF. The original stays untouched, so a clean copy is available.',
      },
    ],
  },
  benefits: {
    heading: 'Why edit a PDF in the browser',
    intro: 'For the edits most people actually need: comments, corrections and signatures.',
    items: [
      {
        title: 'The document never leaves your device',
        text: 'Contracts, HR paperwork and financial statements are the files people annotate, and the ones that should not be uploaded.',
      },
      {
        title: 'Annotations flattened into the file',
        text: 'Your marks become part of the page, so the recipient sees exactly what you sent in any reader.',
      },
      {
        title: 'Familiar markup tools in one place',
        text: 'Text, highlight, rectangle, line and freehand cover most annotation jobs without a publishing suite.',
      },
      {
        title: 'Sign and tick forms without printing',
        text: 'A form that arrives as a PDF can be completed and returned without a printer or a scanner.',
      },
      {
        title: 'No account, no subscription, no watermark',
        text: 'There is no trial, no export credit and no branding on your pages, and it works offline once loaded.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'No server is involved. The page is static, and the PDF is opened, rendered, annotated and re-saved inside your browser tab, so no copy exists anywhere else.',
      'pdf.js renders each page to a canvas, your annotations are layered over it, and the marked pages are written into a fresh PDF when you save. No file names or page contents are stored in cookies.',
      'Annotated documents often contain information you would not want indexed, so the output is a self-contained file with your marks baked in.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Existing PDF text cannot be edited, retyped or reflowed. You can cover an area and add a correction on top, but the original wording stays underneath.',
      'Flattened annotations cannot be selected, moved or removed individually afterwards, so keep the original PDF if you may want a different version.',
      'Added text uses a standard PDF font rather than matching the document typeface, which is visible on formal documents. Use it for notes rather than replacement copy.',
      'A heavily annotated file can grow somewhat larger, because the rendered page and the flattened marks are both stored.',
    ],
  },
  faqs: [
    {
      question: 'Can I edit the existing text in a PDF with this tool?',
      answer:
        'No. Text already in the PDF cannot be retyped, reformatted or reflowed, because PDF stores text as positioned glyphs rather than editable paragraphs. You can cover an area and add a correction on top, or leave notes in the margin, but genuine content changes require the original source document.',
    },
    {
      question: 'What happens to my annotations when I save?',
      answer:
        'They are flattened into the page, becoming part of the document rather than separate comments. The advantage is that the recipient sees exactly what you sent in any reader, and nothing can be moved or deleted. The disadvantage is that they can no longer be edited individually or removed from the saved copy.',
    },
    {
      question: 'Can I sign a PDF with this tool?',
      answer:
        'Yes. Use the freehand pen to draw your signature on the page. It is an image of your signature flattened into the document rather than a cryptographic digital signature, so it suits forms, agreements and internal paperwork, but it does not carry the identity assurance a certificate-based signature provides.',
    },
    {
      question: 'Is my document uploaded to a server?',
      answer:
        'No. The site has no backend. Your PDF is read by the browser, rendered locally, annotated in the tab and saved as a new file. You can keep the Network panel open in developer tools while editing and you will see no request carrying your document.',
    },
    {
      question: 'Will the edited PDF keep the same layout?',
      answer:
        'Yes. Existing page dimensions, orientation and page count are preserved, and annotations are positioned on the rendered pages. The one difference you may notice is that added text uses a standard font rather than the document original typeface, since matching an embedded font exactly is not possible.',
    },
    {
      question: 'Can I remove annotations after saving?',
      answer:
        'Not from the saved file, because flattening makes them part of the page. Start again from the original PDF, which this tool never modifies, and make the changes you want. That is also the quickest way to produce a clean copy for somebody who should not see your notes.',
    },
  ],
};
