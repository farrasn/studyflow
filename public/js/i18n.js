(function () {
  'use strict';
  window.StudyFlow = window.StudyFlow || {};

  const translations = {
    id: {
      hero_title: 'Mau belajar apa hari ini?',
      hero_subtitle: 'Masukkan topik yang ingin kamu pelajari, dan kami akan membuatkan alur belajar terstruktur khusus untukmu.',
      search_placeholder: 'Contoh: Belajar Next.js, Fisika SMP, UI/UX Design...',
      btn_generate: 'Buat Roadmap',
      btn_new: 'Buat Baru',
      btn_retry: 'Coba Lagi',
      btn_back: 'Kembali',
      popular_topics: 'Populer:',
      recent_topics: 'Terakhir dicari:',
      footer_copy: '\u00A9 2026 StudyFlow. Dibuat untuk pembelajar.',
      generating: 'Membuat roadmap...',
      generating_wait: 'Proses ini membutuhkan 15-30 detik',
      error_generate: 'Gagal membuat roadmap.',
      btn_complete: 'Tandai Selesai',
      btn_completed: 'Selesai (klik untuk batal)',
      btn_clear: 'Hapus Progres',
      time_est: 'Estimasi:',
      project_title: 'Rekomendasi Proyek'
    },
    en: {
      hero_title: 'What do you want to learn today?',
      hero_subtitle: 'Enter a topic you want to learn, and we will generate a structured learning path just for you.',
      search_placeholder: 'Example: Learn Next.js, Python Basics, UI/UX Design...',
      btn_generate: 'Generate Roadmap',
      btn_new: 'Create New',
      btn_retry: 'Try Again',
      btn_back: 'Go Back',
      popular_topics: 'Popular:',
      recent_topics: 'Recent:',
      footer_copy: '\u00A9 2026 StudyFlow. Built for learners.',
      generating: 'Generating roadmap...',
      generating_wait: 'This takes about 15-30 seconds',
      error_generate: 'Failed to generate roadmap.',
      btn_complete: 'Mark as Complete',
      btn_completed: 'Completed (click to undo)',
      btn_clear: 'Clear Progress',
      time_est: 'Est. Time:',
      project_title: 'Project Recommendation'
    }
  };

  let currentLang = localStorage.getItem('studyflow-lang') || 'id';

  function updateTexts() {
    const dict = translations[currentLang] || translations.id;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.placeholder = dict[key];
    });
  }

  function t(key) {
    const dict = translations[currentLang] || translations.id;
    return dict[key] || key;
  }

  function initI18n() {
    updateTexts();
    const toggleBtn = document.getElementById('langToggle');
    if (toggleBtn) {
      const textSpan = toggleBtn.querySelector('.lang-text');
      if (textSpan) textSpan.textContent = currentLang.toUpperCase();
      toggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'id' ? 'en' : 'id';
        localStorage.setItem('studyflow-lang', currentLang);
        updateTexts();
        if (textSpan) textSpan.textContent = currentLang.toUpperCase();
      });
    }
  }

  window.StudyFlow.i18n = {
    init: initI18n,
    t: t,
    getLang: () => currentLang
  };

  document.addEventListener('DOMContentLoaded', initI18n);
})();
