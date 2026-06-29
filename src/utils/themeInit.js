export function applyAccent(accent = 'orange') {
  document.documentElement.setAttribute('data-accent', accent)
  localStorage.setItem('dineflow_accent', accent)
}

export function initTheme() {
  const saved = localStorage.getItem('dineflow_accent') || 'orange'
  const accent = ['orange', 'blue', 'green'].includes(saved) ? saved : 'orange'
  applyAccent(accent)
}
