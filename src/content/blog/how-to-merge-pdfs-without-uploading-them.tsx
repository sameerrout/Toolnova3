export function HowToMergePdfsWithoutUploadingThemArticle() {
  return (
    <>
      <p>
        Search for a free PDF merger and you will find dozens of pages that all work the same way:
        drag your files into a box, wait for an upload bar, wait again for a progress bar, then
        download the result. The interface looks instant, but the arithmetic behind it is not. Your
        contract, your invoice, your scanned passport and your medical letter are copied in full to
        hardware owned by someone you have never met, processed there, and stored there for some
        period you cannot see. The download you get back is a fresh copy, and the upload you sent is
        still sitting on a disk somewhere.
      </p>
      <p>
        None of that is necessary. A modern browser can read a PDF, rebuild it and hand it back to
        you without a byte going over the network.
      </p>

      <h2>Why merging a PDF is a privacy decision</h2>
      <p>
        Merging is one of those jobs people do without thinking about the contents, and it is rarely
        a single document, because the reason you merge is that the documents belong together. A
        mortgage application bundles payslips, bank statements and an ID scan. A job application
        bundles a CV, a covering letter, a degree certificate and a reference. The merged file is more
        sensitive than any of its parts, because it puts the whole picture in one place with your name
        on the front.
      </p>
      <p>
        Compare that with the file size. A four-page PDF is typically well under 2 MB, a trivial
        upload, which is exactly why so few people pause before doing it. Small files are not low
        risk; they are just cheap to send.
      </p>

      <h2>Two ways a merge can happen</h2>
      <h3>Server-side merging</h3>
      <p>
        The file goes up over HTTPS, which protects it in transit but not after it lands. A worker
        process on the receiving machine concatenates the pages and writes a new file, which is then
        made available at a URL. What happens to both copies afterwards depends entirely on the
        operator: some delete within an hour, some keep them for a week, and some keep only the output
        while the input lingers in a queue. Backups and third-party hosting providers can keep copies
        you did not intend to leave behind.
      </p>
      <h3>Browser-side merging</h3>
      <p>
        The PDF is read using the browser's own file APIs. A JavaScript library parses the page tree,
        copies each page object into a new document structure, and serialises a new PDF, which is
        written back to your disk through a normal download or the File System Access API. The only
        network traffic is the page itself, which is why a merge works fine on a plane in flight mode
        once the tab has loaded.
      </p>
      <p>
        Browser merging has one real constraint: the work happens in your tab's memory, so several
        gigabytes of high-resolution scans is not a good fit, and no honest tool should pretend
        otherwise.
      </p>

      <h2>How to merge PDFs in the browser</h2>
      <ol>
        <li>
          <strong>Drop the files in the order you want them.</strong> Most mergers keep the order
          you added the files, not alphabetical order. If you drag a folder's worth of documents in
          at once, the order is whatever the picker returns, so check the list before you commit.
        </li>
        <li>
          <strong>Read the list, not the thumbnails.</strong> Thumbnails look reassuring and hide
          everything. What matters is file name, page count and total size, plus the running total
          that tells you whether the output will be practical to email.
        </li>
        <li>
          <strong>Reorder with the up and down controls.</strong> A merged bundle is read front to
          back, so put the covering page first and any appendix last.
        </li>
        <li>
          <strong>Merge and save.</strong> The result downloads to your normal downloads folder. If
          the total is large, your browser may ask where to save the file first, which writes it
          straight to disk instead of holding it in memory.
        </li>
        <li>
          <strong>Check the page count.</strong> The output should equal the sum of the inputs. If it
          does not, one of your source files was damaged or unreadable, and the tool should have told
          you which one.
        </li>
      </ol>

      <h2>What goes wrong when you merge PDFs</h2>
      <ul>
        <li>
          <strong>Encrypted files.</strong> A PDF with an open password cannot be parsed at all
          without the password. A PDF with only an owner password, which restricts printing or
          copying, is a different case and many libraries will merge it. If a tool refuses a file
          with no obvious reason, check whether it is encrypted.
        </li>
        <li>
          <strong>Form fields.</strong> Two documents that each contain a field named{' '}
          <code>signature</code> collide when they are combined. Values can be lost, and some
          mergers flatten forms rather than preserve them. If you need the fields to keep working,
          keep the forms in separate files.
        </li>
        <li>
          <strong>Mixed page sizes.</strong> Merging an A4 page and a US Letter page does not resize
          anything. Each page keeps its own dimensions, which is normally what you want but looks
          untidy in a viewer that assumes uniformity.
        </li>
        <li>
          <strong>Lost bookmarks and metadata.</strong> Document outlines and document-level
          properties rarely survive a merge, so if the navigation pane mattered you will be
          rebuilding it afterwards.
        </li>
        <li>
          <strong>Scanned pages stay unsearchable.</strong> Merging does not add a text layer, so a
          bundle of scans is still images, and you need optical character recognition to search it.
        </li>
      </ul>

      <h2>When merging is the wrong tool</h2>
      <p>
        Merging is for combining. If what you actually want is one chapter pulled out of a report,
        split the document instead. If the page order is wrong, or a page is upside down, reorder or
        rotate the pages rather than merging and re-splitting. If the finished bundle is too heavy
        to send, compress it afterwards, since image-heavy scans respond far better to compression
        than text pages do.
      </p>
      <p>
        And if you would rather not think about any of this, use a merger that runs entirely inside
        your browser. The point is not that every online service is dishonest. It is that you
        cannot audit a machine you do not own, and for documents that carry your address, your
        income and your signature, the version that never leaves your laptop is the easier decision
        to defend.
      </p>
    </>
  );
}
