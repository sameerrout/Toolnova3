export function PdfPageNumbersAndBatesNumberingExplainedArticle() {
  return (
    <>
      <p>
        Adding page numbers to a PDF sounds like a one-line job, and it is, until the document has a
        cover page, an appendix, or three sections merged from separate files. Then the questions
        start: does the cover count as page one, should the first numbered page show as 1 or as 3?
      </p>
      <p>
        There is also a second kind of numbering that most people meet only when a lawyer is
        involved. Bates numbering and ordinary page numbering look similar on the page and behave
        quite differently. Here is both, including the details that cause the most rework.
      </p>

      <h2>Page numbers and pagination are different things</h2>
      <p>
        A PDF has a page tree, which is the internal ordered list of pages. That order is the
        pagination, and it is what a viewer follows when you scroll or print. Page numbers added by
        a tool are a visual stamp drawn onto the page content, in the same layer as any other text.
        The consequences follow directly:
      </p>
      <ul>
        <li>
          <strong>Adding numbers does not change pagination.</strong> A stamped "17" does not move
          the page, and it does not make the document 17 pages long.
        </li>
        <li>
          <strong>Reordering pages later does not renumber anything.</strong> Stamp a document, then
          delete a page in the middle, and you have one that counts 1, 2, 4, 5. Burned-in numbers
          are just text and cannot update themselves.
        </li>
        <li>
          <strong>Stamps are removable, but only as content.</strong> Editing the page content stream
          to delete them is possible. There is no switch labelled "remove page numbers", because the
          PDF does not know those characters were a number.
        </li>
        <li>
          <strong>A separate mechanism exists for display.</strong> PDF page labels let a viewer show
          a different label from the physical page index, so page 4 of the file can display as "ii".
          Most viewers honour labels in the navigation box and none of them render the label visibly
          on the page.
        </li>
      </ul>
      <p>
        That is why sequence matters: reorder, delete, split, merge and rotate first, then add
        numbering last. Doing it the other way round means doing it twice.
      </p>

      <h2>How to set page numbers up properly</h2>
      <ol>
        <li>
          <strong>Decide whether the cover is page one.</strong> The most common convention is to
          count every physical page but suppress the stamp on the cover, which keeps the printed
          number matching the page's real position in the file. That matters as soon as anyone
          refers to "page 12" in a printed copy.
        </li>
        <li>
          <strong>Choose the position and mirror it.</strong> Outside edge for duplex printing,
          centred for single-sided, bottom-right for most business documents. Mirrored outside edges
          stamp odd pages on the right and even pages on the left.
        </li>
        <li>
          <strong>Set a first numbered page.</strong> If the cover is unnumbered, decide whether the
          second page reads "1" or "2". Neither is wrong, but mixing them across a document is.
        </li>
        <li>
          <strong>Choose a format.</strong> Plain numerals such as <code>7</code>, or a fuller form
          such as <code>Page 7 of 42</code>. Roman numerals are the convention for front matter in
          longer documents, with arabic numerals restarting at 1 for the body.
        </li>
        <li>
          <strong>Set size and margin.</strong> Around 9 to 10 points is legible without competing
          with the content. Keep the stamp at least 36 points from every page edge, or printers may
          crop it, and never place a number where a footer already has text.
        </li>
        <li>
          <strong>Use a page range for a second scheme.</strong> Front matter in roman numerals and
          the body in arabic means two passes over two ranges. Check the join between them.
        </li>
      </ol>

      <h2>Bates numbering, and why legal teams need it</h2>
      <p>
        Bates numbering is a convention from paper document production, where each page of a
        disclosure set was stamped with a sequential identifier so any page could be cited
        unambiguously. Digitally it works the same way: a fixed prefix plus a zero-padded sequential
        number, for example <code>ABC-000123</code>, running continuously across the whole
        production set rather than restarting for each document. The distinguishing features matter
        practically:
      </p>
      <ul>
        <li>
          <strong>One continuous sequence.</strong> If a set contains forty documents, numbering runs
          from the first page of the first to the last page of the fortieth without restarting, which
          is what makes a citation unambiguous.
        </li>
        <li>
          <strong>Fixed width.</strong> Zero padding to six or seven digits keeps stamps the same
          length, so they stay aligned when printed and sort correctly as text.
        </li>
        <li>
          <strong>A configured starting number.</strong> A new production usually begins at a chosen
          value, and supplements continue from where the earlier set ended.
        </li>
        <li>
          <strong>Applied to every page.</strong> Covers, index pages and blank separator sheets are
          stamped too. Consistency is the entire point: a set where three pages are unnumbered is a
          set where those pages cannot be cited.
        </li>
      </ul>
      <p>
        Because the stamp is a page-content operation, the same caution applies. Produce the final
        set first, stamp it, then stop editing. If a document is added afterwards, either append it
        with the next numbers in sequence or restamp the whole set. Partial restamping produces
        duplicate numbers, which defeats the purpose of the exercise.
      </p>

      <h2>Common mistakes and how to avoid them</h2>
      <ul>
        <li>
          <strong>Numbering before assembling.</strong> Merging three numbered PDFs gives you three
          sequences that each start at 1. Assemble, then number.
        </li>
        <li>
          <strong>Forgetting the page-range boundary.</strong> When numbering pages 3 to 20, confirm
          whether the tool counts from the start of the document or the start of the range. The
          difference is a whole sequence shifted by two.
        </li>
        <li>
          <strong>Stamping over existing content.</strong> A footer with a reference number, a
          confidentiality notice or a watermark is easy to stamp on top of.
        </li>
        <li>
          <strong>Using a font that is not embedded.</strong> If the tool relies on a font the viewer
          may not have, numbers can render inconsistently or disappear.
        </li>
        <li>
          <strong>Restamping an already stamped document.</strong> Running the tool twice gives you
          two numbers on every page, so check the pages before you start.
        </li>
      </ul>
      <p>
        If the document needs a visible identifier that is not a sequence, such as a draft notice or
        a client name on every page, that is watermarking rather than numbering. Either way the
        workflow is the same: finish the document, stamp it once, and keep an unnumbered copy as the
        master.
      </p>
    </>
  );
}
