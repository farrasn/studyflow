(function () {
  'use strict';

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function initGeneratorForm() {
    const form = qs('#generatorForm');
    const input = qs('#topicInput');
    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const topic = input.value.trim();
      if (!topic) return;
      saveToHistory(topic);
      window.location.href = 'roadmap.html?topic=' + encodeURIComponent(topic);
    });

    qsa('.topic-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.textContent;
        input.focus();
        form.dispatchEvent(new Event('submit'));
      });
    });
  }

  function saveToHistory(topic) {
    try {
      let history = JSON.parse(localStorage.getItem('studyflow-history') || '[]');
      history = history.filter(t => t.toLowerCase() !== topic.toLowerCase());
      history.unshift(topic);
      if (history.length > 5) history = history.slice(0, 5);
      localStorage.setItem('studyflow-history', JSON.stringify(history));
    } catch (e) {}
  }

  function renderHistory() {
    const section = qs('#historySection');
    const list = qs('#historyList');
    if (!section || !list) return;

    try {
      const history = JSON.parse(localStorage.getItem('studyflow-history') || '[]');
      if (!history.length) return;

      section.style.display = 'block';
      list.innerHTML = history.map(t =>
        '<a href="roadmap.html?topic=' + encodeURIComponent(t) + '" class="history-chip">' + t + '</a>'
      ).join('');
    } catch (e) {}
  }

  function initFadeAnimations() {
    setTimeout(() => {
      qsa('.fade-in').forEach(el => el.classList.add('visible'));
    }, 50);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initGeneratorForm();
    renderHistory();
    initFadeAnimations();
  });
})();
