(function () {
  'use strict';
  window.StudyFlow = window.StudyFlow || {};

  async function generateRoadmap(topic, lang) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ topic, lang })
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal menghubungi server (status ' + res.status + ')');
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Koneksi timeout. Pastikan server berjalan dan coba lagi.');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan di http://localhost:3000');
      }
      throw err;
    }
  }

  window.StudyFlow.api = { generateRoadmap };
})();
