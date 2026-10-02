import type { ToolContent } from '@/content/types';

export const createZipContent: ToolContent = {
  overviewHeading: 'What this ZIP maker does',
  overview: [
    'This tool turns a scattered set of files, or an entire folder tree, into a single compressed ZIP archive. You can drop in literally any file type: documents, photos, videos, spreadsheets, CAD drawings, source code, or a mix of all of them. There is no allow-list and no per-format restriction, because a ZIP archive does not care what is inside it.',
    'The important difference from almost every other ZIP tool online is where the work happens. Your files are opened by your own browser, compressed by your own processor, and written back to your own disk. Nothing is uploaded to a server, which means there is no upload wait, no file size limit imposed by someone else, and no copy of your data sitting in a temporary folder on a machine you do not control.',
    'That matters more than it first appears. People zip the things they least want to expose: tax records, passport scans, legal bundles, client deliverables under NDA, database exports. A conventional online ZIP service receives every one of those files in full before it compresses anything. This tool never does, because it has no server to send them to.',
  ],
  howTo: {
    heading: 'How to create a ZIP file',
    intro:
      'The whole process takes a few seconds for small archives and scales up gracefully for large ones.',
    steps: [
      {
        name: 'Add your files or a folder',
        text: 'Drag files anywhere into the drop area, click "Choose files" to pick individual files, or click "Choose a folder" to select an entire directory. The folder option keeps the internal structure intact, so the archive opens with the same directory tree you have on disk.',
      },
      {
        name: 'Check the file list',
        text: 'Every file appears with its name, type and size, plus a running total. Remove anything you do not want with the X button, or clear the whole list and start again. If a name appears twice, the tool renames the duplicate to "name (1).ext" automatically so nothing is silently overwritten.',
      },
      {
        name: 'Name the archive and pick a compression level',
        text: 'Type the ZIP file name you want. Choose Store for the fastest possible result, Fast for a good balance on mixed folders, or Best when the contents are mostly text, code or CSV and you want the smallest possible file.',
      },
      {
        name: 'Decide on folder structure',
        text: 'Leave "keep folder structure" on when you uploaded a folder and want the subdirectories preserved inside the archive. Turn it off to flatten everything into a single level, which is convenient when you are collecting loose files from several places.',
      },
      {
        name: 'Create the archive',
        text: 'Press the create button. For large archives your browser may ask where to save the file first; that is the File System Access API writing straight to disk so the archive never has to fit in memory. Otherwise the finished ZIP appears as a download button.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this ZIP tool',
    intro:
      'It is built for the two situations where normal online ZIP services fall over: sensitive files, and large folders on a modest laptop or phone.',
    items: [
      {
        title: 'Your files are never uploaded',
        text: 'There is no server component at all. The page is a static file; the compression runs in a Web Worker inside your browser. You can watch your network tab and see nothing leave.',
      },
      {
        title: 'No artificial size limit',
        text: 'Because there is no upload, there is no 100 MB or 500 MB cap. Large archives are streamed straight to disk, so multi-gigabyte folders are limited by your free disk space rather than by your RAM.',
      },
      {
        title: 'It works on slow connections',
        text: 'Nothing is transferred, so a 2 GB folder over a weak mobile connection zips exactly as fast as on fibre. The only network traffic is the page itself, which loads once.',
      },
      {
        title: 'Smart compression',
        text: 'Photos, videos, PDFs and Office documents are already compressed internally. The tool detects them and stores them as-is instead of burning processor time on deflate that would make the archive marginally larger, not smaller.',
      },
      {
        title: 'Folder structure preserved',
        text: 'Folder uploads keep their relative paths, so an archive of a project directory extracts into the same layout rather than a heap of loose files.',
      },
      {
        title: 'Honest progress and a real cancel button',
        text: 'You get a true progress bar, the name of the file currently being processed, and a Cancel button that actually stops the work and releases the worker immediately.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'This tool has no backend. There is no upload endpoint, no temporary storage bucket and no job queue, because the site is deployed as static files and the compression is performed by JavaScript running in your browser tab.',
      'Concretely: your files are read with the browser\u2019s own File API, compressed by the fflate library inside a Web Worker, and handed back to you as a download or written directly to a file you choose. At no point is a byte of your data sent over the network. You can verify this yourself by opening your browser developer tools, switching to the Network tab, and creating an archive while you watch it. The only requests you will see are for the page and its scripts.',
      'Two further details matter for sensitive archives. First, the tool does not write anything to local storage or cookies about what you zipped. Second, when a job finishes, the object URLs and worker are released immediately, so the compressed data does not linger in the tab after you download it. Closing the tab clears everything that remains.',
      'The one exception worth stating plainly: if you use the background removal or OCR tools on this site, those download a machine-learning model from a public CDN the first time you use them. That is a download of model weights only. Your file is still processed locally and is still never uploaded.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'A single ZIP archive cannot exceed 4 GB because of the ZIP32 format limit. The tool warns you before you start and asks you to split the job.',
      'Password-protected ZIP output is not offered. The ZIP format\u2019s legacy encryption is weak, and AES ZIP support in browsers is inconsistent; use the Protect PDF tool for documents that need real encryption.',
      'Very large archives keep the tab busy. The UI stays responsive because compression happens in a worker, but you should leave the tab open until it finishes.',
      'Extracting existing archives is handled by the separate Extract ZIP tool, which lists the contents before you download anything.',
    ],
  },
  faqs: [
    {
      question: 'Is there a file size limit?',
      answer:
        'There is no upload limit because nothing is uploaded. A single ZIP archive is capped at about 3.5 GB by the ZIP32 format, and beyond that you need to split the job. On lower-memory devices the tool also warns you when a job is likely to be tight and offers to stream the archive straight to disk instead of building it in memory.',
    },
    {
      question: 'Are my files uploaded to a server?',
      answer:
        'No. The site is served as static files and the compression runs in a Web Worker inside your browser. There is no upload endpoint in the application at all. You can confirm this by watching the Network tab in your browser developer tools while an archive is created.',
    },
    {
      question: 'Can I zip an entire folder and keep the subfolders?',
      answer:
        'Yes. Click "Choose a folder" rather than "Choose files". The browser supplies the relative path of every file, and the tool uses it as the archive entry name, so the ZIP extracts into the same directory tree. If you would rather flatten everything into one level, turn off "keep folder structure".',
    },
    {
      question: 'Why is my archive barely smaller than the original files?',
      answer:
        'Because the files inside were probably already compressed. JPEG, PNG, MP4, PDF, DOCX, XLSX and ZIP files all use compression internally, so there is little left to squeeze. The tool detects these formats and stores them without re-compressing, which is both faster and produces a smaller archive than forcing deflate on them.',
    },
    {
      question: 'What happens if two files have the same name?',
      answer:
        'The second one is renamed automatically: report.txt becomes report (1).txt, then report (2).txt, and so on. The extension is preserved and the counter skips names that genuinely exist in your selection, so nothing is ever overwritten inside the archive.',
    },
    {
      question: 'Can I cancel a large archive part-way through?',
      answer:
        'Yes. The Cancel button stops the worker immediately and releases its memory. If you chose to write straight to disk, the partially written file is discarded rather than left in a broken state.',
    },
    {
      question: 'Does it work on a phone?',
      answer:
        'Yes. On Android browsers the folder picker and disk streaming both work. On iOS the file picker can reach iCloud Drive and On My iPhone, but Safari does not support streaming to disk, so very large archives are built in memory and the tool warns you beforehand if that is likely to be a problem.',
    },
    {
      question: 'Can I use it offline?',
      answer:
        'Once the page has loaded, yes. Compression needs no network access, so if you lose connectivity mid-job the archive still completes. Reloading the page does require a connection unless your browser has cached it.',
    },
  ],
};
