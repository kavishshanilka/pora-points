/**
 * ============================================================
 * PORA POINTS - UNIVERSITY ROAST & BACKFIRE LEADERBOARD
 * ============================================================
 * Features:
 *  - Real-Time Multi-Device Cloud Sync via KVDB
 *  - Award Marks (+): When someone lands a savage roast
 *  - Deduct Marks (-): When someone fails a roast and gets clowned
 *  - Note attachment for every mark addition/deduction
 *  - Web Audio API Sound Synthesizer
 *  - Story Card Canvas Generator & WhatsApp Exporter
 */

const CLOUD_CONFIG = {
  bucket: '714suwXXbE25iMFDcCRCa1',
  defaultRoom: 'main'
};

// Default Seed Data (used only if cloud and local are both completely empty)
const DEFAULT_FRIENDS = [
  {
    id: 'f_1',
    name: 'Kasun',
    nickname: 'FOT',
    avatar: '😎',
    points: 4,
    latestNote: { text: 'Delivered a brutal canteen roast', type: 'hit', pts: 1, time: Date.now() - 7200000 },
    createdAt: 1700000000000
  },
  {
    id: 'f_2',
    name: 'Nimal',
    nickname: 'Eng',
    avatar: '🗿',
    points: 7,
    latestNote: { text: 'Epic comeback during tea break', type: 'hit', pts: 2, time: Date.now() - 3600000 },
    createdAt: 1700000010000
  },
  {
    id: 'f_3',
    name: 'Chathura',
    nickname: 'CS',
    avatar: '🤡',
    points: -2,
    latestNote: { text: 'Tried to roast Kasun but choked mid-sentence & got clowned', type: 'backfire', pts: 1, time: Date.now() - 1800000 },
    createdAt: 1700000020000
  }
];

const DEFAULT_LOGS = [
  {
    id: 'log_1',
    friendId: 'f_3',
    friendName: 'Chathura',
    avatar: '🤡',
    actionType: 'backfire',
    pts: 1,
    note: 'Tried to roast Kasun but choked mid-sentence & everyone roasted him instead',
    timestamp: Date.now() - 1800000
  },
  {
    id: 'log_2',
    friendId: 'f_2',
    friendName: 'Nimal',
    avatar: '🗿',
    actionType: 'hit',
    pts: 2,
    note: 'Epic comeback during canteen tea break',
    timestamp: Date.now() - 3600000
  }
];

// Quick Pick Note Presets
const NOTE_PRESETS = {
  hit: [
    'Clean canteen comeback 🔥',
    'Exposed squad secret in lecture hall 💀',
    'Roasted about exam results and hit hard 🎯',
    'Nobody had an answer to that punchline 🤐',
    'Instant kill during lunch break 🍔',
    'Savage observation about his outfit 👟'
  ],
  backfire: [
    'Tried to roast someone but choked & got cooked 💀',
    'Dead silence followed his joke, everyone stared 🦗',
    'Tried to roast GPA but forgot his own was lower 📉',
    'Stuttered mid-roast and became the main victim 🤡',
    'Uno reversed by the entire squad 🔄',
    'Crush heard his failed joke and cringed 🙈'
  ]
};

// --- App State with Real-Time Cloud Sync ---
class PoraState {
  constructor(onCloudStatusChange, onRemoteUpdate) {
    this.storageKey = 'pora_points_v2_data';
    this.soundEnabled = localStorage.getItem('pora_sound') !== 'false';
    this.sortMode = 'highest_marks';
    this.searchQuery = '';
    this.onCloudStatusChange = onCloudStatusChange;
    this.onRemoteUpdate = onRemoteUpdate;

    // Detect room from URL query param ?room=... or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    this.roomCode = (urlParams.get('room') || localStorage.getItem('pora_room_code') || CLOUD_CONFIG.defaultRoom).trim().toLowerCase();
    localStorage.setItem('pora_room_code', this.roomCode);

    this.updatedAt = 0;
    this.isSyncing = false;
    this.isInitialLoading = true;
    this.hasLocalCache = false;
    this.pollInterval = null;

    this.loadLocalState();
    this.initCloudSync();
  }

  getCloudUrl() {
    return `https://kvdb.io/${CLOUD_CONFIG.bucket}/room_${this.roomCode}`;
  }

