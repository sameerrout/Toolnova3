import type { ToolContent } from '@/content/types';

export const pdfPageNumbersContent: ToolContent = {
  overviewHeading: 'What this page numbering tool does',
  overview: [
    'This tool adds page numbers to a PDF. You choose where they sit, how they are written, how large they are and which number the first page carries. The numbers are drawn as real text on top of each page, so they stay sharp when you zoom in and can be selected and searched like any other text in the file.',
    'Placement covers the six conventional spots, top or bottom on the left, centre or right, plus a custom position for a figure that needs to sit slightly inside a binding margin. Number styles include plain digits, lower and upper roman numerals, lower and upper letters, and a Page X of Y pattern for documents read out of order.',
    'Two settings handle the awkward cases. The starting number lets a document continue the sequence of a larger bundle instead of restarting at one, and the skip first page option leaves a cover sheet unnumbered. The numbering is drawn locally with PDF-LIB in your browser, so the document is never uploaded and no account is needed.',
  ],
  howTo: {
    heading: 'How to add page numbers to a PDF',
    intro:
      'A preview updates as you change each setting, so position and size can be judged against the real layout.',
    steps: [
      {
        name: 'Open the PDF',
        text: 'Drop the document in or choose it with the file browser. The tool renders a preview strip and reports the total page count, which matters for the Page X of Y format.',
      },
      {
        name: 'Choose the position',
        text: 'Pick one of the six standard positions, or set a custom offset when a document has an unusual margin, a footer band or a logo the numbers should avoid.',
      },
      {
        name: 'Choose the format and size',
        text: 'Select digits such as 1, roman numerals such as i or I, letters such as a or A, or the Page X of Y wording. Set the size close to the body text, usually a little smaller, so the numbering looks deliberate.',
      },
      {
        name: 'Set the starting number and cover page',
        text: 'Change the starting number when this document continues an earlier sequence, for example beginning at 47 because it follows a first volume. Turn on skip first page when the opening sheet is a cover that should not be numbered.',
      },
      {
        name: 'Apply and save',
        text: 'Run the tool, then scroll to the first and last numbered pages to confirm the sequence. Save under a new name so the unnumbered original is still available.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this page numbering tool',
    intro:
      'It handles the details that make numbering look deliberate rather than bolted on, and it keeps the document on your own machine.',
    items: [
      {
        title: 'Numbering that suits the document',
        text: 'Formal reports often want roman numerals in the front matter and digits afterwards, while legal bundles may need a sequence continuing from an earlier volume. Both are a couple of settings away.',
      },
      {
        title: 'Real text, not a stamp',
        text: 'The numbers are drawn as text with the standard PDF fonts, so they stay crisp at any zoom, print cleanly and add almost nothing to the file size.',
      },
      {
        title: 'A cover page stays clean',
        text: 'Skipping the first page is the difference between a properly numbered report and one with a stray figure printed on the title sheet.',
      },
      {
        title: 'No watermark, no branding',
        text: 'The output contains the numbers you asked for and nothing else. Nothing is stamped across the document and the pages are copied through unchanged apart from the numbering.',
      },
      {
        title: 'Private by default',
        text: 'Contracts, expert reports and personnel files are exactly the documents that get numbered, and they never leave your device. There is no upload, no signup and no copy stored elsewhere.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Everything happens inside the browser tab. Your PDF is read from your disk, the numbers are written into each page with PDF-LIB, and the finished document is returned as a download. No part of the file is transmitted, because the tool has no server to transmit it to.',
      'You can check that directly. With the developer tools open on the Network tab, number a document and watch the requests. You will see the page and its scripts load and nothing carrying your file. After that first load, the tool keeps working with the connection switched off.',
      'Nothing here is remembered between visits. Your numbering settings are not saved to local storage or cookies, and no request leaving the page carries document data. The analytics the site loads after you accept the banner record which page was viewed.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Numbers are drawn on top of the page. If the document already has page numbers or a footer, the new ones will sit over the existing content unless you pick a position that avoids it.',
      'The tool uses the standard PDF fonts, which cover Western digits, roman numerals and Latin letters. Other numeral systems, such as Arabic-Indic or Devanagari digits, are not available.',
      'The numbering is ordinary page content, not a PDF page label. A viewer\u2019s own page indicator and any internal links still refer to physical sheet positions, so a page printed with "Page 3" may be sheet 5.',
      'The numbers are added as a new layer, so anyone editing the file later could remove them. They are a reading aid rather than a tamper-proof marking.',
    ],
  },
  faqs: [
    {
      question: 'Can I start page numbering at a number other than one?',
      answer:
        'Yes. Set the starting number to whatever the sequence requires. That is useful when a document is part of a larger set, such as an appendix continuing from the main report, or when the first pages are unnumbered front matter and the numbered sequence should begin at a specific figure.',
    },
    {
      question: 'Can I skip the first page or a cover sheet?',
      answer:
        'Yes. Turn on the skip first page option and the opening sheet is left untouched while every page after it is numbered. That keeps title pages and covers clean, and the setting is designed for the common case of a single unnumbered cover.',
    },
    {
      question: 'Can I use roman numerals or letters instead of digits?',
      answer:
        'Yes. The format options include lower and upper roman numerals, lower and upper case letters, and a Page X of Y pattern as well as plain digits. A frequent combination is roman numerals through the contents pages and ordinary digits for the chapters that follow, produced by numbering in two passes.',
    },
    {
      question: 'Will the numbers cover existing footers or page numbers?',
      answer:
        'They can, because the new text is drawn over the page. If the document already carries a footer, choose a position above or below it, or set a custom offset to place the numbering clear of the existing content. The preview shows the result before you save anything.',
    },
    {
      question: 'Does this tool add its own watermark or branding?',
      answer:
        'No. The output contains only the page numbers you configured. Nothing is stamped across the document, no promotional text is inserted, and the existing pages are copied through exactly as they were apart from the added numbering. There is no logo, link or footer text added anywhere in the file.',
    },
    {
      question: 'Is my PDF uploaded, and does it work offline?',
      answer:
        'The document is not uploaded. Numbering runs in your browser and the file stays on your device, so there is no account, no queue and no server-side copy. Once the page has loaded, the tool also works without a connection, which is convenient on a managed or restricted network.',
    },
  ],
};
