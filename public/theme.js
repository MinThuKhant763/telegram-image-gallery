const storageKey = 'galleryTheme';
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function readStoredTheme() {
  try {
    const theme = localStorage.getItem(storageKey);
    return theme === 'dark' || theme === 'light' ? theme : '';
  } catch (error) {
    return '';
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function currentTheme() {
  return document.documentElement.dataset.theme || (mediaQuery.matches ? 'dark' : 'light');
}

function updateThemeControls() {
  const nextTheme = currentTheme() === 'dark' ? 'light' : 'dark';

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    button.title = `Switch to ${nextTheme} mode`;
  });
}

function setTheme(theme, persist = false) {
  applyTheme(theme);

  if (persist) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Keep the chosen theme for this visit even when storage is unavailable.
    }
  }

  updateThemeControls();
}

applyTheme(readStoredTheme() || (mediaQuery.matches ? 'dark' : 'light'));

document.addEventListener('DOMContentLoaded', () => {
  updateThemeControls();

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  });
});

mediaQuery.addEventListener('change', (event) => {
  if (!readStoredTheme()) {
    setTheme(event.matches ? 'dark' : 'light');
  }
});
