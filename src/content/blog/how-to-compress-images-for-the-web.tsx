export function HowToCompressImagesForTheWebArticle() {
  return (
    <>
      <p>
        Most people who want a smaller image start by dragging the quality slider down and watching
        the file shrink. It works, but it is the least efficient lever available. Three decisions
        matter more, and two of them are made before you open a compressor at all: what the image
        actually needs to be, and which format it is stored in.
      </p>
      <p>
        This guide covers the order that gets the best result, the settings worth using, and how to
        hit an exact file size when a form refuses anything larger.
      </p>

      <h2>Resize before you compress</h2>
      <p>
        File size scales roughly with the number of pixels, and pixel count scales with the square of
        the dimensions. Halve the width and height and you have removed about three-quarters of the
        pixels. No quality setting can compete with that. If a photo will be displayed 800 pixels
        wide, storing it at 4000 pixels wide and compressing it hard is a worse trade than storing it
        at 1600 pixels wide and compressing it gently. The second image looks sharper at the same
        file size.
      </p>
      <p>
        The practical rule is to pick a display width and multiply by two for high-density screens,
        which covers most phones and laptops:
      </p>
      <ul>
        <li>Full-width hero in a 1200 pixel column: export at 2400 pixels wide.</li>
        <li>Image inside an article body: export at 1600 pixels wide.</li>
        <li>Thumbnail or card shown at 400 pixels: export at 800 pixels wide.</li>
        <li>Social preview image: 1200 by 630 pixels, the size the platforms expect.</li>
        <li>Favicon: a real icon file at the sizes you declare, not a large logo scaled down.</li>
      </ul>
      <p>
        When resizing, use a proper resampling filter rather than nearest neighbour. Bicubic or
        Lanczos give smooth results on photographs; nearest neighbour is for pixel art.
      </p>

      <h2>Pick the format from the content, not from habit</h2>
      <ul>
        <li>
          <strong>JPEG</strong> uses lossy compression based on a discrete cosine transform, throws
          away fine detail the eye is bad at noticing, and has no alpha channel. It remains the
          safest choice for photographs when you cannot be sure what will open the file.
        </li>
        <li>
          <strong>PNG</strong> is lossless and supports transparency, which makes it right for
          logos, icons, interface screenshots and anything with sharp edges or flat colour. It is a
          poor choice for photographs: a full-colour photo saved as PNG is usually several times
          larger than the same photo as JPEG.
        </li>
        <li>
          <strong>WebP</strong> handles both lossy and lossless modes, supports alpha and animation,
          and is typically 25 to 35 per cent smaller than an equivalent-quality JPEG. Every current
          major browser supports it.
        </li>
        <li>
          <strong>AVIF</strong> usually beats WebP on size again, particularly at low bitrates, but
          encoding is noticeably slower and very old browsers cannot display it. If you already serve
          WebP with a JPEG fallback, AVIF is the next step rather than a replacement.
        </li>
        <li>
          <strong>GIF</strong> is limited to 256 colours per frame and is wrong for photographs or
          video-like animation, where a modern video format is far smaller.
        </li>
      </ul>

      <h2>Choose quality settings that survive inspection</h2>
      <p>
        Quality scales are not comparable between tools. What one compressor calls 80, another calls
        65, so recommendations are approximate, but the useful bands are fairly stable:
      </p>
      <ul>
        <li>
          <strong>JPEG at 75 to 85</strong> covers most photographs. Below about 70, gradients in
          skies and skin start to show banding and blocky artefacts around edges.
        </li>
        <li>
          <strong>WebP at 75 to 85</strong> behaves similarly and often looks cleaner than JPEG at
          the same nominal number.
        </li>
        <li>
          <strong>PNG has no quality setting.</strong> It is lossless, so the only real controls are
          colour depth and whether the image is indexed to a palette. Reducing a screenshot to 256
          colours can shrink it dramatically with no visible change, because most interface
          screenshots contain fewer distinct colours than that anyway.
        </li>
      </ul>
      <p>
        Inspect the result at 100 per cent rather than trusting the viewer's fit-to-window preview,
        which hides compression damage by shrinking it. Look at three places: a smooth gradient, a
        hard edge between contrasting colours, and any small text.
      </p>

      <h2>How to hit an exact target file size</h2>
      <p>
        Forms and upload portals often impose a hard cap, such as 500 KB per image. Chasing that by
        hand wastes time, so let the tool search for you:
      </p>
      <ol>
        <li>Resize to the dimensions you actually need first, which removes most of the work.</li>
        <li>
          Set a target size, for example 400 KB, and let the compressor try a quality setting,
          measure the output and adjust.
        </li>
        <li>
          If the target is not reachable at a reasonable quality, reduce the dimensions by 10 per
          cent and try again. A slightly smaller image at good quality beats a full-size image that
          has been crushed.
        </li>
        <li>
          Check the result yourself, because a target-size search optimises for bytes, not for how
          the image looks.
        </li>
      </ol>

      <h2>What compression does to your photo's metadata</h2>
      <p>
        Re-encoding usually drops the EXIF block, which has two consequences. The one people notice
        is orientation: a portrait photo often relies on an EXIF orientation tag, and if the tag is
        removed without the pixels being rotated, the image arrives sideways.
      </p>
      <p>
        The consequence people do not notice is that the same block can include GPS coordinates, the
        exact capture time, and the camera make and model. Stripping it before publishing is usually
        what you want, but it should be a decision rather than a side effect.
      </p>

      <h2>Why the browser is a good place to do this</h2>
      <p>
        Image compression is a per-file job that needs no server. The browser already has the
        decoder, and the canvas API can re-encode to JPEG, WebP or AVIF without a network round trip.
        A browser-based compressor that never uploads your image is therefore not a compromise on
        convenience; it is faster, because there is no upload stage at all. It also keeps the metadata
        question in your hands, since nothing leaves the machine.
      </p>
      <p>
        For a batch, work in this order: resize, choose the format, set a sensible quality, then
        check the worst-looking image at full size. That sequence gets most pages to a fraction of
        their original weight without anyone noticing the difference.
      </p>
    </>
  );
}