  loadLocalState() {
    const raw = localStorage.getItem(`${this.storageKey}_${this.roomCode}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.friends)) {
          this.friends = parsed.friends;
          this.logs = Array.isArray(parsed.logs) ? parsed.logs : [];
          this.updatedAt = parsed.updatedAt || 0;
          this.hasLocalCache = true;
          this.isInitialLoading = false;
          return;
        }
      } catch (e) {}
    }

    // New device / incognito: No local cache exists yet!
    // Initialize with 0 timestamp so cloud data is ALWAYS adopted immediately.
    this.friends = [];
    this.logs = [];
    this.updatedAt = 0;
    this.hasLocalCache = false;
    this.isInitialLoading = true;
  }

  saveLocalState() {
    const payload = {
      friends: this.friends,
      logs: this.logs,
      updatedAt: this.updatedAt
    };
    localStorage.setItem(`${this.storageKey}_${this.roomCode}`, JSON.stringify(payload));
  }

  // --- Real-Time Cloud Sync Operations ---
  async initCloudSync() {
    // Initial fetch from cloud
    await this.fetchFromCloud();

    // Start background polling every 2.5s for live multi-device updates
    this.startPolling();

    // Re-check cloud immediately when user switches back to this browser tab or focuses window
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchFromCloud();
      }
    });

    window.addEventListener('focus', () => {
      this.fetchFromCloud();
    });

    // Re-check when internet comes back online
    window.addEventListener('online', () => {
      this.fetchFromCloud();
    });
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing) {
        this.fetchFromCloud(true); // silent background poll
      }
    }, 2500);
  }

  async fetchFromCloud(silent = false) {
    if (this.isSyncing) return;
    if (!silent && this.onCloudStatusChange) this.onCloudStatusChange('syncing');

    try {
      const response = await fetch(this.getCloudUrl(), {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        const cloudData = await response.json();
        if (cloudData && Array.isArray(cloudData.friends)) {
          const cloudUpdatedAt = cloudData.updatedAt || 0;
          const friendsDiffer = JSON.stringify(cloudData.friends) !== JSON.stringify(this.friends);

          // Adopt cloud data if:
          // 1. This device has no local cache yet (new device / private window), OR
          // 2. Cloud data has a newer updatedAt, OR
          // 3. The cloud friend list differs from current list
          if (!this.hasLocalCache || cloudUpdatedAt > this.updatedAt || friendsDiffer) {
            this.friends = cloudData.friends;
            this.logs = Array.isArray(cloudData.logs) ? cloudData.logs : [];
            this.updatedAt = cloudUpdatedAt || Date.now();
            this.hasLocalCache = true;
            this.isInitialLoading = false;
            this.saveLocalState();

            if (this.onRemoteUpdate) this.onRemoteUpdate();
          }
        }
        this.isInitialLoading = false;
        if (this.onCloudStatusChange) this.onCloudStatusChange('online');
      } else if (response.status === 404) {
        // Cloud room does not exist yet worldwide: initialize defaults and push to cloud!
        if (!this.friends.length) {
          this.friends = [...DEFAULT_FRIENDS];
          this.logs = [...DEFAULT_LOGS];
          this.updatedAt = Date.now();
          this.hasLocalCache = true;
          this.isInitialLoading = false;
          this.saveLocalState();
          if (this.onRemoteUpdate) this.onRemoteUpdate();
          await this.pushToCloud();
        }
      } else {
        this.isInitialLoading = false;
        if (this.onCloudStatusChange) this.onCloudStatusChange('error');
      }
    } catch (err) {
      this.isInitialLoading = false;
      if (this.onCloudStatusChange) this.onCloudStatusChange('offline');
    }
  }

  async pushToCloud() {
    this.isSyncing = true;
    if (this.onCloudStatusChange) this.onCloudStatusChange('syncing');

    this.updatedAt = Date.now();
    this.hasLocalCache = true;
    this.saveLocalState();

    const payload = {
      friends: this.friends,
      logs: this.logs,
      updatedAt: this.updatedAt,
      roomCode: this.roomCode
    };

    try {
      const response = await fetch(this.getCloudUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (this.onCloudStatusChange) this.onCloudStatusChange('online');
      } else {
        if (this.onCloudStatusChange) this.onCloudStatusChange('error');
      }
    } catch (err) {
      if (this.onCloudStatusChange) this.onCloudStatusChange('offline');
    } finally {
      this.isSyncing = false;
    }
  }

  setRoomCode(newRoom) {
    const sanitized = (newRoom || CLOUD_CONFIG.defaultRoom).trim().toLowerCase();
    if (sanitized === this.roomCode) return;
    this.roomCode = sanitized;
    localStorage.setItem('pora_room_code', this.roomCode);
    this.loadLocalState();
    this.fetchFromCloud();
  }

  // --- Friend and Mark Mutations (Auto-Sync to Cloud) ---
  addFriend(name, nickname, avatar, startingPoints = 0) {
    const newFriend = {
      id: 'f_' + Date.now(),
      name: name.trim(),
      nickname: nickname ? nickname.trim() : '',
      avatar: avatar || '😎',
      points: parseInt(startingPoints, 10) || 0,
      latestNote: null,
      createdAt: Date.now()
    };
    this.friends.push(newFriend);
    this.pushToCloud();
    return newFriend;
  }

  updateFriend(id, name, nickname, avatar) {
    const friend = this.friends.find(f => f.id === id);
    if (friend) {
      friend.name = name.trim();
      friend.nickname = nickname ? nickname.trim() : '';
      friend.avatar = avatar;
      this.pushToCloud();
    }
  }

  deleteFriend(id) {
    this.friends = this.friends.filter(f => f.id !== id);
    this.logs = this.logs.filter(l => l.friendId !== id);
    this.pushToCloud();
  }

  recordAction(friendId, actionType, pts = 1, note = '') {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return null;

    const pointsNum = parseInt(pts, 10) || 1;

    if (actionType === 'hit') {
      friend.points += pointsNum;
    } else {
      friend.points -= pointsNum;
    }

    const defaultNote = actionType === 'hit' 
      ? 'Delivered a savage roast 🔥' 
      : 'Failed roast & got clowned by the squad 💀';

    const finalNote = note.trim() || defaultNote;

    friend.latestNote = {
      text: finalNote,
      type: actionType,
      pts: pointsNum,
      time: Date.now()
    };

    const logEntry = {
      id: 'log_' + Date.now(),
      friendId: friend.id,
      friendName: friend.name,
      avatar: friend.avatar,
      actionType: actionType,
      pts: pointsNum,
      note: finalNote,
      timestamp: Date.now()
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 100) this.logs.pop();

    this.pushToCloud();
    return { friend, log: logEntry };
  }

  resetAllMarks(defaultValue = 0) {
    this.friends.forEach(f => {
      f.points = defaultValue;
      f.latestNote = null;
    });
    this.pushToCloud();
  }

  clearLogs() {
    this.logs = [];
    this.pushToCloud();
  }

  getFilteredFriends() {
    let list = [...this.friends];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.nickname.toLowerCase().includes(q)
      );
    }

    if (this.sortMode === 'highest_marks') {
      list.sort((a, b) => b.points - a.points);
    } else if (this.sortMode === 'most_backfires') {
      list.sort((a, b) => a.points - b.points);
    } else if (this.sortMode === 'recent') {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }
}

// --- Sound Synthesizer (Web Audio API) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHitSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      [523.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + (idx * 0.05));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  }

  playBackfireSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(120, t + 0.35);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(80, t + 0.15);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.45);
      subGain.gain.setValueAtTime(0.35, t + 0.15);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(t + 0.15);
      sub.stop(t + 0.45);
    } catch (e) {}
  }

  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }
}

// --- Main Application Controller ---
class PoraApp {
  constructor() {
    this.sound = new SoundEngine();

    this.cloudStatusBadgeEl = document.getElementById('cloudStatusBadge');
    this.cloudStatusTextEl = document.getElementById('cloudStatusText');
    this.modalCloudStateEl = document.getElementById('modalCloudState');

    // Initialize state with real-time cloud listeners
    this.state = new PoraState(
      (status) => this.updateCloudStatusUI(status),
      () => this.render()
    );

    // DOM Elements
    this.friendsListEl = document.getElementById('friendsList');
    this.emptyStateEl = document.getElementById('emptyState');
    this.podiumSectionEl = document.getElementById('podiumSection');
    this.roastCountBadgeEl = document.getElementById('roastCountBadge');
    this.searchInputEl = document.getElementById('searchInput');

    // Modals
    this.friendModalEl = document.getElementById('friendModal');
    this.markActionModalEl = document.getElementById('markActionModal');
    this.roastFeedModalEl = document.getElementById('roastFeedModal');
    this.whatsappModalEl = document.getElementById('whatsappModal');
    this.imageCardModalEl = document.getElementById('imageCardModal');
    this.syncModalEl = document.getElementById('syncModal');

    // Forms
    this.friendFormEl = document.getElementById('friendForm');
    this.markActionFormEl = document.getElementById('markActionForm');

    this.initEventListeners();
    this.render();
  }

  updateCloudStatusUI(status) {
    if (!this.cloudStatusBadgeEl || !this.cloudStatusTextEl) return;

    this.cloudStatusBadgeEl.className = 'cloud-status-badge';

    if (status === 'online') {
      this.cloudStatusTextEl.textContent = 'Live Synced';
      if (this.modalCloudStateEl) {
        this.modalCloudStateEl.textContent = 'ACTIVE (SYNCED)';
        this.modalCloudStateEl.className = 'text-green';
      }
    } else if (status === 'syncing') {
      this.cloudStatusBadgeEl.classList.add('syncing');
      this.cloudStatusTextEl.textContent = 'Syncing...';
      if (this.modalCloudStateEl) {
        this.modalCloudStateEl.textContent = 'SYNCING...';
        this.modalCloudStateEl.className = 'text-burn';
      }
    } else if (status === 'offline') {
      this.cloudStatusBadgeEl.classList.add('error');
      this.cloudStatusTextEl.textContent = 'Offline';
      if (this.modalCloudStateEl) {
        this.modalCloudStateEl.textContent = 'OFFLINE (CACHED)';
        this.modalCloudStateEl.className = 'text-burn';
      }
    }
  }

  initEventListeners() {
    // Sound Toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    soundToggleBtn.addEventListener('click', () => {
      this.state.soundEnabled = !this.state.soundEnabled;
      localStorage.setItem('pora_sound', this.state.soundEnabled);
      soundIcon.textContent = this.state.soundEnabled ? '🔊' : '🔇';
      if (this.state.soundEnabled) this.sound.playClick();
    });

    // Add Friend
    document.getElementById('addFriendBtn').addEventListener('click', () => {
      this.openAddFriendModal();
    });
    document.getElementById('emptyAddBtn').addEventListener('click', () => {
      this.openAddFriendModal();
    });

    // Friend Form Submit
    this.friendFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editFriendId').value;
      const name = document.getElementById('friendNameInput').value;
      const nickname = document.getElementById('friendNicknameInput').value;
      const avatar = document.getElementById('selectedAvatar').value;
      const points = document.getElementById('startingPointsInput').value;

      if (id) {
        this.state.updateFriend(id, name, nickname, avatar);
        this.showToast('✅ Friend updated & synced to cloud!', 'hit');
      } else {
        this.state.addFriend(name, nickname, avatar, points);
        this.showToast('🎉 Friend added & synced to all devices!', 'hit');
      }

      this.closeModal('friendModal');
      this.render();
    });

    // Avatar Picker in Modal
    const avatarPicker = document.getElementById('avatarPicker');
    avatarPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.avatar-option');
      if (btn) {
        avatarPicker.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('selectedAvatar').value = btn.dataset.avatar;
      }
    });

    // Search Input
    this.searchInputEl.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value;
      this.render();
    });

    // Filter Chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.state.sortMode = chip.dataset.sort;
        this.sound.playClick();
        this.render();
      });
    });

    // Close Modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal(btn.dataset.close);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });

    // Open Feed Modal
    document.getElementById('openRoastLogBtn').addEventListener('click', () => {
      this.openRoastFeedModal();
    });

    // Clear Logs
    document.getElementById('clearRoastLogsBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the feed logs across all devices?')) {
        this.state.clearLogs();
        this.renderRoastFeed();
        this.render();
        this.showToast('Feed logs cleared.', 'hit');
      }
    });

    // WhatsApp Modal
    document.getElementById('shareWhatsappBtn').addEventListener('click', () => {
      this.openWhatsappModal();
    });

    document.getElementById('copyWhatsappBtn').addEventListener('click', () => {
      const text = document.getElementById('whatsappTextPreview').value;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('📋 WhatsApp summary copied!', 'hit');
      });
    });

    document.getElementById('openDirectWhatsappBtn').addEventListener('click', () => {
      const text = encodeURIComponent(document.getElementById('whatsappTextPreview').value);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    });

    // Story Card Poster Modal
    document.getElementById('exportImageBtn').addEventListener('click', () => {
      this.openImageCardModal();
    });

    document.getElementById('downloadCardBtn').addEventListener('click', () => {
      this.downloadScorecardPNG();
    });

    // Sync Modal
    document.getElementById('syncModalBtn').addEventListener('click', () => {
      this.openSyncModal();
    });

    // Save Custom Room Code
    document.getElementById('saveRoomCodeBtn').addEventListener('click', () => {
      const input = document.getElementById('roomCodeInput');
      const newRoom = input.value.trim();
      if (newRoom) {
        this.state.setRoomCode(newRoom);
        this.updateShareUrlInput();
        this.showToast(`Switched to room: "${this.state.roomCode}"`, 'hit');
        this.render();
      }
    });

    // Manual Cloud Fetch & Push
    document.getElementById('manualPullCloudBtn').addEventListener('click', async () => {
      await this.state.fetchFromCloud();
      this.render();
      this.showToast('Fetched latest updates from cloud!', 'hit');
    });

    document.getElementById('manualPushCloudBtn').addEventListener('click', async () => {
      await this.state.pushToCloud();
      this.showToast('Pushed local data to cloud!', 'hit');
    });

    // Copy Share Link
    document.getElementById('copyShareUrlBtn').addEventListener('click', () => {
      const input = document.getElementById('shareUrlInput');
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        this.showToast('🔗 Live Share link copied!', 'hit');
      });
    });

    // Export JSON Backup
    document.getElementById('exportJsonBtn').addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
        friends: this.state.friends,
        logs: this.state.logs,
        version: '2.0',
        roomCode: this.state.roomCode,
        exportedAt: new Date().toISOString()
      }, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `pora_points_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      this.showToast('💾 Backup file downloaded!', 'hit');
    });

