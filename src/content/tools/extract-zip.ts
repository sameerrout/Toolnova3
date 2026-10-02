import type { ToolContent } from '@/content/types';

export const extractZipContent: ToolContent = {
  overviewHeading: 'What this ZIP extractor does',
  overview: [
    'This tool opens an existing ZIP archive and shows you what is inside it before anything is written to your disk. Every entry is listed with its path, its uncompressed size and its place in the folder tree, so you can find the one file you need without unpacking a directory you never wanted.',
    'The archive is read with fflate\u2019s streaming unzip routine, which decompresses entries one after another rather than treating the ZIP as a single block. That matters twice over: the listing grows as the archive is read, and a large archive does not have to be expanded in full before you can see what it holds.',
    'From the list you can download a single file or take everything at once with the folder structure preserved. The process runs in your browser, so the archive is never uploaded. That is worth having, because a ZIP is usually a container of everything: a project folder, a set of invoices, a full backup of a laptop.',
  ],
  howTo: {
    heading: 'How to extract a ZIP file',
    intro:
      'The listing is produced first and the downloads come second, which gives you the chance to look before you extract.',
    steps: [
      {
        name: 'Open the archive',
        text: 'Add the archive by dropping it in or picking it from your device. One ZIP is handled at a time, because every entry has to be decompressed to be listed accurately.',
      },
      {
        name: 'Read the entry list',
        text: 'Each row shows the internal path, the uncompressed size and whether the entry is a file or a folder. Sorting by name or size is the quickest way to spot a large file inflating the archive.',
      },
      {
        name: 'Download one file',
        text: 'Use the download control on a row to save that entry on its own. You can pull one contract out of an archive of two hundred documents without copying the other hundred and ninety-nine anywhere.',
      },
      {
        name: 'Extract everything',
        text: 'Choose the option to download all entries and the archive is written out with its internal paths intact, so nested folders are recreated rather than flattened into a heap of loose files.',
      },
      {
        name: 'Close the tab when you have finished',
        text: 'The extracted data is held in the tab until you are done. Closing the page releases that memory immediately, and nothing remains on your device except the files you chose to download.',
      },
    ],
  },
  benefits: {
    heading: 'Why use this ZIP extractor',
    intro:
      'It suits any machine where installing compression software is inconvenient, and any archive you would rather not hand to a website.',
    items: [
      {
        title: 'Look before you extract',
        text: 'Contents are listed with names and sizes before a single file is saved. That is useful for an archive someone else sent you, where you want to know what it holds and whether anything inside is unexpectedly large.',
      },
      {
        title: 'Take one file, not all of them',
        text: 'Selective downloads save time and disk space when an archive holds a whole project and you need one spreadsheet from it. Nothing else is written to your device.',
      },
      {
        title: 'No software to install',
        text: 'The unzip routine is part of the page, so it works on a Chromebook, a locked-down work laptop or a borrowed machine. There is no plug-in, no extension and no administrator prompt.',
      },
      {
        title: 'The archive is never uploaded',
        text: 'Backups, client folders and personal photo collections are exactly what ends up inside a ZIP. Here the file is opened from your disk and stays there, which removes the question of what happens to it elsewhere.',
      },
      {
        title: 'No decoy download buttons',
        text: 'There is no fake button, countdown timer or intermediate page asking you to install something. Each row downloads the file it names, generated from data already held in your tab.',
      },
    ],
  },
  privacy: {
    heading: 'Your archive stays on your device',
    paragraphs: [
      'There is no backend behind this tool. The page is a static file and the decompression runs in JavaScript in a worker inside your browser, so the archive is read from your disk and written back to it without passing through a network.',
      'The claim is easy to check. Open the developer tools, switch to the Network tab and open an archive while you watch. The requests you see are for the page and its scripts. No request carries the ZIP file or anything from inside it.',
      'Nothing is written down. Entry names, sizes and file contents stay in the tab, are never placed in local storage or cookies, and never appear in an analytics payload. Analytics on this site is limited to anonymous page views and loads only after you accept the cookie banner.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Password-protected or encrypted archives are not supported, including both the older ZipCrypto method and AES encryption. The archive has to be decrypted in another tool first, then opened here.',
      'ZIP64 archives, which are those above roughly 4 GB, may not open. The archive is also held in memory while it is read, so on a modest device free memory can run out before the format limit is reached.',
      'Only the ZIP format is handled. RAR, 7z, TAR and GZ use different container structures and are not read here, even when a file of another format has been renamed with a .zip ending.',
      'Entries above the per-file memory threshold are listed with their name and size, but their bytes are not buffered. On a very large archive the listing is complete while not every entry is available as an individual download.',
    ],
  },
  faqs: [
    {
      question: 'Can I open a password-protected ZIP file?',
      answer:
        'No. Encrypted archives are not supported, which covers both the older ZipCrypto method and AES encryption. Without the key the entry list cannot be read either, so the archive must be decrypted first. Remove the password with your operating system or an archive utility, then open the decrypted copy here.',
    },
    {
      question: 'Why will my large ZIP file not open?',
      answer:
        'Two limits can get in the way. Archives above roughly 4 GB use the ZIP64 extension, which this tool may not read, and the archive is held in memory while it is processed, so a very large file can exhaust the free memory on the device first. Desktop archive software is the practical answer for those files.',
    },
    {
      question: 'Do I have to extract every file in the archive?',
      answer:
        'No. The entries are listed first and each one can be downloaded on its own. That is often the reason to open an archive here: you can retrieve a single document from a folder of hundreds without writing the rest to your disk at all.',
    },
    {
      question: 'Does the folder structure stay intact when I extract?',
      answer:
        'Yes. The internal path of every entry is shown in the listing and preserved when you download, so a project archive extracts into the same directory tree it had when it was created rather than into one flattened folder. The listing shows that structure even if you download nothing.',
    },
    {
      question: 'Can I open RAR, 7z or TAR files with this tool?',
      answer:
        'No. Only the ZIP format is supported. RAR and 7z use different compression methods and container structures that this tool does not read, and TAR is not compressed at all. If a file with a .zip ending fails to open, it may have been produced by one of those formats and renamed.',
    },
    {
      question: 'Is my archive uploaded, and does it work offline?',
      answer:
        'The archive is never uploaded. It is decompressed in your browser and stays on your device, so there is no account to create and no server-side copy to remove. Once the page has loaded, the tool continues to work without an internet connection.',
    },
  ],
};
