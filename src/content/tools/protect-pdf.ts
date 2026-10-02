import type { ToolContent } from '@/content/types';

export const protectPdfContent: ToolContent = {
  overviewHeading: 'What this PDF protection tool does',
  overview: [
    'This tool adds real password protection to a PDF. You set a user password that anyone must type to open the document, and optionally an owner password that governs printing, copying and editing. The standard PDF security handler is used, so Acrobat, Preview, Chrome and Firefox all open the result.',
    'Encryption happens in your own browser, so the file is never uploaded. A conventional protect tool receives the whole document, encrypts it remotely and sends it back, which is the moment a contract or payslip stops being private.',
    'The output is an ordinary PDF with no watermark and no branding. It opens in whatever reader the recipient already has.',
  ],
  howTo: {
    heading: 'How to password protect a PDF',
    intro: 'Encrypting a document takes under a minute.',
    steps: [
      {
        name: 'Add your PDF',
        text: 'Drag the file in or browse. Several documents can be added at once.',
      },
      {
        name: 'Set a user password',
        text: 'This is what opens the document. Choose a long passphrase, since length resists guessing better than symbol substitution.',
      },
      {
        name: 'Add an owner password if you need restrictions',
        text: 'The owner password controls printing, copying and editing. Set one when the file should be readable but not reusable.',
      },
      {
        name: 'Choose which actions to allow',
        text: 'Tick the permissions you want to grant. Allowing printing while disabling copying and editing is common.',
      },
      {
        name: 'Protect the file and download it',
        text: 'The encrypted PDF is offered straight away. Keep the unprotected original until you no longer need it.',
      },
    ],
  },
  benefits: {
    heading: 'Why protect a PDF here',
    intro: 'For documents you would rather not hand to a stranger\u2019s server.',
    items: [
      {
        title: 'Encrypted before anything leaves your machine',
        text: 'Your file is encrypted in the tab and only then offered as a download, so no unprotected copy exists elsewhere.',
      },
      {
        title: 'Separate open and permission passwords',
        text: 'Send a document that opens freely but cannot be edited, while the owner password stays with you.',
      },
      {
        title: 'Standard output any reader understands',
        text: 'AES encryption through the PDF standard security handler means no plugin or extra software is needed.',
      },
      {
        title: 'Several documents in one pass',
        text: 'Add a folder of invoices or statements and protect the batch rather than repeating the job file by file.',
      },
      {
        title: 'No account, no queue, works offline',
        text: 'There is no signup and no waiting on a remote job, and the tool keeps working once your connection drops.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'This tool has no backend. The site is static files and every operation runs in JavaScript inside your browser, so your PDF is never uploaded, queued or stored anywhere else.',
      'The file is read with the browser\u2019s own File API, encrypted locally and written back as a download. Nothing about the document, its name or your password is transmitted or kept.',
      'Because nothing is stored, a lost password cannot be recovered. There is no reset route and no copy on our side.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'PDF permissions are enforced by the reader application, not by mathematics. They deter casual copying, but other software can ignore them. Encrypting the contents is the part that genuinely protects a document.',
      'A lost password cannot be recovered and there is no way for us to unlock the file, so record it in a password manager before deleting the original.',
      'Some older or minimal readers ignore permission flags or refuse AES-encrypted files, so test with the reader your recipient is likely to use.',
      'Very large scanned PDFs take longer, because every byte is processed before the download is ready.',
    ],
  },
  faqs: [
    {
      question: 'Is my PDF uploaded to a server to be encrypted?',
      answer:
        'No. There is no server component. Your browser reads the file and encrypts it in the tab. You can confirm this by opening developer tools, switching to the Network tab and protecting a document while you watch the requests; the only traffic is the page and its scripts.',
    },
    {
      question: 'Can I recover a PDF if I forget the password?',
      answer:
        'No. The password is not stored on your device or on ours, so there is nothing to recover it from. Keep the unencrypted original until you have recorded the password somewhere safe, because an encrypted file without its password cannot be opened at all.',
    },
    {
      question: 'What is the difference between a user and an owner password?',
      answer:
        'The user password is required to open the document. The owner password controls what a compliant reader permits once it is open, such as printing, copying text or editing. A document protected only with an owner password can be opened by anyone, but the permission limits still apply.',
    },
    {
      question: 'Do the restrictions actually stop someone copying my text?',
      answer:
        'They stop ordinary copying in a compliant reader and discourage casual reuse, but they are not tamper-proof. Permissions are instructions that a reader agrees to follow, and other software can bypass them. Treat the open password as the real protection.',
    },
    {
      question: 'Will the protected PDF open in Chrome, Preview or on a phone?',
      answer:
        'Yes, in any reader supporting standard PDF encryption, which all mainstream modern readers do. You will be prompted for the user password when opening the file. Very old or minimal viewers occasionally refuse AES-encrypted documents, so test with the reader your recipient uses.',
    },
    {
      question: 'Does this add a watermark or alter my document?',
      answer:
        'No. The pages, text and images are unchanged and nothing is stamped on them. The only difference is that the contents are encrypted and the security settings are written in. Your original file on disk is untouched, so a clean copy is always available.',
    },
  ],
};
