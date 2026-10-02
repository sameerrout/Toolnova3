import type { ToolContent } from '@/content/types';

export const organizePdfContent: ToolContent = {
  overviewHeading: 'What this PDF organiser does',
  overview: [
    'This tool shows every page of a PDF as a thumbnail so you can rearrange the document by hand. Drag a page to a new position, remove one that was scanned twice, copy a page that needs to appear in two places, or flip the whole sequence with a single reverse command.',
    'The thumbnails are rendered by pdf.js, the engine behind Firefox\u2019s PDF viewer, and they are drawn a few pages at a time as you scroll rather than all at once. That is what keeps a long document workable: memory holds the pages currently on screen instead of hundreds of full-size bitmaps.',
    'Reordering, deleting and duplicating all work the same way underneath: pages are copied into a new document in the order you set. Nothing is re-rendered or re-compressed, so each page matches the original, and the file on your disk is left untouched until you save a new one.',
  ],
  howTo: {
    heading: 'How to organise PDF pages',
    intro:
      'Everything is reversible until you save, so it is safe to try a sequence and change your mind.',
    steps: [
      {
        name: 'Open the PDF',
        text: 'Drop the file in or choose it with the picker. The grid fills in as thumbnails render, starting with the pages you can see, so you can begin before the whole document is drawn.',
      },
      {
        name: 'Reorder by dragging',
        text: 'Drag a thumbnail to the position you want and the other pages move aside to make room. For precise work, or when dragging is awkward, select a page and use the move buttons or the keyboard shortcuts to shift it one place.',
      },
      {
        name: 'Delete or duplicate pages',
        text: 'Use the delete control on a thumbnail to drop a page from the output, or duplicate it to insert a copy directly after the original. A running page count shows how many pages the finished document will have.',
      },
      {
        name: 'Reverse the whole document',
        text: 'The reverse command flips the entire sequence, which is the quick fix for a document scanned from the last page to the first. It applies to the current order, so reversing twice returns you to where you started.',
      },
      {
        name: 'Check the order and save',
        text: 'Scroll through the grid to confirm the sequence, then build the new PDF. Pages are copied in the order shown, so the grid is an accurate picture of what the saved document contains.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF organiser',
    intro:
      'It is the visual approach to a job that is otherwise guesswork, and it keeps awkward documents away from online services.',
    items: [
      {
        title: 'You see what you are moving',
        text: 'Pages are identified by their content rather than by a number, which matters for a scan where the visible page numbers are missing, wrong or handwritten in a corner.',
      },
      {
        title: 'Three fixes in one pass',
        text: 'Reordering, deleting and duplicating are usually needed together on a bad scan. There is no need to split the file, edit the parts separately and merge them back.',
      },
      {
        title: 'Keyboard-friendly reordering',
        text: 'Every page can be moved with the buttons or the keyboard, so the tool stays usable without precise dragging, including on a trackpad or a touchscreen.',
      },
      {
        title: 'Memory stays flat',
        text: 'Thumbnails render a few pages at a time instead of all at once, so a several-hundred-page document does not exhaust memory the way a full preview grid would.',
      },
      {
        title: 'No upload and no account',
        text: 'The document is read, previewed and rebuilt inside your browser. Nothing is transmitted, there is no signup, and the tool keeps working offline once the page has loaded.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'This tool has no backend. The page is a static file, the thumbnails are rendered by pdf.js on your own processor, and the reordered document is written in the same tab. There is no upload step because there is nothing to upload to.',
      'That matters here more than usual, because reorganising a PDF is something people do to documents still in progress: drafts, case files, unreleased reports. None of it passes through a network, which you can confirm by watching the Network tab while the thumbnails render.',
      'No record of your edits survives the session. Which pages you moved, deleted or copied is held in memory only, never in local storage or cookies. The single piece of third-party code on the page is opt-in analytics, and it counts visits rather than touching the document.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Thumbnails take a moment on a long document, because they are rendered a few at a time to keep memory use low. The grid fills in progressively rather than instantly.',
      'Deleting a page affects the new document only. Your original file keeps every page, so nothing is lost even if you remove the wrong thumbnail and save the result.',
      'Reordering copies pages into a new document, so bookmarks, outlines and form-field definitions are not carried over, even though the page content itself is untouched.',
      'Duplicating pages makes the output larger, roughly by the size of the pages you copied, because each duplicate adds its own content to the file.',
    ],
  },
  faqs: [
    {
      question: 'How do I delete a page from a PDF?',
      answer:
        'Open the document, find the page in the thumbnail grid and use its delete control. The page leaves the sequence immediately and the page count updates. Nothing is written to disk until you save, so you can start again by reloading the file or using the reset option.',
    },
    {
      question: 'Can I undo a reorder if I get it wrong?',
      answer:
        'Yes. The reset option returns the grid to the original page order, and the source file on your disk is never modified in any case. If you have already saved the new arrangement, open the original again and work from that copy.',
    },
    {
      question: 'Does reorganising pages reduce the quality of my PDF?',
      answer:
        'No. Pages are copied into a new document in the order you choose, without being rendered or re-compressed, so text stays selectable and images keep their original resolution. File size changes only when you add or remove pages, not because of the rearrangement itself.',
    },
    {
      question: 'Can I duplicate a page so it appears twice?',
      answer:
        'Yes. The duplicate control inserts a copy directly after the page you chose, and it can then be moved anywhere in the sequence. Each copy adds its content to the output, so duplicating a page increases the file size by roughly that page\u2019s share of the document.',
    },
    {
      question: 'Why are the thumbnails slow to appear on a big document?',
      answer:
        'Each thumbnail is a full render of that page, so a long document is a lot of drawing. To keep memory steady the tool renders a few pages at a time as you scroll rather than preparing everything up front. Large files become usable quickly, but the last pages of a very long scan take a while to fill in.',
    },
    {
      question: 'Is my PDF uploaded, and can I use the tool offline?',
      answer:
        'Nothing is uploaded. Thumbnails are rendered and the new document assembled entirely inside your browser, so the file never leaves your device and no account is required. After the page has loaded, the tool also works without an internet connection.',
    },
  ],
};
