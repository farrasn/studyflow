/**
 * StudyFlow AI — Dynamic Roadmap Page Logic (Responsive, Safe, and Feature-Rich)
 */

(function () {
  'use strict';

  window.StudyFlow = window.StudyFlow || {};

  /* ── State variables ────────────────────────────────────────── */
  let currentTopicId = null;
  let currentRoadmapData = null;
  let modalOverlay = null;
  let rawTopic = null;
  let currentFilter = 'all'; // 'all' | 'in-progress' | 'completed'

  /* ── Helpers ─────────────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  function totalNodes(roadmap) {
    let count = 0;
    if (roadmap && Array.isArray(roadmap.categories)) {
      roadmap.categories.forEach(cat => {
        if (cat && Array.isArray(cat.nodes)) {
          count += cat.nodes.length;
        }
      });
    }
    return count;
  }

  /* ── Node State Resolution ──────────────────────────────────── */
  function getNodeState(topicId, node) {
    const progress = window.StudyFlow.progress;
    if (!progress) return 'available';
    if (progress.isCompleted(topicId, node.id)) return 'completed';

    if (!node.dependencies || !Array.isArray(node.dependencies) || node.dependencies.length === 0) return 'available';

    for (let i = 0; i < node.dependencies.length; i++) {
      if (!progress.isCompleted(topicId, node.dependencies[i])) return 'locked';
    }
    return 'available';
  }

  /* ── Sidebar and Dropdown Render ─────────────────────────────── */
  function renderHistoryElements() {
    const historyList = qs('#sidebarList');
    const mobileSelect = qs('#mobileCareerSelect');
    const mobileSelectContainer = qs('#mobileSelectContainer');
    
    // Retrieve search history
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('studyflow-history') || '[]');
    } catch (e) {
      history = [];
    }
    
    if (!Array.isArray(history)) history = [];

    // Ensure rawTopic is in history if valid
    if (rawTopic && !history.includes(rawTopic)) {
      history.unshift(rawTopic);
      if (history.length > 8) history = history.slice(0, 8);
      localStorage.setItem('studyflow-history', JSON.stringify(history));
    }

    // Render Sidebar
    if (historyList) {
      if (history.length === 0) {
        historyList.innerHTML = `<p class="text-tertiary" style="padding:0 var(--space-4); font-size:var(--text-sm)">Belum ada riwayat</p>`;
      } else {
        let sidebarHtml = '<ul class="sidebar-list">';
        history.forEach(topic => {
          const slug = slugify(topic);
          const activeClass = slug === currentTopicId ? 'active' : '';
          
          // Try to get cached roadmap to show mini progress bar
          let progressHtml = '';
          const cachedRaw = localStorage.getItem(`studyflow-cache-${slug}`);
          if (cachedRaw) {
            try {
              const cachedData = JSON.parse(cachedRaw);
              const total = totalNodes(cachedData);
              const completed = window.StudyFlow.progress ? window.StudyFlow.progress.get(slug).length : 0;
              const pct = total ? Math.round((completed / total) * 100) : 0;
              
              progressHtml = `
                <div class="sidebar-progress-mini">
                  <div class="sidebar-progress-bar">
                    <div class="sidebar-progress-fill" style="width: ${pct}%; background: var(--accent-gradient);"></div>
                  </div>
                  <span class="sidebar-progress-text">${pct}%</span>
                </div>
              `;
            } catch (e) {}
          }

          sidebarHtml += `
            <li class="sidebar-item ${activeClass}" data-topic="${escapeHtml(topic)}">
              <span class="sidebar-icon">📝</span>
              <div class="sidebar-item-info">
                <span class="sidebar-item-title">${escapeHtml(topic)}</span>
                ${progressHtml}
              </div>
            </li>
          `;
        });
        sidebarHtml += '</ul>';
        historyList.innerHTML = sidebarHtml;

        // Add event listeners to sidebar items
        qsa('.sidebar-item', historyList).forEach(el => {
          el.addEventListener('click', function () {
            const topicSelected = this.getAttribute('data-topic');
            window.location.href = `roadmap.html?topic=${encodeURIComponent(topicSelected)}`;
          });
        });
      }
    }

    // Render Mobile Dropdown
    if (mobileSelect) {
      if (history.length === 0) {
        if (mobileSelectContainer) mobileSelectContainer.style.display = 'none';
      } else {
        if (mobileSelectContainer) mobileSelectContainer.style.display = 'block';
        
        let dropdownHtml = '';
        history.forEach(topic => {
          const slug = slugify(topic);
          const selectedAttr = slug === currentTopicId ? 'selected' : '';
          dropdownHtml += `<option value="${escapeHtml(topic)}" ${selectedAttr}>${escapeHtml(topic)}</option>`;
        });
        mobileSelect.innerHTML = dropdownHtml;

        // Change handler for mobile dropdown
        mobileSelect.addEventListener('change', function () {
          window.location.href = `roadmap.html?topic=${encodeURIComponent(this.value)}`;
        });
      }
    }
  }

  /* ── Main Roadmap Render ─────────────────────────────────────── */
  function renderRoadmap(roadmap) {
    const main = qs('#roadmapContent');
    if (!main) return;

    const t = window.StudyFlow.i18n ? window.StudyFlow.i18n.t : (k) => k;

    const total = totalNodes(roadmap);
    const completedArr = window.StudyFlow.progress ? window.StudyFlow.progress.get(currentTopicId) : [];
    const completed = completedArr.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const accentColor = 'var(--accent-blue)';

    let html = '';

    // Header
    html += `
      <div class="roadmap-header">
        <div class="roadmap-header-info">
          <span class="roadmap-icon" style="background:rgba(108, 138, 255, 0.1); color:var(--accent-blue)">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </span>
          <div style="flex: 1;">
            <h1 class="roadmap-title">${escapeHtml(roadmap.title)}</h1>
            <p class="roadmap-description">${escapeHtml(roadmap.description)}</p>
          </div>
        </div>
        
        <div class="roadmap-progress">
          <div class="progress-stats">
            <span class="progress-label">${completed} / ${total}</span>
            <span class="progress-pct">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%; background:${accentColor}"></div>
          </div>
        </div>
      </div>
    `;

    // Categories & Nodes
    let nodeIndex = 0;
    if (roadmap.categories && Array.isArray(roadmap.categories)) {
      roadmap.categories.forEach(cat => {
        const nodes = Array.isArray(cat.nodes) ? cat.nodes : [];
        if (nodes.length === 0) return;

        html += `
          <div class="roadmap-category">
            <div class="category-label">
              <span class="category-dot" style="background:${accentColor}"></span>
              <span>${escapeHtml(cat.name)}</span>
            </div>
            <div class="category-nodes">
        `;

        nodes.forEach((node, i) => {
          nodeIndex++;
          const state = getNodeState(currentTopicId, node);

          let statusContent = '';
          if (state === 'completed') {
            statusContent = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>`;
          } else if (state === 'locked') {
            statusContent = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>`;
          } else {
            statusContent = `<span>${nodeIndex}</span>`;
          }

          html += `
            <div class="roadmap-node ${state}" data-node-id="${node.id}">
              <div class="node-status">${statusContent}</div>
              <div class="node-content">
                <div class="node-title">${escapeHtml(node.title)}</div>
                <div class="node-meta">${t('time_est')} ${escapeHtml(node.estimatedTime || '')}</div>
              </div>
              <div class="node-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          `;

          if (i < nodes.length - 1) {
            html += `<div class="node-connector" data-connector-for="${node.id}"><div class="connector-line"></div></div>`;
          }
        });

        html += `</div></div>`;
      });
    }

    html += `
      <div class="roadmap-actions">
        <button class="btn-clear-progress">${t('btn_clear')}</button>
      </div>
    `;

    main.innerHTML = html;
    main.style.display = 'block';

    // Apply active filter instantly
    applyNodeFilter();

    // Animate nodes in
    requestAnimationFrame(() => {
      qsa('.roadmap-node', main).forEach((el, i) => {
        if (!el.classList.contains('filtered-out')) {
          setTimeout(() => el.classList.add('visible'), i * 40);
        }
      });
    });

    // Bind click on nodes
    qsa('.roadmap-node', main).forEach(el => {
      el.addEventListener('click', function () {
        if (this.classList.contains('locked')) {
          return; // locked nodes are non-clickable
        }
        const nodeId = this.getAttribute('data-node-id');
        const node = findNode(roadmap, nodeId);
        if (node) openModal(currentTopicId, node, roadmap);
      });
    });

    // Clear progress
    const clearBtn = qs('.btn-clear-progress', main);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (window.StudyFlow.progress) {
          window.StudyFlow.progress.clear(currentTopicId);
        }
        renderRoadmap(roadmap);
        renderHistoryElements(); // update progress bar in sidebar
      });
    }

    // Print event
    const printBtn = qs('#btnPrint');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Filter events
    qsa('.filter-btn', main).forEach(btn => {
      btn.addEventListener('click', function () {
        qsa('.filter-btn', main).forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        applyNodeFilter();
      });
    });
  }

  function applyNodeFilter() {
    const nodes = document.querySelectorAll('.roadmap-node');
    nodes.forEach(node => {
      const isCompleted = node.classList.contains('completed');
      const nodeId = node.getAttribute('data-node-id');
      const connector = document.querySelector(`.node-connector[data-connector-for="${nodeId}"]`);
      
      let shouldHide = false;
      if (currentFilter === 'in-progress' && isCompleted) {
        shouldHide = true;
      } else if (currentFilter === 'completed' && !isCompleted) {
        shouldHide = true;
      }
      
      if (shouldHide) {
        node.classList.add('filtered-out');
        if (connector) connector.classList.add('filtered-out');
      } else {
        node.classList.remove('filtered-out');
        if (connector) connector.classList.remove('filtered-out');
        // trigger quick slide animation
        setTimeout(() => node.classList.add('visible'), 50);
      }
    });
  }

  function findNode(roadmap, nodeId) {
    if (!roadmap || !Array.isArray(roadmap.categories)) return null;
    for (let c = 0; c < roadmap.categories.length; c++) {
      const cat = roadmap.categories[c];
      if (cat && Array.isArray(cat.nodes)) {
        for (let n = 0; n < cat.nodes.length; n++) {
          if (cat.nodes[n].id === nodeId) return cat.nodes[n];
        }
      }
    }
    return null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ── Modal ───────────────────────────────────────────────────── */
  function openModal(topicId, node, roadmap) {
    const state = getNodeState(topicId, node);
    const isCompleted = state === 'completed';
    const isLocked = state === 'locked';
    const t = window.StudyFlow.i18n ? window.StudyFlow.i18n.t : (k) => k;

    let resourcesHtml = '';
    if (node.resources && Array.isArray(node.resources) && node.resources.length) {
      resourcesHtml = `<div class="modal-resources"><h4>Resources</h4><ul>`;
      node.resources.forEach(r => {
        if (r && r.url && r.name) {
          resourcesHtml += `<li><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.name)} <span class="external-icon">↗</span></a></li>`;
        }
      });
      resourcesHtml += `</ul></div>`;
    }

    let depsHtml = '';
    if (node.dependencies && Array.isArray(node.dependencies) && node.dependencies.length) {
      depsHtml = `<div class="modal-dependencies"><h4>Prerequisites</h4><ul>`;
      node.dependencies.forEach(depId => {
        const depNode = findNode(roadmap, depId);
        const depDone = window.StudyFlow.progress ? window.StudyFlow.progress.isCompleted(topicId, depId) : false;
        const icon = depDone ? '✓' : '—';
        const name = depNode ? depNode.title : depId;
        depsHtml += `<li>${icon} ${escapeHtml(name)}</li>`;
      });
      depsHtml += `</ul></div>`;
    }

    const btnClass = isCompleted ? 'btn-completed' : (isLocked ? 'btn-locked' : 'btn-complete');
    let btnText = isCompleted ? t('btn_completed') : t('btn_complete');
    if (isLocked) btnText = 'Prerequisites Required';

    const html = `
      <div class="modal-overlay" role="dialog" aria-modal="true">
        <div class="modal-container">
          <button class="modal-close" aria-label="Close modal">&times;</button>
          <div class="modal-header">
            <h2 class="modal-title">${escapeHtml(node.title)}</h2>
            <span class="modal-time">${t('time_est')} ${escapeHtml(node.estimatedTime || '')}</span>
          </div>
          <div class="modal-body">
            <p class="modal-description">${escapeHtml(node.description)}</p>
            ${resourcesHtml}
            ${node.project ? `<div class="modal-project"><h4>${t('project_title')}</h4><p>${escapeHtml(node.project)}</p></div>` : ''}
            ${depsHtml}
          </div>
          <div class="modal-footer">
            <button class="modal-btn ${btnClass}" ${isLocked ? 'disabled' : ''}>${btnText}</button>
          </div>
        </div>
      </div>
    `;

    closeModal();
    document.body.insertAdjacentHTML('beforeend', html);
    modalOverlay = qs('.modal-overlay');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      if (modalOverlay) modalOverlay.classList.add('active');
    });

    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
    qs('.modal-close', modalOverlay).addEventListener('click', closeModal);

    const actionBtn = qs('.modal-btn', modalOverlay);
    if (actionBtn && !isLocked) {
      actionBtn.addEventListener('click', () => {
        if (window.StudyFlow.progress) {
          window.StudyFlow.progress.toggleComplete(topicId, node.id);
        }
        closeModal();
        renderRoadmap(currentRoadmapData);
        renderHistoryElements(); // update progress bar in sidebar
      });
    }
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    modalOverlay.classList.add('closing');

    const overlay = modalOverlay;
    setTimeout(() => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
    modalOverlay = null;
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  /* ── Data Fetching ───────────────────────────────────────────── */
  async function loadRoadmap() {
    rawTopic = getParam('topic');
    if (!rawTopic) {
      window.location.href = 'index.html';
      return;
    }

    currentTopicId = slugify(rawTopic);
    qs('#loadingTopic').textContent = `Processing topic: "${rawTopic}"...`;
    
    // Check cache first
    const cached = localStorage.getItem(`studyflow-cache-${currentTopicId}`);
    if (cached) {
      try {
        currentRoadmapData = JSON.parse(cached);
        qs('#loadingState').style.display = 'none';
        
        // Render history elements first (sidebar & mobile select)
        renderHistoryElements();
        
        renderRoadmap(currentRoadmapData);
        return;
      } catch(e) {
        localStorage.removeItem(`studyflow-cache-${currentTopicId}`);
      }
    }

    // Show loading spinner
    qs('#loadingState').style.display = 'flex';
    qs('#errorState').style.display = 'none';
    qs('#roadmapContent').style.display = 'none';

    // Generate via Gemini API (backend proxy)
    try {
      const lang = window.StudyFlow.i18n ? window.StudyFlow.i18n.getLang() : 'id';
      const data = await window.StudyFlow.api.generateRoadmap(rawTopic, lang);
      currentRoadmapData = data;
      
      // Cache the result
      localStorage.setItem(`studyflow-cache-${currentTopicId}`, JSON.stringify(data));
      
      qs('#loadingState').style.display = 'none';
      
      // Update history and sidebar
      renderHistoryElements();
      
      renderRoadmap(currentRoadmapData);
    } catch (error) {
      console.error('[StudyFlow] Error loading roadmap:', error);
      qs('#loadingState').style.display = 'none';
      qs('#errorState').style.display = 'flex';
      
      const errorMsgEl = qs('#errorMessage');
      const errorDetailEl = qs('#errorDetail');
      
      if (errorMsgEl) {
        errorMsgEl.textContent = window.StudyFlow.i18n ? window.StudyFlow.i18n.t('error_generate') : 'Gagal membuat roadmap.';
      }
      if (errorDetailEl) {
        errorDetailEl.textContent = error.message || 'Koneksi API error. Harap coba lagi beberapa saat lagi.';
      }
    }
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    if (!qs('#roadmapMain')) return;
    
    // Bind retry button
    const retryBtn = qs('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        loadRoadmap();
      });
    }

    loadRoadmap();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
