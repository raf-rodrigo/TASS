export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return '';
  const hexClean = hex.replace('#', '');
  if (hexClean.length !== 6) return hex;
  const r = parseInt(hexClean.substring(0, 2), 16);
  const g = parseInt(hexClean.substring(2, 4), 16);
  const b = parseInt(hexClean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
