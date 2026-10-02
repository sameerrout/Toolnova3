export function HowToCreateAZipFileOnAnyDeviceArticle() {
  return (
    <>
      <p>
        Every major operating system ships with a ZIP tool already installed, and almost none of them
        label it clearly. That is the main reason people search for "how to make a zip file" when the
        answer is two clicks away. This guide covers the built-in route on each platform and what to
        do when you are on a locked-down laptop where the right-click menu has been trimmed.
      </p>
      <p>
        A word on what a ZIP is, because it explains most of the behaviour you will see. A ZIP is a
        container holding your files plus a directory recording each name, size and offset, and the
        contents are compressed with DEFLATE, which is lossless. That also means the archive is only
        as interesting as what is inside it, so a ZIP full of JPEGs will barely shrink, because JPEGs
        are already compressed internally.
      </p>

      <h2>Windows: three ways, one of them new</h2>
      <p>
        On Windows 11, select your files in File Explorer, right-click, and choose{' '}
        <strong>Compress to ZIP file</strong>. You get an archive named after the selected item,
        which you can rename straight away. On Windows 10, and on Windows 11 machines still showing
        the older menu, the wording differs:
      </p>
      <ol>
        <li>Select the files or folder you want to zip.</li>
        <li>
          Right-click and choose <strong>Send to</strong>, then{' '}
          <strong>Compressed (zipped) folder</strong>.
        </li>
        <li>Rename the new archive, since it inherits the name of the first selected item.</li>
      </ol>
      <p>
        The third route works on every version. Right-click empty space inside the folder you are
        working in, choose <strong>New</strong>, then <strong>Compressed (zipped) folder</strong>.
        An archive appears with its name ready to edit, and you can drag files into it, which is
        often the quickest way to collect loose files from several locations.
      </p>
      <p>
        Two limits are worth knowing. Explorer cannot create a password-protected ZIP, so encryption
        means different software. And the archive Explorer produces is a classic ZIP, which caps the
        whole thing at 4 GB by the ZIP32 format. For anything larger you need a tool that writes
        ZIP64, or you need to split the job.
      </p>

      <h2>macOS: right-click and Compress</h2>
      <p>
        Select one or more items in Finder, right-click, and choose <strong>Compress</strong>. You
        get <code>Archive.zip</code> when you selected several things, or <code>name.zip</code> when
        you selected one. To name the archive up front, use <strong>File &gt; Compress</strong>
        instead, which prompts before it writes anything. Finder also has no option to create a
        password-protected archive, so encryption on a Mac means the Terminal or a third-party tool.
      </p>
      <p>
        The command-line route gives you far more control, since macOS is built on a Unix base and
        includes the <code>zip</code> utility. The command is{' '}
        <code>zip -r archive.zip folder/</code>, where <code>-r</code> means recursive, so subfolders
        are included. Add <code>-e</code> to be prompted for a password, or <code>-0</code> to store
        files without compressing, which is useful when everything inside is already compressed.
      </p>

      <h2>Linux: the zip command</h2>
      <p>
        Desktop environments vary, but the command line is consistent across distributions. To zip a
        directory and keep its structure the command is{' '}
        <code>zip -r archive.zip folder/</code>. Common variations worth having to hand:{' '}
        <code>zip -r9 archive.zip folder/</code> forces maximum compression,{' '}
        <code>zip -j archive.zip folder/*.txt</code> junks the paths and stores every file at the top
        level, and <code>zip -s 2g -r split.zip folder/</code> produces a multi-part archive of
        roughly 2 GB per piece.
      </p>

      <h2>iPhone and iPad: long-press, then Compress</h2>
      <p>
        Zipping on iOS is possible but the placement is not obvious, because it is not in the Share
        sheet. Open the <strong>Files</strong> app, browse to the item, and{' '}
        <strong>long-press the file or folder</strong>. In the menu that appears, tap{' '}
        <strong>Compress</strong>, and a new <code>.zip</code> appears in the same folder. To zip
        several items at once, tap <strong>Select</strong> in the top corner, tick the files you
        want, then long-press any one of them and choose <strong>Compress</strong>.
      </p>
      <p>
        Two honest limitations. The built-in tool offers no compression level, no password option and
        no way to name the archive before it is created. And if the menu has no{' '}
        <strong>Compress</strong> entry, you are most likely looking at a file stored with a
        third-party provider rather than on the device or in iCloud Drive; copy it to{' '}
        <strong>On My iPhone</strong> first, where the option is always available.
      </p>

      <h2>Android: it depends on your file manager</h2>
      <p>
        Most manufacturers ship a file manager with a built-in Compress option. On a Samsung device,
        open <strong>My Files</strong>, long-press a file or folder, tap <strong>More</strong> and
        then <strong>Compress</strong>. Other manufacturers use similar wording, usually reachable
        from a long-press menu or an overflow button.
      </p>
      <p>
        Google's own <strong>Files by Google</strong> app is the exception that catches people out.
        It browses and cleans up storage well, but you cannot create a ZIP with it, so a phone that
        relies on it alone has no built-in way to compress a folder. The workarounds are to install
        the manufacturer's file manager if one exists for your device, install a general purpose file
        manager that handles archives, or zip the folder in a browser instead.
      </p>

      <h2>When you have no archive tool at all</h2>
      <p>
        Locked-down work machines, managed Chromebooks and borrowed computers often have the
        right-click menu stripped out by policy, and the files are on the machine you cannot modify,
        so zipping them elsewhere is not an option.
      </p>
      <p>
        This is where a browser-based ZIP creator earns its place. It loads like any web page, then
        reads your files with the browser's file API and compresses them with a library running inside
        the tab, writing the finished archive back to your disk. Nothing is uploaded, so it works on a
        machine where installing software is forbidden. There is no upload size limit to hit either,
        though a single classic ZIP still cannot exceed 4 GB.
      </p>
      <p>
        Whichever route you take, check the archive before you send it. One folder with twenty files
        should extract to one folder with twenty files, not to twenty loose files in someone else's
        Downloads directory.
      </p>
    </>
  );
}
