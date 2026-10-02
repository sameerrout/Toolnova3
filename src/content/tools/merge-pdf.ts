import type { ToolContent } from '@/content/types';

export const mergePdfContent: ToolContent = {
  overviewHeading: 'What this PDF merger does',
  overview: [
    'This tool joins several PDF files into one document. You pick the files, set the order, and the pages are copied into a new PDF that you save to your own device. Scanned forms, invoices, chapters, pages signed by different people: separate PDFs become one file.',
    'The joining is done by PDF-LIB inside your browser tab. It reads each source file, copies the page objects into a new document and writes the result. Pages are copied rather than re-rendered, so the merge is lossless: text stays selectable, artwork stays sharp and images are not re-compressed.',
    'That matters because the documents people merge tend to be confidential: contracts, statements, medical letters. A conventional online merger receives every page in full before it returns a file. This one has no server to receive them, which is why it needs no account and keeps working if your connection drops.',
  ],
  howTo: {
    heading: 'How to merge PDF files',
    intro:
      'A merge of a few documents takes a moment. The time goes on reading and writing files locally, not on an upload.',
    steps: [
      {
        name: 'Add the PDFs',
        text: 'Drop files onto the page or select several with the file picker. Each one is listed with its page count so you can see what you are working with.',
      },
      {
        name: 'Set the order',
        text: 'Drag the rows into the sequence you want, or use the arrow buttons to shift a document one place at a time. The finished file follows the list from top to bottom.',
      },
      {
        name: 'Check the page counts',
        text: 'A document that looks shorter than expected may be password-protected. Unlock it in a PDF reader, then add the unlocked copy again.',
      },
      {
        name: 'Merge and inspect the joins',
        text: 'Press merge and the result opens in a preview. Scroll through the points where documents meet to confirm the order and that no page is missing.',
      },
      {
        name: 'Save the merged document',
        text: 'Download the finished PDF, or save it straight to a folder you choose. The file is already built in your tab, so the download begins immediately.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF merger',
    intro:
      'It is built for documents you would rather not hand to a stranger, and for getting the page order right.',
    items: [
      {
        title: 'Order is yours to set',
        text: 'Files keep the sequence you give them, and the list can be rearranged as often as you like before you merge. There is no guessing which document was read first.',
      },
      {
        title: 'Lossless page copying',
        text: 'Pages are transferred as they are rather than turned into images. Text stays selectable, links inside pages keep working and image quality is untouched.',
      },
      {
        title: 'Nothing is uploaded',
        text: 'There is no backend to send files to, so a confidential contract never crosses the network. The Network tab in your developer tools will confirm it.',
      },
      {
        title: 'No account, no queue',
        text: 'No signup, no email address, no waiting behind other jobs. Once the page has loaded it also works offline, so a dropped connection will not stop a merge.',
      },
      {
        title: 'Progress and a way out',
        text: 'A progress bar names the document being read, and cancel stops the job and releases its memory without you reloading the page.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'This tool is a static page. There is no upload endpoint, no storage bucket and no job queue, because the joining happens in JavaScript inside your browser. Your PDFs are opened with the browser\u2019s File API and never leave the tab.',
      'The practical test takes ten seconds. Open the developer tools, switch to the Network tab and merge two documents while you watch. The requests you see are for the page and its scripts, never for your file.',
      'The tool keeps no history of your merges. Nothing you selected is written to local storage or cookies, and the only analytics on this site are anonymous page views that load after you accept the cookie banner. Those count visits to the page; they cannot see a file.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Password-protected PDFs cannot be opened. Unlock the document in a PDF reader first, then merge the unlocked copy.',
      'Bookmarks, outlines and form-field definitions are not carried across. The pages arrive intact, but the sidebar bookmarks of the source documents do not.',
      'Merging does not compress anything. The output is roughly the input sizes added together, and can be marginally larger because of the new document structure.',
      'Large merges are limited by your device memory rather than a server quota. The page shows the current cap for your device and warns you when you approach it.',
    ],
  },
  faqs: [
    {
      question: 'Does merging reduce the quality of a PDF?',
      answer:
        'No. Pages are copied into the new document without being rasterised or re-compressed, so text stays sharp and selectable and images are untouched. The trade-off is size: the merged file is roughly the combined size of the originals. Run the result through Compress PDF if you need it smaller.',
    },
    {
      question: 'Can I change the page order before merging?',
      answer:
        'Yes, and as often as you like. Drag the file rows into position or use the arrow buttons to move a document up or down the list. The output follows the list exactly from top to bottom, so the order on screen is the order in the finished PDF.',
    },
    {
      question: 'How many PDFs can I merge at once?',
      answer:
        'The limit depends on your device, because the work runs in your browser and uses your memory. The page shows the current cap and warns you when a selection approaches it. A desktop can handle a few dozen documents; a phone will allow noticeably less.',
    },
    {
      question: 'Are scanned PDFs treated differently from digital ones?',
      answer:
        'No. A scanned page is an image stored in a PDF and a digital page is text plus vector drawing, but both are page objects to the merger. Neither is converted, so a scan stays a scan and searchable text stays searchable, with page sizes preserved.',
    },
    {
      question: 'Is my document uploaded to a server?',
      answer:
        'No. There is no server component in the application. The page is served as a static file and the merge is performed by PDF-LIB in your browser. Watch the Network tab in your developer tools during a merge and you will see no request carrying the document.',
    },
    {
      question: 'Can I merge PDFs on a phone or without a connection?',
      answer:
        'Yes to both. Mobile browsers support the file picker and the same local processing, though memory is tighter, so very large documents may need a desktop. Once the page has loaded it needs no connection at all, and no account or signup is required.',
    },
  ],
};
