/**
 * StudyFlow AI — Theme Toggle System
 * Handles dark/light mode switching with localStorage persistence,
 * prefers-color-scheme media query fallback, and smooth transitions.
 */

(function () {
  'use strict';

  window.StudyFlow = window.StudyFlow || {};

  const STORAGE_KEY = 'studyflow-theme';
  const TRANSITION_DURATION = 400; // ms

  /**
   * Determine the initial theme.
   * Priority: localStorage → prefers-color-scheme → 'dark' default.
   */
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  /**
   * Apply a theme to the document and persist to localStorage.
   * @param {string} theme - 'dark' or 'light'
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateThemeIcon(theme);
  }

  /**
   * Toggle between dark and light mode with a smooth body transition.
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    // Add transition class for smooth color change
    document.body.classList.add('theme-transitioning');
    applyTheme(next);

    // Remove transition class after animation completes
    setTimeout(function () {
      document.body.classList.remove('theme-transitioning');
    }, TRANSITION_DURATION);
  }

  /**
   * Update every theme-toggle button icon in the page.
   * Dark mode shows ☀️ (click to go light), light mode shows 🌙 (click to go dark).
   * @param {string} [theme] - current theme; auto-detected if omitted
   */
  function updateThemeIcon(theme) {
    if (!theme) {
      theme = document.documentElement.getAttribute('data-theme') || 'dark';
    }

    const buttons = document.querySelectorAll('.theme-toggle');
    buttons.forEach(function (btn) {
      // Try to find a dedicated icon element inside the button
      const iconEl = btn.querySelector('.theme-icon') || btn;

      if (theme === 'dark') {
        iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.setAttribute('title', 'Switch to light mode');
      } else {
        iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.setAttribute('title', 'Switch to dark mode');
      }
    });
  }

  /**
   * Bind click handlers to every .theme-toggle button.
   */
  function bindToggleButtons() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleTheme();
      });
    });
  }

  /**
   * Listen for system-level color-scheme changes and follow suit
   * (only when the user hasn't explicitly picked a theme recently).
   */
  function watchSystemPreference() {
    if (!window.matchMedia) return;
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', function (e) {
      // Only auto-switch if there is no stored preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /* ── Initialise on DOMContentLoaded ──────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var theme = getInitialTheme();
    applyTheme(theme);
    bindToggleButtons();
    watchSystemPreference();
  });

  /* ── Public API ──────────────────────────────────────────────── */
  window.StudyFlow.theme = {
    toggle: toggleTheme,
    updateIcon: updateThemeIcon,
    get current() {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
  };
})();
