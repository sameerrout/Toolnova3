import type { ToolContent } from '@/content/types';

export const splitPdfContent: ToolContent = {
  overviewHeading: 'What this PDF splitter does',
  overview: [
    'This tool takes one PDF and gives you back the parts you asked for. Pull out a handful of pages, cut a long report into chapters, or break the document into single pages so that every sheet becomes its own file. The pages are copied rather than rebuilt, so they open and print exactly as they did before.',
    'Instead of clicking through a thumbnail grid, you type the ranges you want. The syntax is 1-5,8,12-, meaning pages one to five, then page eight, then page twelve to the end. Typing is quicker than dragging on long documents, and it describes the exact set you need without hunting for thumbnails.',
    'When a split produces several files you can take them one at a time or download the set as a single ZIP. The work is done by PDF-LIB in your browser tab, so the document is never uploaded, no account is needed, and the tool keeps working once the page has loaded even if you go offline.',
  ],
  howTo: {
    heading: 'How to split a PDF',
    intro:
      'Choose the mode that matches your document, describe the pages, then check the plan before anything is written to disk.',
    steps: [
      {
        name: 'Open your PDF',
        text: 'Drop the file onto the page or pick it with the file browser. The tool reads the page count and renders the first pages so you can confirm you have the right document.',
      },
      {
        name: 'Pick a split mode',
        text: 'Use custom ranges to extract the pages you name, or every page separately to produce one file per page. Both give the same quality; only the number of output files differs.',
      },
      {
        name: 'Type the ranges',
        text: 'Separate ranges with commas and use a hyphen for a span: 1-5,8,12-. A trailing hyphen runs to the last page. The tool lists every page it matched so mistakes are visible before you commit.',
      },
      {
        name: 'Review the plan and split',
        text: 'Check the page list and the file names that will be produced. A range outside the document is reported rather than silently ignored, so nothing is missed without you knowing.',
      },
      {
        name: 'Download the parts',
        text: 'A short split gives you one download button per file. A large one is offered as a ZIP, which keeps it to a single download and preserves the page order inside.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF splitter',
    intro:
      'It suits long documents, awkward extracts, and any file you would rather not hand to an online service.',
    items: [
      {
        title: 'Ranges you type, not hunt for',
        text: 'Describing pages as 1-5,8,12- takes seconds and works the same on a three-page letter and a nine-hundred-page manual. No scrolling to find page 412.',
      },
      {
        title: 'One file per page when you need it',
        text: 'The every page separately mode produces a numbered file for each sheet, which is the quickest way to turn a combined scan into documents ready for filing or upload.',
      },
      {
        title: 'Copies, not conversions',
        text: 'Pages go into new documents without being re-rendered, so text stays searchable and images keep their resolution. A split never makes a page look worse than it did.',
      },
      {
        title: 'A ZIP instead of a dozen downloads',
        text: 'When the split produces many files, the ZIP option bundles them in page order with one click, and both browsers and desktop file managers treat it as a folder.',
      },
      {
        title: 'No upload and no account',
        text: 'The document is read from your disk and written back to it. Nothing is transferred, so there is no signup and no server-side cap on the file you can open.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Splitting runs entirely in the browser tab. The page is a static file with no backend attached, so there is no upload step that could send your document anywhere and no temporary folder where a copy could sit.',
      'You do not have to take that on trust. Open the developer tools, go to the Network tab and split a document. Every request you see is for the page itself, because the code that reads the file is already on your machine.',
      'There is no log of what you split. Your page ranges and file names exist only in the tab, no cookie or local storage entry records them, and the optional analytics on this site are limited to counting page visits once you accept the banner.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'If a PDF carries a digital signature, splitting rewrites the file and the signature will be reported as invalid in the parts. Keep the original where a signature must stay verifiable.',
      'Printed page numbers rarely match physical page positions. A sheet showing "Page 12" may be the fifteenth page if the cover and contents sheets are unnumbered.',
      'Internal links, bookmarks and named destinations are not rewritten, so a cross-reference pointing at another chapter may no longer resolve in the extracted file.',
      'Password-protected documents cannot be opened. Remove the open password in a PDF reader, save a copy, and split that instead.',
    ],
  },
  faqs: [
    {
      question: 'What is the page range syntax?',
      answer:
        'Write ranges separated by commas and use a hyphen for a span. 1-5,8,12- extracts pages one to five, page eight, and page twelve to the end. A single number means one page, and a trailing hyphen means the rest of the document. The tool lists the pages it matched so you can check first.',
    },
    {
      question: 'How do I split a PDF into single pages?',
      answer:
        'Choose the every page separately mode. The tool creates one PDF per page, numbered in order, and offers them as individual downloads or as a single ZIP. That is the usual approach for turning a combined scan into separate documents, and page quality matches the original.',
    },
    {
      question: 'Does splitting a PDF reduce its quality?',
      answer:
        'No. Pages are copied into new documents rather than rendered and re-encoded, so text remains selectable, links inside pages keep working and images keep their original resolution. Each extracted page holds the same content it had in the source document, wrapped in a smaller file.',
    },
    {
      question: 'Will the extracted pages keep their original page numbers?',
      answer:
        'The content of each page is unchanged, so a number printed in the footer stays as it was. What changes is the physical position: an extract starting at page twelve shows twelve in the footer while being the first sheet of the new file. Use the Add Page Numbers tool for fresh numbering.',
    },
    {
      question: 'Is my document uploaded when I split it?',
      answer:
        'No. There is no server side to the tool. Your browser reads the file from your disk, the split runs in JavaScript on your own processor, and the results come back as downloads. With the Network tab open you will see no request carrying the document.',
    },
    {
      question: 'Can I split a PDF on a phone, or offline?',
      answer:
        'Both work. Mobile browsers can open the file picker and run the same local processing, though memory is tighter, so very large documents are better handled on a desktop. After the page has loaded, no connection is needed, which suits a train journey or a restricted network.',
    },
  ],
};
