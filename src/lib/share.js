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
    // The copy of the page replays any opening animation (a dialog zooming
    // in), which would lay the card out mid-motion; the copy stays still.
    onclone: (doc) => {
      const still = doc.createElement('style');
      still.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
      doc.head.appendChild(still);
    },
  });
  const url = canvas.toDataURL('image/png');
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
}
