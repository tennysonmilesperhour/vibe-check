// Share cards: capture a DOM node as a downloadable PNG.
// html2canvas is dynamically imported so it never touches the main bundle.

export async function shareNodeAsImage(node, filename = 'vibe-check.png') {
  if (!node) throw new Error('Nothing to capture');
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(node, {
    backgroundColor: null,
    scale: Math.min(3, window.devicePixelRatio * 2 || 2),
    useCORS: true,
    logging: false,
  });
  const url = canvas.toDataURL('image/png');
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
}
