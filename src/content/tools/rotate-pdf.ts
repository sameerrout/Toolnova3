import type { ToolContent } from '@/content/types';

export const rotatePdfContent: ToolContent = {
  overviewHeading: 'What this PDF rotator does',
  overview: [
    'This tool turns PDF pages through a quarter, a half or three quarters of a turn, so a sideways scan can be read without tilting your head. You can rotate every page in the document or only the ones that came out wrong, which is common when a batch of scans was fed in mixed orientations.',
    'The rotation is a change to the page dictionary, the part of a PDF that records how a page should be displayed. Nothing on the page is redrawn, re-encoded or re-compressed, which makes the operation lossless: text stays selectable, images keep their original quality, and a long document is rewritten in a moment rather than re-rendered sheet by sheet.',
    'It also means the change is respected by proper PDF readers, printers and print drivers, because all of them follow the page dictionary. The file stays a normal PDF you can email or archive. The work happens in your browser, with no upload and no account, and continues to work offline once the page has loaded.',
  ],
  howTo: {
    heading: 'How to rotate a PDF',
    intro:
      'The job is three choices: the angle, the pages and the confirmation. A preview shows the result before you save.',
    steps: [
      {
        name: 'Open the document',
        text: 'Open the PDF by dropping it in or selecting it from your device. The tool reads the page count and renders a preview strip so you can see which pages are affected.',
      },
      {
        name: 'Choose the angle',
        text: 'Pick 90 degrees clockwise for a page lying on its left side, 270 for one on its right, or 180 for an upside-down page. The preview updates immediately so you can tell which direction is right.',
      },
      {
        name: 'Select the pages',
        text: 'Leave the whole document selected to turn every page, or type a range such as 2,5,9-12 to fix only the sheets that need it. Mixed orientations in one file are handled in a single pass.',
      },
      {
        name: 'Apply and check',
        text: 'Run the rotation and scroll the preview to confirm the affected pages now read correctly and the rest are untouched. If a page went the wrong way, apply the opposite angle to it.',
      },
      {
        name: 'Save the rotated PDF',
        text: 'Download the result or write it to a folder you choose. The file keeps its original page sizes and quality, and the source document on disk is not modified.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this PDF rotator',
    intro:
      'It solves the small, annoying problem of pages that face the wrong way, without the usual cost of fixing them.',
    items: [
      {
        title: 'Lossless by design',
        text: 'Only the page dictionary is rewritten. Images are not re-encoded and text is not rasterised, so document quality is unchanged and the file size stays close to the original.',
      },
      {
        title: 'Fix the pages, not the file',
        text: 'A forty-page scan often has three pages the wrong way up. Selecting ranges means you correct those three and leave the rest exactly as they were.',
      },
      {
        title: 'Done in a moment',
        text: 'Because no page is redrawn, rotation is quick even on a long document. There is no quality-versus-speed decision to make and no progress bar to wait behind.',
      },
      {
        title: 'Correct where it counts',
        text: 'Viewers, printers and print drivers all read the page dictionary, so rotated pages display and print the right way up rather than looking correct only inside this tool.',
      },
      {
        title: 'No upload, no account',
        text: 'The file is read and rewritten on your own device. There is nothing to sign up for, no server-side size limit, and the tool works offline once the page has loaded.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Rotation is a local operation. PDF-LIB opens the document in your browser tab, writes a new rotation value into each selected page and hands the result back as a download. The site is a static page with no backend, so there is no upload step in the process at all.',
      'If you want proof rather than assurance, open the developer tools, go to the Network tab and rotate a document while you watch. No request will contain your file. The only traffic is the page and its scripts, which are cached after the first visit.',
      'The tool leaves no trace of the job either. What you rotated is never recorded: no file names, page selections or settings are kept in local storage or cookies, and nothing about the document is attached to an analytics event. Anonymous page-view analytics loads only if you accept the cookie banner, and records the page address and nothing more.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Only right angles are possible. A scan that is crooked by a few degrees cannot be straightened here, because that means redrawing the page rather than turning it.',
      'Rotation is stored in the page dictionary, so software that ignores that value will still show the page in its original orientation. Compliant readers honour it, but very old or unusual programs may not.',
      'The order in which text is stored does not change. Copying a paragraph from a rotated page may still paste in the original reading order, because rotation affects display rather than the underlying text.',
      'A page that already carries a rotation value is turned from wherever it is now, so two passes at 90 degrees leave it at 180, the same as a single pass at that angle.',
    ],
  },
  faqs: [
    {
      question: 'Does rotating a PDF reduce its quality?',
      answer:
        'No. Rotation only changes the value that tells a reader how to display the page. Page content, images and text are copied through untouched, so resolution, colour and selectable text are identical afterwards. That is the main reason to rotate a document rather than re-scanning or re-exporting it.',
    },
    {
      question: 'Can I rotate only some pages of a PDF?',
      answer:
        'Yes. Choose the whole document, or type the pages you want, such as 3,7,12-15. This is useful for a batch scan where only a few sheets were fed in the wrong orientation. Pages outside your selection keep the orientation they already had.',
    },
    {
      question: 'Why does my rotated page look wrong in another program?',
      answer:
        'That program is ignoring the page rotation value in the PDF, which is where the new orientation is stored. Every mainstream reader, printer and print driver follows it. If an unusual or very old application does not, the page appears as it did before, which is a limitation of that application rather than of the file.',
    },
    {
      question: 'Can I straighten a slightly crooked scan?',
      answer:
        'No. This tool turns pages by 90, 180 or 270 degrees, which covers sheets fed the wrong way. A page skewed by a few degrees needs deskewing, where the content itself is redrawn at a small angle. That changes pixels, so it is a different job and would not be lossless.',
    },
    {
      question: 'Which angle do I need for a sideways scan?',
      answer:
        'Use 90 degrees clockwise if the top of the page currently faces the left edge, and 270 if it faces the right edge. An upside-down page needs 180. The preview updates as you choose, so the quickest method is to try one angle and check the thumbnail before saving.',
    },
    {
      question: 'Is the PDF uploaded anywhere, and does it work offline?',
      answer:
        'Nothing is uploaded. The rotation happens in your browser and the file never leaves your device, so there is no account to create and no server copy to delete. Once the page has loaded it also needs no connection, which means you can rotate documents on a plane or on a network that blocks file sharing.',
    },
  ],
};
