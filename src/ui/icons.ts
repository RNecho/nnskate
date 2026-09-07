const paths: Record<string, string> = {
  gamepad: '<path d="M7 6h10c3 0 5 10 3 12-1 1-3-1-5-3H9c-2 2-4 4-5 3C2 16 4 6 7 6Z"/><path d="M8 9v4m-2-2h4"/><circle cx="16" cy="10" r=".7"/><circle cx="18" cy="12" r=".7"/>',
  volume: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2.4 8M3 4v6h6"/>',
  sliders: '<path d="M4 5h16M4 12h16M4 19h16"/><path d="M8 3v4m8 3v4m-6 3v4" stroke-width="4"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  music: '<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
};

export function icon(name: string, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ''}</svg>`;
}

export const pixelStar = '<svg aria-hidden="true" viewBox="0 0 24 24" class="pixel-star"><path d="M10 1h4v6h3v3h6v4h-6v3h-3v6h-4v-6H7v-3H1v-4h6V7h3z" fill="currentColor"/></svg>';

export const skateLogo = '<svg aria-hidden="true" viewBox="0 0 52 52" class="skate-logo"><rect x="1" y="1" width="50" height="50" rx="16" fill="currentColor" opacity=".12"/><path d="M24 7h5v7h7v5h-7v7h-5v-7h-7v-5h7z" fill="currentColor"/><path d="M10 31h4v3h26v-3h4v6h-4v3H14v-3h-4zM17 41h5v5h-5zm14 0h5v5h-5z" fill="currentColor"/></svg>';
