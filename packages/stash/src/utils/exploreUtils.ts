export function tabLabel(id: string) {
  if (id === 'topList') return 'Top List';
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}
