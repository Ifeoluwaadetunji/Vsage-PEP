import sanitizeHtml from 'sanitize-html';

export function sanitizeEmailBody(dirtyHtml: string): string {
  if (!dirtyHtml) return '';
  
  return sanitizeHtml(dirtyHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'span' ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'data-*'],
      a: ['href', 'name', 'target', 'rel'],
      span: ['style'],
      div: ['style'],
      p: ['style']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    },
    allowProtocolRelative: false,
    enforceHtmlBoundary: true
  });
}
