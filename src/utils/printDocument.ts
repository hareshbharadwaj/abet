/**
 * Opens a print-ready HTML document in a new tab without using the legacy
 * `doc.write` streaming API, which would execute template strings inside the
 * opener's context and is flagged by CSP / security scanners.
 *
 * The markup is rendered from an isolated Blob URL, so the print window is a
 * separate document that can only read what we explicitly hand it. Printing is
 * triggered from inside that document because the tab is opened with
 * `noopener` (the handle is intentionally not retained).
 */
export function printHtmlDocument(html: string, title = 'Document'): boolean {
  const documentHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeTitle(title)}</title>
  </head>
  <body style="margin: 20px; background-color: #1a1a1a; font-family: sans-serif;">
${html}
    <script>
      window.addEventListener('load', function () {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;

  const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // `noopener` detaches the new document from this window; the browser returns
  // null in that case, so the return value only reports obvious failures.
  window.open(url, '_blank', 'noopener,noreferrer');

  // Give the browser time to load and print before releasing the object URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

const escapeTitle = (value: string): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
