export function renderImageGrid(imagePaths) {
  const grid = document.createElement('div');
  grid.className = 'image-grid';

  // Pad to next multiple of 3 for a clean 3-column layout
  const targetCount = Math.ceil(imagePaths.length / 3) * 3;

  for (let i = 0; i < targetCount; i++) {
    const item = document.createElement('div');
    item.className = 'image-grid__item';
    if (i < imagePaths.length) {
      const img = document.createElement('img');
      img.src = imagePaths[i];
      img.loading = 'lazy';
      img.alt = 'Generated image';
      item.appendChild(img);
    }
    grid.appendChild(item);
  }

  return grid;
}