    // Import JSON Backup
    document.getElementById('importJsonInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported && Array.isArray(imported.friends)) {
            this.state.friends = imported.friends;
            this.state.logs = imported.logs || [];
            this.state.pushToCloud();
            this.render();
            this.closeModal('syncModal');
            this.showToast('🎉 Backup restored & pushed to cloud!', 'hit');
          } else {
            alert('Invalid backup file format!');
          }
        } catch (err) {
          alert('Failed to read JSON backup file.');
        }
      };
      reader.readAsText(file);
    });

    // Reset Points to 0 across all devices
    document.getElementById('resetPointsBtn').addEventListener('click', () => {
      if (confirm('Reset all squad members to 0 marks across all devices?')) {
        this.state.resetAllMarks(0);
        this.render();
        this.closeModal('syncModal');
        this.showToast('🔄 Marks reset to 0 & synced across all devices!', 'hit');
      }
    });

    // Mark Action Form Submit (Applying + / - with Note)
    this.markActionFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetId = document.getElementById('actionTargetId').value;
      const actionType = document.getElementById('actionType').value;
      const customNote = document.getElementById('actionNoteInput').value;

      const activeRadio = document.querySelector('input[name="actionPts"]:checked');
      const pts = parseInt(activeRadio ? activeRadio.value : '1', 10);

      const res = this.state.recordAction(targetId, actionType, pts, customNote);
      if (res) {
        if (this.state.soundEnabled) {
          if (actionType === 'hit') {
            this.sound.playHitSound();
          } else {
            this.sound.playBackfireSound();
          }
        }

        this.animateMarks(targetId);

        if (actionType === 'hit') {
          this.showToast(`🔥 ${res.friend.name} landed a roast! +${pts} Mark (${res.friend.points} total)`, 'hit');
        } else {
          this.showToast(`💀 Roast backfired on ${res.friend.name}! -${pts} Mark (${res.friend.points} left)`, 'backfire');
        }
      }

      this.closeModal('markActionModal');
      this.render();
    });
  }

  // --- Rendering UI ---
  render() {
    const friends = this.state.getFilteredFriends();
    this.roastCountBadgeEl.textContent = this.state.logs.length;

    this.renderPodium();

    if (friends.length === 0) {
      this.friendsListEl.innerHTML = '';
      this.emptyStateEl.classList.remove('hidden');

      const titleEl = document.getElementById('emptyStateTitle');
      const subEl = document.getElementById('emptyStateSubtitle');
      const addBtn = document.getElementById('emptyAddBtn');

      if (this.state.isInitialLoading) {
        if (titleEl) titleEl.textContent = '☁️ Connecting to Cloud...';
        if (subEl) subEl.textContent = 'Fetching the latest squad scoreboard from cloud...';
        if (addBtn) addBtn.classList.add('hidden');
      } else {
        if (titleEl) titleEl.textContent = 'No Friends on the Roster Yet!';
        if (subEl) subEl.textContent = 'Add your canteen, batch, or hostel squad to start scoring savage roasts and tracking backfires.';
        if (addBtn) addBtn.classList.remove('hidden');
      }
    } else {
      this.emptyStateEl.classList.add('hidden');
      this.friendsListEl.innerHTML = friends.map((f, idx) => this.createFriendCardHTML(f, idx)).join('');
      this.attachCardEventListeners();
    }
  }

  createFriendCardHTML(friend, index) {
    const isTopRoaster = this.getHighestPointsFriend()?.id === friend.id && this.state.friends.length > 1;
    const isChiefVictim = this.getLowestPointsFriend()?.id === friend.id && this.state.friends.length > 1 && friend.points < 0;

    let cardExtraClass = '';
    if (isTopRoaster) cardExtraClass = 'card-top-roaster';
    if (isChiefVictim) cardExtraClass = 'card-backfire-victim';

    let marksColorClass = 'zero';
    if (friend.points > 0) marksColorClass = 'pos';
    if (friend.points < 0) marksColorClass = 'neg';

    let latestNoteHTML = '<span class="friend-latest-note text-dim">No roasts recorded yet</span>';
    if (friend.latestNote) {
      const isPos = friend.latestNote.type === 'hit';
      latestNoteHTML = `
        <span class="friend-latest-note" title="${this.escapeHTML(friend.latestNote.text)}">
          <span class="${isPos ? 'note-tag-pos' : 'note-tag-neg'}">${isPos ? '+ ' : '- '}${friend.latestNote.pts}:</span>
          "${this.escapeHTML(friend.latestNote.text)}"
        </span>
      `;
    }

    return `
      <div class="friend-card ${cardExtraClass}" data-id="${friend.id}">
        <div class="friend-left">
          <div class="friend-rank-num">#${index + 1}</div>
          <div class="friend-avatar">${friend.avatar}</div>
          <div class="friend-info">
            <div class="friend-name-row">
              <span class="friend-name">${this.escapeHTML(friend.name)}</span>
              ${friend.nickname ? `<span class="friend-tag">${this.escapeHTML(friend.nickname)}</span>` : ''}
              ${isTopRoaster ? `<span class="badge badge-aura">👑 Roast God</span>` : ''}
              ${isChiefVictim ? `<span class="badge badge-burn">💀 Backfire Victim</span>` : ''}
            </div>
            ${latestNoteHTML}
          </div>
        </div>

        <!-- Marks Box -->
        <div class="friend-marks-box">
          <span class="marks-val ${marksColorClass}" id="marks_${friend.id}">
            ${friend.points > 0 ? '+' : ''}${friend.points}
          </span>
          <span class="marks-label">Marks</span>
        </div>

        <!-- Actions -->
        <div class="friend-actions">
          <button class="btn-hit" data-action="hit" data-id="${friend.id}" title="Landed a savage roast (+1 mark & note)">
            <span>🔥</span>
            <span>+1 Roast</span>
          </button>

          <button class="btn-backfire" data-action="backfire" data-id="${friend.id}" title="Failed at roasting & got cooked (-1 mark & note)">
            <span>💀</span>
            <span>-1 Backfire</span>
          </button>

          <button class="btn-more-menu" data-action="menu" data-id="${friend.id}" title="Options">
            ⋮
          </button>
        </div>
      </div>
    `;
  }

  attachCardEventListeners() {
    this.friendsListEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const friend = this.state.friends.find(f => f.id === id);
        if (!friend) return;

        if (action === 'hit') {
          this.openMarkActionModal(friend, 'hit');
        } else if (action === 'backfire') {
          this.openMarkActionModal(friend, 'backfire');
        } else if (action === 'menu') {
          const choice = prompt(`Options for "${friend.name}":\n1: Edit details\n2: Delete friend (removes from all devices)\n(Type 1 or 2):`);
          if (choice === '1') {
            this.openEditFriendModal(friend);
          } else if (choice === '2') {
            if (confirm(`Remove "${friend.name}" from the roast roster on all devices?`)) {
              this.state.deleteFriend(id);
              this.render();
              this.showToast(`"${friend.name}" deleted and synced across all devices!`, 'hit');
            }
          }
        }
      });
    });
  }

  animateMarks(id) {
    const el = document.getElementById(`marks_${id}`);
    if (el) {
      el.classList.remove('pop-anim');
      void el.offsetWidth;
      el.classList.add('pop-anim');
    }
  }

  renderPodium() {
    if (this.state.friends.length < 2) {
      this.podiumSectionEl.classList.add('hidden');
      return;
    }
    this.podiumSectionEl.classList.remove('hidden');

    const sortedDesc = [...this.state.friends].sort((a, b) => b.points - a.points);
    const topRoaster = sortedDesc[0];
    const secondRoaster = sortedDesc[1];
    const chiefVictim = sortedDesc[sortedDesc.length - 1];

    const p1 = document.getElementById('podiumRank1');
    p1.querySelector('.podium-avatar').textContent = topRoaster.avatar;
    p1.querySelector('.podium-name').textContent = topRoaster.name;
    p1.querySelector('.podium-points').textContent = `${topRoaster.points > 0 ? '+' : ''}${topRoaster.points} Marks`;

    const p2 = document.getElementById('podiumRank2');
    p2.querySelector('.podium-avatar').textContent = secondRoaster.avatar;
    p2.querySelector('.podium-name').textContent = secondRoaster.name;
    p2.querySelector('.podium-points').textContent = `${secondRoaster.points > 0 ? '+' : ''}${secondRoaster.points} Marks`;

    const pVictim = document.getElementById('podiumVictim');
    pVictim.querySelector('.podium-avatar').textContent = chiefVictim.avatar;
    pVictim.querySelector('.podium-name').textContent = chiefVictim.name;
    pVictim.querySelector('.podium-points').textContent = `${chiefVictim.points > 0 ? '+' : ''}${chiefVictim.points} Marks`;
  }

  getHighestPointsFriend() {
    if (!this.state.friends.length) return null;
    return [...this.state.friends].sort((a, b) => b.points - a.points)[0];
  }

  getLowestPointsFriend() {
    if (!this.state.friends.length) return null;
    return [...this.state.friends].sort((a, b) => a.points - b.points)[0];
  }

  // --- Mark Action Modal ---
  openMarkActionModal(friend, actionType = 'hit') {
    this.sound.playClick();
    document.getElementById('actionTargetId').value = friend.id;
    document.getElementById('actionType').value = actionType;
    document.getElementById('actionTargetName').textContent = friend.name;
    document.getElementById('actionTargetAvatar').textContent = friend.avatar;
    document.getElementById('actionNoteInput').value = '';

    const banner = document.getElementById('actionTargetBanner');
    const titleEl = document.getElementById('actionModalTitle');
    const labelEl = document.getElementById('actionTargetLabel');
    const badgeEl = document.getElementById('actionAmountBadge');
    const confirmBtn = document.getElementById('confirmActionBtn');
    const selectorRow = document.getElementById('pointsSelectorRow');
    const quickNotesList = document.getElementById('quickNotesList');

    if (actionType === 'hit') {
      banner.className = 'action-target-card type-add';
      titleEl.textContent = `🔥 Award Marks: ${friend.name}`;
      labelEl.textContent = 'Landed a Savage Roast (+ Marks)';
      badgeEl.textContent = '+1';
      confirmBtn.className = 'btn btn-primary';
      confirmBtn.textContent = 'Award + Marks 🔥';

      selectorRow.innerHTML = `
        <label class="point-pill-radio active">
          <input type="radio" name="actionPts" value="1" checked>
          <span>+1 Clean Roast</span>
        </label>
        <label class="point-pill-radio">
          <input type="radio" name="actionPts" value="2">
          <span>+2 Big Burn</span>
        </label>
        <label class="point-pill-radio">
          <input type="radio" name="actionPts" value="5">
          <span>+5 Fatality!</span>
        </label>
      `;

      quickNotesList.innerHTML = NOTE_PRESETS.hit.map(p => `
        <button type="button" class="quick-note-pill" data-text="${this.escapeHTML(p)}">${this.escapeHTML(p)}</button>
      `).join('');

    } else {
      banner.className = 'action-target-card type-deduct';
      titleEl.textContent = `💀 Deduct Marks: ${friend.name}`;
      labelEl.textContent = 'Roast Backfired & Got Clowned (- Marks)';
      badgeEl.textContent = '-1';
      confirmBtn.className = 'btn btn-danger';
      confirmBtn.textContent = 'Deduct - Marks 💀';

      selectorRow.innerHTML = `
        <label class="point-pill-radio active">
          <input type="radio" name="actionPts" value="1" checked>
          <span>-1 Roast Backfired</span>
        </label>
        <label class="point-pill-radio">
          <input type="radio" name="actionPts" value="2">
          <span>-2 Hard Choke</span>
        </label>
        <label class="point-pill-radio">
          <input type="radio" name="actionPts" value="5">
          <span>-5 Total Self-Burn</span>
        </label>
      `;

      quickNotesList.innerHTML = NOTE_PRESETS.backfire.map(p => `
        <button type="button" class="quick-note-pill" data-text="${this.escapeHTML(p)}">${this.escapeHTML(p)}</button>
      `).join('');
    }

    selectorRow.querySelectorAll('.point-pill-radio').forEach(pill => {
      pill.addEventListener('click', () => {
        selectorRow.querySelectorAll('.point-pill-radio').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const input = pill.querySelector('input');
        if (input) {
          input.checked = true;
          badgeEl.textContent = (actionType === 'hit' ? '+' : '-') + input.value;
        }
      });
    });

    quickNotesList.querySelectorAll('.quick-note-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        quickNotesList.querySelectorAll('.quick-note-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        document.getElementById('actionNoteInput').value = pill.dataset.text;
      });
    });

    this.markActionModalEl.classList.remove('hidden');
    document.getElementById('actionNoteInput').focus();
  }

  // --- Add/Edit Friend Modal ---
  openAddFriendModal() {
    this.sound.playClick();
    document.getElementById('friendModalTitle').textContent = 'Add Squad Member';
    document.getElementById('editFriendId').value = '';
    document.getElementById('friendNameInput').value = '';
    document.getElementById('friendNicknameInput').value = '';
    document.getElementById('startingPointsGroup').classList.remove('hidden');
    document.getElementById('startingPointsInput').value = '0';

    this.selectAvatarInModal('😎');
    this.friendModalEl.classList.remove('hidden');
    document.getElementById('friendNameInput').focus();
  }

  openEditFriendModal(friend) {
    this.sound.playClick();
    document.getElementById('friendModalTitle').textContent = 'Edit Squad Member';
    document.getElementById('editFriendId').value = friend.id;
    document.getElementById('friendNameInput').value = friend.name;
    document.getElementById('friendNicknameInput').value = friend.nickname || '';
    document.getElementById('startingPointsGroup').classList.add('hidden');

    this.selectAvatarInModal(friend.avatar || '😎');
    this.friendModalEl.classList.remove('hidden');
    document.getElementById('friendNameInput').focus();
  }

  selectAvatarInModal(avatar) {
    document.getElementById('selectedAvatar').value = avatar;
    const btns = document.querySelectorAll('#avatarPicker .avatar-option');
    btns.forEach(b => {
      if (b.dataset.avatar === avatar) {
        b.classList.add('selected');
      } else {
        b.classList.remove('selected');
      }
    });
  }

  // --- Roast & Backfire Feed ---
  openRoastFeedModal() {
    this.sound.playClick();
    this.renderRoastFeed();
    this.roastFeedModalEl.classList.remove('hidden');
  }

  renderRoastFeed() {
    const listEl = document.getElementById('roastFeedList');
    const emptyEl = document.getElementById('feedEmptyState');

    if (this.state.logs.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      listEl.innerHTML = this.state.logs.map(log => {
        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isHit = log.actionType === 'hit';

        return `
          <div class="feed-item ${isHit ? 'feed-hit' : 'feed-backfire'}">
            <span class="feed-item-icon">${log.avatar || '😎'}</span>
            <div class="feed-content">
              <div class="feed-header">
                <span class="feed-victim">${this.escapeHTML(log.friendName)}</span>
                <span class="feed-time">${timeStr}</span>
              </div>
              <div class="feed-reason">"${this.escapeHTML(log.note)}"</div>
            </div>
            <div class="feed-pts-tag ${isHit ? 'pos' : 'neg'}">
              ${isHit ? `+${log.pts} Mark 🔥` : `-${log.pts} Mark 💀`}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- WhatsApp Share ---
  openWhatsappModal() {
    this.sound.playClick();
    const sortedDesc = [...this.state.friends].sort((a, b) => b.points - a.points);
    const topRoaster = sortedDesc[0];
    const chiefVictim = sortedDesc[sortedDesc.length - 1];

    let message = `🔥 *PORA POINTS - UNIVERSITY ROAST & BACKFIRE LEADERBOARD* 🔥\n`;
    message += `─────────────────────────\n`;
    message += `👑 *#1 Roast God:* ${topRoaster?.avatar || ''} ${topRoaster?.name} (${topRoaster?.points > 0 ? '+' : ''}${topRoaster?.points} Marks)\n`;
    
    if (chiefVictim && chiefVictim.id !== topRoaster?.id) {
      message += `💀 *Chief Backfire Victim:* ${chiefVictim.avatar} ${chiefVictim.name} (${chiefVictim.points} Marks)\n`;
    }

    message += `\n📋 *Current Squad Standings:*\n`;
    sortedDesc.forEach((f, idx) => {
      const markStr = f.points > 0 ? `+${f.points}` : `${f.points}`;
      let noteSnippet = f.latestNote ? ` | Note: "${f.latestNote.text}"` : '';
      message += `${idx + 1}. ${f.avatar} *${f.name}*: ${markStr} Marks${noteSnippet}\n`;
    });

    message += `─────────────────────────\n`;
    message += `📅 Updated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    message += `👉 Live Board: ${this.getShareableUrl()}\n`;
    message += `Rule: Savage roasts earn +1 mark. Failed roasts lose -1 mark! 🔥💀`;

    document.getElementById('whatsappTextPreview').value = message;
    this.whatsappModalEl.classList.remove('hidden');
  }

  getShareableUrl() {
    const base = window.location.origin + window.location.pathname;
    if (this.state.roomCode && this.state.roomCode !== CLOUD_CONFIG.defaultRoom) {
      return `${base}?room=${encodeURIComponent(this.state.roomCode)}`;
    }
    return base;
  }

  updateShareUrlInput() {
    document.getElementById('shareUrlInput').value = this.getShareableUrl();
    document.getElementById('roomCodeInput').value = this.state.roomCode;
  }

  // --- Story Card Poster (Canvas) ---
  openImageCardModal() {
    this.sound.playClick();
    this.imageCardModalEl.classList.remove('hidden');
    this.generateStoryCardCanvas();
  }

  generateStoryCardCanvas() {
    const canvas = document.getElementById('scorecardCanvas');
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0d18');
    bgGradient.addColorStop(0.5, '#12172b');
    bgGradient.addColorStop(1, '#090b14');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const glow1 = ctx.createRadialGradient(720, 120, 10, 720, 120, 320);
    glow1.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(80, 850, 10, 80, 850, 320);
    glow2.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ff5722';
    ctx.fillText('🔥 PORA POINTS 🔥', width / 2, 75);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('ROAST & BACKFIRE LEADERBOARD', width / 2, 110);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Land a roast (+1 mark) • Roast backfires & you get cooked (-1 mark)', width / 2, 135);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 155);
    ctx.lineTo(750, 155);
    ctx.stroke();

    const sortedDesc = [...this.state.friends].sort((a, b) => b.points - a.points);
    const topRoaster = sortedDesc[0];

    if (topRoaster) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 50, 180, 700, 140, 18);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'left';
      ctx.fillText('👑 #1 ROAST GOD (SUPREME MARKS):', 80, 215);

      ctx.font = '52px sans-serif';
      ctx.fillText(topRoaster.avatar || '😎', 80, 285);

      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(topRoaster.name, 155, 255);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      const noteStr = topRoaster.latestNote ? `Latest: "${topRoaster.latestNote.text}"` : (topRoaster.nickname ? `(${topRoaster.nickname})` : 'Campus Legend');
      ctx.fillText(noteStr.length > 40 ? noteStr.slice(0, 37) + '...' : noteStr, 155, 285);

      ctx.textAlign = 'right';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`${topRoaster.points > 0 ? '+' : ''}${topRoaster.points} Marks`, 720, 270);
    }

    ctx.textAlign = 'left';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('📋 Full Squad Standings:', 50, 365);

    let startY = 405;
    const maxRows = 7;
    const displayList = sortedDesc.slice(0, maxRows);

    displayList.forEach((f, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
      this.roundRect(ctx, 50, startY - 26, 700, 54, 10);
      ctx.fill();

      ctx.fillStyle = idx === 0 ? '#10b981' : '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`#${idx + 1}`, 70, startY + 8);

      ctx.font = '24px sans-serif';
      ctx.fillText(f.avatar || '😎', 125, startY + 10);

      ctx.font = 'bold 19px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(f.name, 175, startY + 8);

      if (f.latestNote) {
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#64748b';
        const noteShort = `• "${f.latestNote.text}"`;
        ctx.fillText(noteShort.length > 35 ? noteShort.slice(0, 32) + '...' : noteShort, 185 + ctx.measureText(f.name).width, startY + 8);
      }

      ctx.textAlign = 'right';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = f.points < 0 ? '#ef4444' : (f.points > 0 ? '#10b981' : '#94a3b8');
      ctx.fillText(`${f.points > 0 ? '+' : ''}${f.points} Marks`, 720, startY + 8);

      startY += 65;
    });

    ctx.textAlign = 'center';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Pora Points • Live Synced Board • ${new Date().toLocaleDateString()}`, width / 2, 940);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  downloadScorecardPNG() {
    const canvas = document.getElementById('scorecardCanvas');
    const a = document.createElement('a');
    a.download = `pora_points_story_${new Date().toISOString().slice(0, 10)}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    this.showToast('📸 Poster image downloaded!', 'hit');
  }

  openSyncModal() {
    this.sound.playClick();
    this.updateShareUrlInput();
    this.syncModalEl.classList.remove('hidden');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  showToast(message, type = 'hit') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'backfire' ? 'toast-backfire' : 'toast-hit'}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
  window.poraApp = new PoraApp();
});
