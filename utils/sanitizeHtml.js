import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes incoming email HTML before it's stored in MongoDB.
 * This is layer 1 of defense against malicious email content; layer 2 is the
 * sandboxed <iframe> (no allow-scripts) the frontend renders it in.
 */
export function sanitizeEmailHtml(dirtyHtml) {
  if (!dirtyHtml) return '';

  return sanitizeHtml(dirtyHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'span', 'font', 'center', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'u', 'style',
    ]),
    allowedAttributes: {
      '*': ['style', 'class', 'align', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'bgcolor', 'valign'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'cid'],
    allowedSchemesByTag: { img: ['http', 'https', 'cid', 'data'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
    // script, iframe, object, embed, form, link, meta are simply absent from allowedTags above,
    // so sanitize-html strips them — including the contents of <script>, which it treats as non-textual.
  });
}
