export function stripHtmlToText(html) {
  if (typeof html !== 'string' || !html) {
    return '';
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body && doc.body.textContent) || '';
}

/**
 * @returns {{ html: string, truncated: boolean }}
 */
export function truncateHtml(html, maxChars) {
  if (typeof html !== 'string') {
    return { html: '', truncated: false };
  }
  if (html.length <= maxChars) {
    return { html, truncated: false };
  }
  return {
    html:
      html.slice(0, maxChars) +
      '<p data-lmstudio-truncated="1"><em>[… truncated for translation …]</em></p>',
    truncated: true,
  };
}
