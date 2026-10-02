export function HowToShareLargeFilesArticle() {
  return (
    <>
      <p>
        The moment a file crosses a certain size, every convenient method stops working. Email
        refuses it. A chat app re-compresses it. The free tier of a cloud drive is already full. At
        that point most people go shopping for storage, when the more useful first step is to ask why
        the file is that big and whether all of it is needed.
      </p>
      <p>
        This guide covers shrinking files before you send them, splitting what cannot be shrunk, and
        choosing a transfer method that matches how the recipient will actually use the file.
      </p>

      <h2>Step one: shrink the file, in the right order</h2>
      <p>
        Compression helps far less than people hope, because most large files are already compressed
        internally. That is true of JPEG, PNG, MP4, MP3, PDF, DOCX, XLSX and any existing ZIP.
        Re-zipping a folder of video typically saves well under 5 per cent, which will not rescue a
        3 GB transfer. What does work depends on the file type:
      </p>
      <ul>
        <li>
          <strong>Photos and screenshots:</strong> the biggest wins, because resolution is usually
          far higher than the destination needs. Resizing to the display size and re-encoding as WebP
          or AVIF typically cuts a screenshot by half or more. A browser-based compressor that never
          uploads your image handles this without a round trip.
        </li>
        <li>
          <strong>Scanned PDFs:</strong> these are images wrapped in a PDF, so they respond to the
          same treatment. Downsampling the embedded images to 150 dots per inch for on-screen reading
          and keeping 300 for print is usually the difference between an 80 MB scan and an 8 MB one.
        </li>
        <li>
          <strong>Text PDFs:</strong> already efficient. Compression mostly re-encodes embedded
          images, so gains are modest, and there is a real risk of a larger file if the tool embeds
          fonts without subsetting them.
        </li>
        <li>
          <strong>Video:</strong> the only meaningful reduction is transcoding to a lower bitrate or
          a newer codec, or trimming what nobody will watch. A ZIP of a video is a container with no
          compression inside it.
        </li>
        <li>
          <strong>Office documents:</strong> a presentation bloated by embedded video shrinks
          dramatically if the video is linked instead of embedded. A spreadsheet bloated by a million
          unused formatted rows needs those rows deleted, not compressed.
        </li>
      </ul>

      <h2>Step two: split what cannot be shrunk</h2>
      <p>
        Many portals impose a per-file limit that no amount of compression will get under, and the
        answer is a multi-part archive. In 7-Zip you set a volume size such as 100 MB or 2 GB and the
        tool writes <code>archive.7z.001</code>, <code>archive.7z.002</code> and so on. On Linux,{' '}
        <code>zip -s 2g -r split.zip folder/</code> does the same. The recipient needs every part in
        the same folder before extraction, and no part can be opened on its own.
      </p>
      <p>
        Two details decide whether this works. Choose a volume size comfortably under the limit,
        because a 100 MB cap applied to a 100 MB file often fails on a rounding difference. And
        decide which failure you prefer: large parts mean fewer things to go wrong, small parts mean
        only one part needs resending. For a PDF rather than an archive, split by page range instead,
        which produces files the recipient can read immediately without reassembly.
      </p>

      <h2>Step three: choose the channel honestly</h2>
      <ul>
        <li>
          <strong>Email attachments:</strong> the most familiar and the worst. Limits are typically
          around 20 to 25 MB in total, the file is stored on at least two mail servers, and it is
          duplicated into every recipient's mailbox indefinitely.
        </li>
        <li>
          <strong>Cloud drive links:</strong> good if you already pay for storage, because the quota
          is what you already have. The trade-off is another copy of the file in a folder you will
          forget about, plus permission links that are easy to share more widely than intended. Check
          the link permissions before you send, not after.
        </li>
        <li>
          <strong>Temporary transfer services:</strong> convenient, with an expiry date that is both
          the feature and the risk. If the recipient opens the link late, you start again. Treat the
          file as public while the link is live, and set the shortest expiry that is practical.
        </li>
        <li>
          <strong>Direct device-to-device transfer:</strong> when both people are online at the same
          time, the bytes move straight between the two machines and nothing is stored in between. It
          avoids upload time, because you are uploading to the recipient rather than to a server and
          back down again.
        </li>
        <li>
          <strong>Physical media:</strong> for anything over a few tens of gigabytes, a drive or card
          in the post is faster, cheaper and more private than any network transfer, and it is the
          only method that works for a recipient with no reliable internet.
        </li>
      </ul>

      <h2>Practical rules that save the most time</h2>
      <ol>
        <li>
          <strong>Ask what the recipient will do with it.</strong> A video that only needs reviewing
          does not need to be 4K. A scan that only needs reading does not need 600 dots per inch.
        </li>
        <li>
          <strong>Send a checksum with large files.</strong> On Windows,{' '}
          <code>certutil -hashfile file.zip SHA256</code> prints a hash; on macOS and Linux,{' '}
          <code>shasum -a 256 file.zip</code> does the same. If the two values match, the file arrived
          intact. This costs one line of text and saves an hour of confusion when a large download
          truncates.
        </li>
        <li>
          <strong>Name files so they sort sensibly.</strong> Zero-padded dates and a project name turn
          a folder of seventeen documents called "final" into something usable.
        </li>
        <li>
          <strong>Decide the retention question before you send.</strong> If the contents are
          confidential, the relevant question is not how fast the transfer is but where a copy exists
          afterwards. Deleting your copy does not delete theirs.
        </li>
        <li>
          <strong>Keep the original.</strong> Compression and splitting are lossy in the sense that
          you cannot recover what you removed.
        </li>
      </ol>

      <h2>When a link is the wrong answer</h2>
      <p>
        If a file is confidential and the recipient is available, sending a link through a third-party
        service is usually the least private option on the list. If it is large and the recipient has
        a slow connection, a link is also the slowest, because the bytes travel your upload plus their
        download. Sharing works best when the method matches the constraint that actually exists, and
        most of the time that constraint is size, which is something you can reduce before spending
        anything on storage.
      </p>
    </>
  );
}
