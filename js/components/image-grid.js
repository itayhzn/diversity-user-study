export function renderImageGrid(imagePaths) {
  const grid = document.createElement('div');
  grid.className = 'image-grid';

  for (const path of imagePaths) {
    const item = document.createElement('div');
    item.className = 'image-grid__item';
    const img = document.createElement('img');
    img.src = path;
    img.loading = 'lazy';
    img.alt = 'Generated image';
    item.appendChild(img);
    grid.appendChild(item);
  }

  return grid;
}
