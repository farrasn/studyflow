/**
 * StudyFlow AI — Progress Tracking Module
 * Persists completed roadmap node IDs in localStorage per career path.
 * Key format: 'studyflow-progress-{careerId}'
 */

(function () {
  'use strict';

  window.StudyFlow = window.StudyFlow || {};

  var KEY_PREFIX = 'studyflow-progress-';

  /**
   * Build the localStorage key for a given career.
   * @param {string} careerId
   * @returns {string}
   */
  function storageKey(careerId) {
    return KEY_PREFIX + careerId;
  }

  /**
   * Get the array of completed node IDs for a career path.
   * @param {string} careerId
   * @returns {string[]} Array of completed node ID strings.
   */
  function getProgress(careerId) {
    try {
      var raw = localStorage.getItem(storageKey(careerId));
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[StudyFlow] Failed to parse progress for', careerId, e);
      return [];
    }
  }

  /**
   * Toggle a node's completed state.
   * If already completed it is removed; otherwise it is added.
   * @param {string} careerId
   * @param {string} nodeId
   * @returns {boolean} `true` if the node is now completed, `false` if removed.
   */
  function toggleComplete(careerId, nodeId) {
    var progress = getProgress(careerId);
    var index = progress.indexOf(nodeId);
    var nowComplete;

    if (index === -1) {
      progress.push(nodeId);
      nowComplete = true;
    } else {
      progress.splice(index, 1);
      nowComplete = false;
    }

    localStorage.setItem(storageKey(careerId), JSON.stringify(progress));

    // Dispatch a custom event so other parts of the UI can react
    window.dispatchEvent(
      new CustomEvent('studyflow:progress', {
        detail: { careerId: careerId, nodeId: nodeId, completed: nowComplete, progress: progress }
      })
    );

    return nowComplete;
  }

  /**
   * Check whether a specific node has been completed.
   * @param {string} careerId
   * @param {string} nodeId
   * @returns {boolean}
   */
  function isCompleted(careerId, nodeId) {
    return getProgress(careerId).indexOf(nodeId) !== -1;
  }

  /**
   * Calculate the completion percentage for a career path.
   * @param {string} careerId
   * @param {number} totalNodes - total number of nodes in the roadmap
   * @returns {number} Percentage (0–100), rounded to one decimal.
   */
  function getCompletionPercentage(careerId, totalNodes) {
    if (!totalNodes || totalNodes <= 0) return 0;
    var completed = getProgress(careerId).length;
    return Math.round((completed / totalNodes) * 1000) / 10; // one decimal
  }

  /**
   * Clear all progress for a career path.
   * @param {string} careerId
   */
  function clearProgress(careerId) {
    localStorage.removeItem(storageKey(careerId));

    window.dispatchEvent(
      new CustomEvent('studyflow:progress', {
        detail: { careerId: careerId, nodeId: null, completed: false, progress: [] }
      })
    );
  }

  /**
   * Get a summary of progress across all stored career paths.
   * @returns {Object} Map of careerId → completed count.
   */
  function getAllProgress() {
    var result = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(KEY_PREFIX) === 0) {
        var id = key.slice(KEY_PREFIX.length);
        result[id] = getProgress(id).length;
      }
    }
    return result;
  }

  /* ── Public API ──────────────────────────────────────────────── */
  window.StudyFlow.progress = {
    get: getProgress,
    toggleComplete: toggleComplete,
    isCompleted: isCompleted,
    getCompletionPercentage: getCompletionPercentage,
    clear: clearProgress,
    getAll: getAllProgress
  };
})();
