export function ZipVs7zVsRarWhichArchiveFormatArticle() {
  return (
    <>
      <p>
        There are only three archive formats you are likely to be handed in practice, and the choice
        between them comes down to a single question: who has to open the file? A format that saves
        20 per cent on size but leaves the recipient hunting for software they are not allowed to
        install has saved nothing.
      </p>
      <p>
        Short version: ZIP for anything you send to another person, 7z when you are archiving for
        yourself and want the smallest file, and RAR only when someone hands you one.
      </p>

      <h2>The formats in one paragraph each</h2>
      <h3>ZIP</h3>
      <p>
        ZIP dates from 1989 and is the only one of the three that is effectively universal. Windows
        Explorer, macOS Finder, every Linux desktop and every phone opens one without extra software.
        It compresses with DEFLATE, which is lossless and fast. Its classic form, ZIP32, cannot hold
        an archive or a single file larger than 4 GB; the ZIP64 extension removes both limits and is
        well supported by modern tools, though very old extractors still choke on it.
      </p>
      <h3>7z</h3>
      <p>
        7z is an open format, and its default LZMA2 compression is meaningfully stronger than
        DEFLATE. On mixed data such as source code, logs, documents and uncompressed images, it
        typically produces archives 10 to 30 per cent smaller than ZIP, and it supports solid
        compression, which treats many files as one continuous stream. The cost is real: on Windows
        you need 7-Zip or another tool that understands it, macOS needs a third-party utility, and
        solid archives cannot be partially extracted without decompressing everything ahead of the
        file you want.
      </p>
      <h3>RAR</h3>
      <p>
        RAR compresses well, sometimes slightly better than 7z on particular data sets, and its
        recovery records are genuinely useful for archives kept on unreliable media. The problem is
        licensing. RAR is proprietary, and while the official unrar implementation is free for
        extraction, creating a RAR file requires a paid WinRAR licence after the trial period.
        Windows, macOS and Linux all extract RAR without paying, but they cannot create one. If your
        workflow depends on making RAR files, you are renting that workflow from one vendor.
      </p>

      <h2>Compression: what the numbers actually look like</h2>
      <p>
        Compression ratio depends far more on the contents than on the format. The same format can
        produce a 70 per cent saving on text and a 2 per cent saving on video inside one job. Rough
        expectations for 7z against ZIP:
      </p>
      <ul>
        <li>
          <strong>Source code, CSV, logs, JSON, XML:</strong> the biggest gap, often 20 to 30 per
          cent smaller with 7z.
        </li>
        <li>
          <strong>Word documents, spreadsheets, presentations:</strong> modest gains, since Office
          files are already a ZIP container of XML. Expect single-digit percentages.
        </li>
        <li>
          <strong>Uncompressed images such as BMP or TIFF:</strong> large gains for both formats,
          with 7z usually ahead.
        </li>
        <li>
          <strong>JPEG, PNG, MP4, MP3, PDF:</strong> almost nothing, typically under 5 per cent and
          sometimes zero. The data is already compressed, so there is no structure left to exploit.
        </li>
      </ul>
      <p>
        This is why a ZIP full of holiday videos feels like it did nothing. It did nothing. Both
        formats are lossless, and lossless compression cannot beat entropy that has already been
        removed.
      </p>

      <h2>Encryption: the part people get wrong</h2>
      <p>
        ZIP has two encryption schemes and they are not equivalent. The original, known as ZipCrypto,
        is weak by modern standards: it is vulnerable to known-plaintext attacks, which matters when
        an attacker can guess part of a file's contents, as they often can with standard document
        headers. AES-256 ZIP exists and is sound, but support is patchy. Windows Explorer cannot
        create encrypted ZIPs at all, macOS Finder cannot either, and some mobile and older desktop
        tools fail to open an AES archive without explanation. A password the recipient cannot use is
        worse than no password, because it usually ends with the file being emailed in the clear as a
        workaround.
      </p>
      <p>
        7z supports AES-256 and can also encrypt file names, so the archive listing reveals nothing
        about the contents. That is a genuine advantage when the names themselves are sensitive, such
        as a folder called <code>redundancy-list-2026</code>. RAR supports AES-256 as well. For either
        format the practical guidance is the same: use a long passphrase, and send it through a
        different channel from the archive. A password in the follow-up email protects against very
        little.
      </p>

      <h2>Compatibility in practice</h2>
      <ul>
        <li>
          <strong>Windows:</strong> ZIP opens natively. 7z and RAR need software, and on managed
          machines installing it may be blocked.
        </li>
        <li>
          <strong>macOS:</strong> ZIP opens natively. 7z and RAR need a third-party tool or a
          command-line utility.
        </li>
        <li>
          <strong>Linux:</strong> ZIP and 7z are usually one package away, and both are common.
        </li>
        <li>
          <strong>iOS and Android:</strong> ZIP is handled by the built-in Files app on both. Support
          for 7z varies by device and app, while RAR extraction is common and RAR creation is not.
        </li>
        <li>
          <strong>Upload portals:</strong> these frequently accept only ZIP. Some reject anything
          they cannot inspect, and encrypted or exotic archives are the first to be refused.
        </li>
      </ul>

      <h2>What to use</h2>
      <ol>
        <li>
          <strong>Sending files to another person:</strong> ZIP, without hesitation. It costs you
          maybe 15 per cent in size and buys the guarantee that the file opens. If the archive is too
          big to send, shrink the contents rather than changing the format.
        </li>
        <li>
          <strong>Archiving for yourself:</strong> 7z. You control the software, solid compression
          pays off across many small files, and AES-256 with encrypted file names is available when
          you want it.
        </li>
        <li>
          <strong>Long-term storage of a large job:</strong> 7z with a recovery record, or a split
          archive, and verify it by extracting once before you delete the originals.
        </li>
        <li>
          <strong>Someone sends you a RAR:</strong> extract it and move on. There is no reason to
          adopt a proprietary format just because one file arrived in it.
        </li>
      </ol>
      <p>
        One last point in ZIP's favour, and the reason it has survived for decades: it is a container,
        not just a compressor. Each file inside is compressed independently, so a ZIP can be listed,
        partially extracted and even updated in place without touching the rest of the archive. That
        random access is what makes ZIP the format tools and websites agree on.
      </p>
    </>
  );
}
