import type { ToolContent } from '@/content/types';

export const removeBackgroundContent: ToolContent = {
  overviewHeading: 'What this background remover does',
  overview: [
    'This tool cuts the subject out of a photograph and gives you a transparent PNG. It runs a segmentation model on your own device through ONNX Runtime Web, producing a soft alpha matte so edges fade naturally rather than being chopped with a hard line. You can keep the transparency or place a solid colour behind the subject.',
    'It is genuine machine learning rather than a colour-key trick, so no plain backdrop is needed. Photographs taken in a kitchen, an office or a garden usually work, because the model learned what people, products and animals look like instead of relying on colour thresholds.',
    'Segmentation is nevertheless hard, and the honest picture matters. Clean edges on a person, product photography and pets against grass are the strongest cases. Flyaway hair, fur, glassware and semi-transparent fabric are difficult for any model of this kind and need touching up for precision work.',
  ],
  howTo: {
    heading: 'How to remove an image background',
    intro: 'The model loads once and is then cached, so later images are processed almost immediately.',
    steps: [
      {
        name: 'Wait for the model on first use',
        text: 'Your browser downloads roughly 40 MB of model weights from a public content delivery network, then caches them for later visits.',
      },
      {
        name: 'Add one image',
        text: 'Drop in a JPG, PNG or WebP file. One image is processed at a time so the model has the full attention of your device.',
      },
      {
        name: 'Let the segmentation run',
        text: 'Progress shows while the model works. A modern laptop takes a few seconds and a phone takes longer, because the work is local.',
      },
      {
        name: 'Review the cut-out edges',
        text: 'Check the result at full size around hair, shoulders and anything held, and refine the edge if it is too tight or too soft.',
      },
      {
        name: 'Choose a transparent or coloured background',
        text: 'Download the transparent PNG to composite the subject elsewhere, or pick a solid colour for a profile picture or listing.',
      },
    ],
  },
  benefits: {
    heading: 'Why remove backgrounds here',
    intro: 'For a quick cut-out without handing a photograph to a service that keeps a copy.',
    items: [
      {
        title: 'Processing runs on your own device',
        text: 'The model executes in your browser, so your photograph is decoded, segmented and re-encoded locally and never uploaded.',
      },
      {
        title: 'No plain backdrop required',
        text: 'Learned segmentation copes with ordinary photographs taken in ordinary places, without a green screen or studio lighting.',
      },
      {
        title: 'Transparent PNG with a soft edge',
        text: 'The result keeps a feathered matte rather than a jagged cut, so the subject sits convincingly on a new background.',
      },
      {
        title: 'One-time download, then it works offline',
        text: 'After the model is cached the tool runs without a connection, unlike most AI image tools that call a server per image.',
      },
      {
        title: 'No account, no credits, no watermark',
        text: 'There is no signup and no free preview followed by a paywall, and nothing is added to your image.',
      },
    ],
  },
  privacy: {
    heading: 'Your files stay on your device',
    paragraphs: [
      'Your image never leaves your computer. It is read from disk by the browser, segmented by a model running in the same tab, and written back out as a PNG. There is no upload step and no backend to accept one.',
      'One thing does travel over the network, and it is worth being precise: the first time you use the tool your browser fetches about 40 MB of model weights from a public content delivery network and caches them. That request carries no information about your image, and afterwards the tool runs with the network disconnected.',
      'If avoiding even that download matters to you, there is no version of this tool that works without the model. What you can rely on is that no photograph, thumbnail, filename or result is ever transmitted or retained anywhere.',
    ],
  },
  goodToKnow: {
    heading: 'Good to know',
    items: [
      'Results are strongest on people, products and pets against a reasonably distinct background. Hair, fur, glass, mesh and semi-transparent clothing are genuinely difficult, and the matte will usually need touching up for professional work.',
      'The first use downloads about 40 MB of model weights, which is the slowest part on a weak or metered connection. Later visits use the cached copy.',
      'One image is processed at a time, which keeps memory predictable on phones but makes a fifty-product catalogue a repetitive task rather than a batch run.',
      'Very large images are scaled down internally before segmentation, so on a photograph with very fine detail the matte can be slightly less precise than the rest of the image.',
    ],
  },
  faqs: [
    {
      question: 'Is my photo uploaded to a server to remove the background?',
      answer:
        'No. The segmentation model runs inside your browser with ONNX Runtime Web, so your image is processed locally on your own device. The only network request involved is the one-time download of the model weights, which contains no information about your image. Keep developer tools open and you will see no request carrying your photo.',
    },
    {
      question: 'Why does the first use take so long?',
      answer:
        'Because your browser is downloading the segmentation model, which is roughly 40 MB, from a public content delivery network. It is cached afterwards, so the second image and every later visit start processing almost immediately. On a slow connection this first download can take a minute or more.',
    },
    {
      question: 'Can it handle hair, fur or transparent objects?',
      answer:
        'It handles them imperfectly, which is true of segmentation models generally. Wispy hair, animal fur and glass edges are the hardest cases, because the boundary between subject and background is genuinely ambiguous at pixel level. Results are usually usable, but refine the edges in an image editor for anything professional.',
    },
    {
      question: 'What format is the result, and does it keep transparency?',
      answer:
        'The output is a PNG with an alpha channel, the format that preserves transparency reliably. You can also choose a solid background colour, in which case the subject is composited onto it before saving. Converting that PNG to JPG later will require a fill colour, because JPG cannot store transparency.',
    },
    {
      question: 'Can I remove backgrounds from several images at once?',
      answer:
        'No, images are processed one at a time. Running several at once would compete for the same processor and memory without finishing any sooner, and on a phone it risks the tab being closed by the browser. Repeated runs are quick once the model is cached.',
    },
    {
      question: 'Does it work offline?',
      answer:
        'Yes, after the model has been downloaded and cached once. The page itself must also have been loaded, so a first visit needs a connection. Once both are cached you can disconnect and keep removing backgrounds without any network access at all.',
    },
  ],
};
