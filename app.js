/**
 * ============================================================
 * PORA POINTS (පෝරා පොයින්ට්ස්) - UNIVERSITY ROAST & AURA COUNTER
 * ============================================================
 * Core logic, sound synthesis (Web Audio API), state management,
 * canvas poster generator, WhatsApp exporter, and bilingual dictionary.
 */

// --- Default Seed Data ---
const DEFAULT_FRIENDS = [
  { id: 'f_1', name: 'කසුන් (Kasun)', nickname: 'FOT', avatar: '🤡', points: 4, createdAt: 1700000000000 },
  { id: 'f_2', name: 'නිමල් (Nimal)', nickname: 'Eng', avatar: '🗿', points: 9, createdAt: 1700000010000 },
  { id: 'f_3', name: 'චතුර (Chathura)', nickname: 'CS', avatar: '🤓', points: -2, createdAt: 1700000020000 }
];

const DEFAULT_ROAST_LOGS = [
  { id: 'r_1', friendId: 'f_3', friendName: 'චතුර (Chathura)', avatar: '🤓', reason: 'Crush එකට talk කරන්න ගිහින් නෑවා 💔', ptsDeducted: 1, timestamp: Date.now() - 3600000 }
];

// --- Quick Pick Roast Reasons ---
const PRESET_ROAST_REASONS = {
  si: [
    'Crush එකට talk කරන්න ගිහින් නෑවා 💔',
    'Lectures bunk කරලා sir ට මාට්ටු 🏃‍♂️',
    'Canteen එකේ තේ එක හලාගත්තා ☕',
    'Joke එකක් දාලා කවුරුත් හිනා වුණේ නෑ 🦗',
    'Ex එක දැකලා හැංගුණා 🙈',
    'Assignment deadline එක අන්තිම තත්පරේ miss වුණා 💻',
    'කැන්ටිමේ බිල ගෙවන්න සල්ලි නෑ කිව්වා 💸',
    'Lab exam එකේ monitor එක off වුණා 🔌'
  ],
  en: [
    'Tried talking to crush and fumbled 💔',
    'Bunked lecture & got caught by lecturer 🏃‍♂️',
    'Spilled tea all over in canteen ☕',
    'Cracked a joke and dead silence followed 🦗',
    'Saw ex and hid behind a tree 🙈',
    'Missed assignment deadline at 11:59 PM 💻',
    'Pretended wallet was empty at canteen 💸',
    'Accidentally unplugged PC during lab exam 🔌'
  ]
};

// --- Bilingual Dictionary ---
const TRANSLATIONS = {
  si: {
    tagline: 'යාලුවෙක් පෝර කෑවොත් ලකුණු අඩු කරන්න (-1) | University Roast Scoreboard',
    sync: 'Sync',
    addFriend: 'මිතුරෙක් එකතු කරන්න',
    roastLog: 'පෝර පුවත්පත (Feed)',
    shareScorecard: 'WhatsApp Share',
    statusCard: 'Story Card',
    podiumTag: '⚡ සජීවී තත්ත්වය',
    podiumTitle: 'පෝර කාපු අය සහ අවුරා රජවරු',
    victim1Sub: 'වැඩිපුරම පෝර කාපු කෙනා (පෝර රජා)',
    victim2Sub: 'දෙවැනියට වැඩිපුරම පෝර කාපු කෙනා',
    auraKingSub: 'වැඩිම ලකුණු (අඩුම පෝර)',
    searchPlaceholder: 'මිතුරන් සොයන්න...',
    sortMostRoasted: '💀 වැඩිපුරම පෝර කාපු (අඩු ලකුණු)',
    sortHighestAura: '👑 වැඩිම ලකුණු (Aura High)',
    sortRecent: '⏱️ අලුත්ම',
    emptyTitle: 'තාම කිසිම කෙනෙක් පෝර කාලා නෑ!',
    emptySubtitle: 'ඔබේ කැන්ටිමේ හෝ බැච් එකේ යාලුවන්ව එකතු කර ලකුණු සටහන් කිරීම අරඹන්න.',
    addFirstFriend: 'පළමු මිතුරා එකතු කරන්න',
    footerText: 'යාලුවන්ගේ හිත් රිදවීමකින් තොරව විනෝදය සඳහා පමණි!',
    modalAddTitle: 'නව මිතුරෙකු එකතු කරන්න',
    modalEditTitle: 'මිතුරා සංස්කරණය කරන්න',
    labelName: 'නම (Name) *',
    labelNickname: 'අන්වර්ථ නාමය / පීඨය / බැච් එක (Optional)',
    labelAvatar: 'Avatar එකක් තෝරන්න',
    labelInitialPoints: 'ආරම්භක ලකුණු (Starting Marks)',
    helperInitialPoints: 'සාමාන්‍යයෙන් 0 හෝ 10 කින් පටන් ගත හැක. පෝර කන විට ලකුණු අඩු වේ!',
    btnCancel: 'අවලංගු කරන්න',
    btnSave: 'සුරකින්න',
    modalRoastTitle: '🔥 රෝස්ට් කළ හේතුව සටහන් කරන්න',
    roastDeductSubtitle: 'පෝර කෑම නිසා ලකුණු අඩු කෙරේ (- Marks)',
    quickReasons: 'නිතර වන සිදුවීම් (Quick Pick):',
    customReason: 'සිදුවූ සැබෑ සිද්ධිය (Custom Roast):',
    marksToDeduct: 'අඩු කරන ලකුණු ප්‍රමාණය (Marks to Deduct):',
    btnDeductMarks: 'ලකුණු අඩු කරන්න 💀',
    feedModalTitle: 'පෝර පුවත්පත (Roast Feed)',
    feedIntro: 'බැච් එකේ සියලුම රෝස්ට් සිදුවීම් සහ ලකුණු කැපීම් කාලානුක්‍රමිකව මෙතැන සටහන් වේ.',
    feedEmpty: 'තවම රෝස්ට් සටහන් කර නොමැත.',
    clearLogs: 'Logs මකන්න',
    btnClose: 'වසන්න',
    whatsappDesc: 'මෙම සාරාංශය Copy කර ඔබේ University WhatsApp Group එකට හෝ Status එකට යවන්න:',
    btnCopy: 'Copy කරන්න',
    imageModalTitle: 'WhatsApp Status / Instagram Story Card',
    imageModalDesc: 'ඔබේ යාලුවන්ගේ ලකුණු පුවරුව සුපිරි Story Card එකක් ලෙස Image එකක් කර Download කරගන්න!',
    btnDownloadImage: 'Image එක බාගත කරන්න (PNG)',
    syncModalTitle: 'දත්ත ආරක්ෂා කිරීම සහ බෙදාගැනීම',
    shareLinkTitle: '🔗 සජීවී Share Link එක',
    shareLinkDesc: 'මෙම Link එක යාලුවන්ට යැවීමෙන් ඔවුන්ගේ දුරකථනයටත් මේ ලකුණු ඒ විදියටම ලබාගත හැක.',
    copy: 'Copy',
    backupTitle: '💾 Backup & Restore (JSON)',
    backupDesc: 'ඔබේ සම්පූර්ණ ලකුණු ලැයිස්තුව File එකක් ලෙස Save කරගන්න හෝ Restore කරන්න.',
    exportJson: 'Backup බාගත කරන්න',
    importJson: 'Restore කරන්න',
    dangerZoneTitle: '⚠️ නව තරඟයක් (Reset Game)',
    resetDesc: 'සියලු මිතුරන්ගේ ලකුණු 10 කර නැවත තරඟය මුල සිට ආරම්භ කරන්න.',
    resetPoints: 'ලකුණු Reset කරන්න'
  },
  en: {
    tagline: 'When a friend gets roasted, reduce their marks (-1) | University Roast Scoreboard',
    sync: 'Sync',
    addFriend: 'Add Friend',
    roastLog: 'Roast Feed',
    shareScorecard: 'WhatsApp Share',
    statusCard: 'Story Card',
    podiumTag: '⚡ LIVE STANDINGS',
    podiumTitle: 'Top Victims & Aura Masters',
    victim1Sub: 'Supreme Roast Victim (King of Pora)',
    victim2Sub: 'Second Most Roasted',
    auraKingSub: 'Highest Marks (Roast Immune)',
    searchPlaceholder: 'Search friends...',
    sortMostRoasted: '💀 Most Roasted (Lowest Marks)',
    sortHighestAura: '👑 Highest Marks (Aura High)',
    sortRecent: '⏱️ Recent',
    emptyTitle: 'No one has been roasted yet!',
    emptySubtitle: 'Add your canteen & batch squad to start tracking roast marks.',
    addFirstFriend: 'Add First Friend',
    footerText: 'Made for fun & banter among university legends!',
    modalAddTitle: 'Add New Friend',
    modalEditTitle: 'Edit Friend Details',
    labelName: 'Name *',
    labelNickname: 'Nickname / Faculty / Batch (Optional)',
    labelAvatar: 'Pick an Avatar',
    labelInitialPoints: 'Starting Marks',
    helperInitialPoints: 'Usually starts at 10 or 0. Marks drop when roasted!',
    btnCancel: 'Cancel',
    btnSave: 'Save',
    modalRoastTitle: '🔥 Log Roast Incident',
    roastDeductSubtitle: 'Marks will be deducted for getting roasted (- Marks)',
    quickReasons: 'Common Incidents (Quick Pick):',
    customReason: 'What happened? (Custom Reason):',
    marksToDeduct: 'Marks to Deduct:',
    btnDeductMarks: 'Deduct Marks 💀',
    feedModalTitle: 'The Roast Wall of Shame',
    feedIntro: 'Chronological timeline of all roast incidents and mark deductions.',
    feedEmpty: 'No roasts recorded yet.',
    clearLogs: 'Clear Logs',
    btnClose: 'Close',
    whatsappDesc: 'Copy this summary to paste into your University WhatsApp Group or Story:',
    btnCopy: 'Copy Text',
    imageModalTitle: 'WhatsApp Status / Instagram Story Card',
    imageModalDesc: 'Download this slick scorecard graphic to share on your status or group!',
    btnDownloadImage: 'Download Image (PNG)',
    syncModalTitle: 'Sync & Data Backup',
    shareLinkTitle: '🔗 Live Share Link',
    shareLinkDesc: 'Send this link to friends so they can view and sync the same board on their phones.',
    copy: 'Copy',
    backupTitle: '💾 Backup & Restore (JSON)',
    backupDesc: 'Download your full scoreboard data as a JSON file or restore a backup.',
    exportJson: 'Download Backup',
    importJson: 'Restore Backup',
    dangerZoneTitle: '⚠️ Reset Game',
    resetDesc: 'Reset all friends back to 10 marks to start a brand new game.',
    resetPoints: 'Reset Marks'
  }
};

// --- App State ---
class PoraState {
  constructor() {
    this.storageKey = 'pora_points_app_data';
    this.currentLang = localStorage.getItem('pora_lang') || 'si';
    this.soundEnabled = localStorage.getItem('pora_sound') !== 'false';
    this.sortMode = 'most_roasted'; // 'most_roasted' | 'highest_aura' | 'recent'
    this.searchQuery = '';
    
    this.loadState();
  }

  loadState() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.friends = parsed.friends || DEFAULT_FRIENDS;
        this.roastLogs = parsed.roastLogs || DEFAULT_ROAST_LOGS;
      } catch (e) {
        this.friends = [...DEFAULT_FRIENDS];
        this.roastLogs = [...DEFAULT_ROAST_LOGS];
      }
    } else {
      this.friends = [...DEFAULT_FRIENDS];
      this.roastLogs = [...DEFAULT_ROAST_LOGS];
      this.saveState();
    }
  }

  saveState() {
    const payload = {
      friends: this.friends,
      roastLogs: this.roastLogs
    };
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  addFriend(name, nickname, avatar, startingPoints = 10) {
    const newFriend = {
      id: 'f_' + Date.now(),
      name: name.trim(),
      nickname: nickname ? nickname.trim() : '',
      avatar: avatar || '🤡',
      points: parseInt(startingPoints, 10) || 0,
      createdAt: Date.now()
    };
    this.friends.push(newFriend);
    this.saveState();
    return newFriend;
  }

  updateFriend(id, name, nickname, avatar) {
    const friend = this.friends.find(f => f.id === id);
    if (friend) {
      friend.name = name.trim();
      friend.nickname = nickname ? nickname.trim() : '';
      friend.avatar = avatar;
      this.saveState();
    }
  }

  deleteFriend(id) {
    this.friends = this.friends.filter(f => f.id !== id);
    this.roastLogs = this.roastLogs.filter(r => r.friendId !== id);
    this.saveState();
  }

  deductMarks(friendId, pointsDeducted = 1, reason = '') {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return null;

    friend.points -= pointsDeducted;
    
    // Add to Roast Log
    const log = {
      id: 'r_' + Date.now(),
      friendId: friend.id,
      friendName: friend.name,
      avatar: friend.avatar,
      reason: reason || (pointsDeducted >= 5 ? 'Savage Mega Roast! 💀' : 'Got roasted by the squad 🔥'),
      ptsDeducted: pointsDeducted,
      timestamp: Date.now()
    };
    this.roastLogs.unshift(log);
    
    // Keep max 100 logs
    if (this.roastLogs.length > 100) {
      this.roastLogs.pop();
    }

    this.saveState();
    return { friend, log };
  }

  addMarks(friendId, pointsAdded = 1) {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return null;

    friend.points += pointsAdded;
    this.saveState();
    return friend;
  }

  resetAllMarks(defaultValue = 10) {
    this.friends.forEach(f => {
      f.points = defaultValue;
    });
    this.saveState();
  }

  clearLogs() {
    this.roastLogs = [];
    this.saveState();
  }

  // Get friends sorted based on active sort mode and search filter
  getFilteredFriends() {
    let list = [...this.friends];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.nickname.toLowerCase().includes(q)
      );
    }

    if (this.sortMode === 'most_roasted') {
      // Ascending points: lowest points first (the one roasted the most!)
      list.sort((a, b) => a.points - b.points);
    } else if (this.sortMode === 'highest_aura') {
      // Descending points: highest points first (Aura Master)
      list.sort((a, b) => b.points - a.points);
    } else if (this.sortMode === 'recent') {
      // Recently added
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
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Deep Sub-Bass Bonk / Vine Boom effect for -1 Roast
  playRoastBonk() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Sub Bass Oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);

      // Noise punch burst
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);

    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Mega Airhorn Fanfare for -5 Mega Roast
  playMegaRoastAirhorn() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const freqs = [311.13, 311.13, 466.16]; // Eb4, Eb4, Bb4
      const times = [0, 0.12, 0.28];
      const durations = [0.09, 0.09, 0.35];

      freqs.forEach((freq, idx) => {
        const start = t + times[idx];
        const dur = durations[idx];

        // 2 detuned sawtooths for raspy horn vibe
        [-3, 3].forEach(detune => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, start);
          osc.detune.setValueAtTime(detune, start);

          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(start);
          osc.stop(start + dur);
        });
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Uplifting chime on Comeback (+1)
  playComebackChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, idx) => {
        const start = t + (idx * 0.08);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Simple UI click
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }
}

// --- Main Application Controller ---
class PoraApp {
  constructor() {
    this.state = new PoraState();
    this.sound = new SoundEngine();
    
    // Check URL hash for shared board sync
    this.checkSharedUrlHash();

    // DOM Elements
    this.friendsListEl = document.getElementById('friendsList');
    this.emptyStateEl = document.getElementById('emptyState');
    this.podiumSectionEl = document.getElementById('podiumSection');
    this.roastCountBadgeEl = document.getElementById('roastCountBadge');
    this.searchInputEl = document.getElementById('searchInput');

    // Modals
    this.friendModalEl = document.getElementById('friendModal');
    this.roastReasonModalEl = document.getElementById('roastReasonModal');
    this.roastFeedModalEl = document.getElementById('roastFeedModal');
    this.whatsappModalEl = document.getElementById('whatsappModal');
    this.imageCardModalEl = document.getElementById('imageCardModal');
    this.syncModalEl = document.getElementById('syncModal');

    // Forms
    this.friendFormEl = document.getElementById('friendForm');
    this.roastReasonFormEl = document.getElementById('roastReasonForm');

    this.initEventListeners();
    this.updateLanguageUI();
    this.render();
  }

  initEventListeners() {
    // Language Toggle
    document.getElementById('langToggleBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.state.currentLang = this.state.currentLang === 'si' ? 'en' : 'si';
      localStorage.setItem('pora_lang', this.state.currentLang);
      this.updateLanguageUI();
      this.render();
    });

    // Sound Toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    soundToggleBtn.addEventListener('click', () => {
      this.state.soundEnabled = !this.state.soundEnabled;
      localStorage.setItem('pora_sound', this.state.soundEnabled);
      soundIcon.textContent = this.state.soundEnabled ? '🔊' : '🔇';
      if (this.state.soundEnabled) this.sound.playClick();
    });

    // Add Friend Button
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
        this.showToast('✅ Friend updated!', 'info');
      } else {
        this.state.addFriend(name, nickname, avatar, points);
        this.showToast('🎉 Friend added to roast roster!', 'aura');
      }

      this.closeModal('friendModal');
      this.render();
    });

    // Avatar Selection in Modal
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

    // Modal Close Buttons (data-close="modalId")
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal(btn.dataset.close);
      });
    });

    // Close modal on background click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
        }
      });
    });

    // Open Roast Feed Modal
    document.getElementById('openRoastLogBtn').addEventListener('click', () => {
      this.openRoastFeedModal();
    });

    // Clear Roast Logs
    document.getElementById('clearRoastLogsBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the roast logs?')) {
        this.state.clearLogs();
        this.renderRoastFeed();
        this.render();
        this.showToast('Logs cleared.', 'info');
      }
    });

    // Open WhatsApp Share Modal
    document.getElementById('shareWhatsappBtn').addEventListener('click', () => {
      this.openWhatsappModal();
    });

    // Copy WhatsApp Text
    document.getElementById('copyWhatsappBtn').addEventListener('click', () => {
      const text = document.getElementById('whatsappTextPreview').value;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('📋 WhatsApp summary copied!', 'aura');
      });
    });

    // Direct WhatsApp Button
    document.getElementById('openDirectWhatsappBtn').addEventListener('click', () => {
      const text = encodeURIComponent(document.getElementById('whatsappTextPreview').value);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    });

    // Open Story / Card Generator Modal
    document.getElementById('exportImageBtn').addEventListener('click', () => {
      this.openImageCardModal();
    });

    // Download Story Card PNG
    document.getElementById('downloadCardBtn').addEventListener('click', () => {
      this.downloadScorecardPNG();
    });

    // Open Sync / Backup Modal
    document.getElementById('syncModalBtn').addEventListener('click', () => {
      this.openSyncModal();
    });

    // Copy Shareable URL
    document.getElementById('copyShareUrlBtn').addEventListener('click', () => {
      const input = document.getElementById('shareUrlInput');
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        this.showToast('🔗 Live Share link copied!', 'aura');
      });
    });

    // Export JSON Backup
    document.getElementById('exportJsonBtn').addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
        friends: this.state.friends,
        roastLogs: this.state.roastLogs,
        version: '1.0',
        exportedAt: new Date().toISOString()
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pora_points_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('💾 Backup downloaded!', 'info');
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
            this.state.roastLogs = imported.roastLogs || [];
            this.state.saveState();
            this.render();
            this.closeModal('syncModal');
            this.showToast('🎉 Backup restored successfully!', 'aura');
          } else {
            alert('Invalid backup file format!');
          }
        } catch (err) {
          alert('Failed to read JSON backup file.');
        }
      };
      reader.readAsText(file);
    });

    // Reset Points to 10
    document.getElementById('resetPointsBtn').addEventListener('click', () => {
      if (confirm('Reset all friends to 10 marks to start fresh?')) {
        this.state.resetAllMarks(10);
        this.render();
        this.closeModal('syncModal');
        this.showToast('🔄 Marks reset to 10!', 'info');
      }
    });

    // Roast Reason Form Submit
    this.roastReasonFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const victimId = document.getElementById('roastVictimId').value;
      const customReason = document.getElementById('customReasonInput').value;
      const ptsRadio = document.querySelector('input[name="roastPts"]:checked');
      const ptsToDeduct = parseInt(ptsRadio ? ptsRadio.value : '1', 10);

      const res = this.state.deductMarks(victimId, ptsToDeduct, customReason);
      if (res) {
        if (this.state.soundEnabled) {
          if (ptsToDeduct >= 5) {
            this.sound.playMegaRoastAirhorn();
          } else {
            this.sound.playRoastBonk();
          }
        }
        this.showToast(`🔥 ${res.friend.name} was roasted! -${ptsToDeduct} Marks (${res.friend.points} left)`, 'roast');
      }

      this.closeModal('roastReasonModal');
      this.render();
    });
  }

  // --- Rendering UI ---
  render() {
    const friends = this.state.getFilteredFriends();
    this.roastCountBadgeEl.textContent = this.state.roastLogs.length;

    // Render Podium (if at least 2 friends exist)
    this.renderPodium();

    // Render Friends List
    if (friends.length === 0) {
      this.friendsListEl.innerHTML = '';
      this.emptyStateEl.classList.remove('hidden');
    } else {
      this.emptyStateEl.classList.add('hidden');
      this.friendsListEl.innerHTML = friends.map((f, idx) => this.createFriendCardHTML(f, idx)).join('');
      this.attachCardEventListeners();
    }
  }

  createFriendCardHTML(friend, index) {
    const isLowest = this.getLowestPointsFriend()?.id === friend.id;
    const isHighest = this.getHighestPointsFriend()?.id === friend.id;

    let cardExtraClass = '';
    let statusText = '';

    if (friend.points <= 0) {
      cardExtraClass = 'heavily-roasted';
      statusText = `<span class="feed-pts-tag">🔥 Pora Victim</span>`;
    } else if (isHighest && this.state.friends.length > 1) {
      cardExtraClass = 'aura-master';
      statusText = `<span class="text-aura">👑 Aura Leader</span>`;
    }

    let marksColorClass = 'zero';
    if (friend.points > 0) marksColorClass = 'pos';
    if (friend.points < 0) marksColorClass = 'neg';

    return `
      <div class="friend-card ${cardExtraClass}" data-id="${friend.id}">
        <div class="friend-left">
          <div class="friend-rank-num">#${index + 1}</div>
          <div class="friend-avatar">${friend.avatar}</div>
          <div class="friend-info">
            <div class="friend-name-row">
              <span class="friend-name">${this.escapeHTML(friend.name)}</span>
              ${friend.nickname ? `<span class="friend-tag">${this.escapeHTML(friend.nickname)}</span>` : ''}
            </div>
            <div class="friend-status">
              ${statusText}
            </div>
          </div>
        </div>

        <!-- Marks Box -->
        <div class="friend-marks-box">
          <span class="marks-val ${marksColorClass}" id="marks_${friend.id}">
            ${friend.points > 0 ? '+' : ''}${friend.points}
          </span>
          <span class="marks-label">Marks</span>
        </div>

        <!-- Action Buttons -->
        <div class="friend-actions">
          <!-- Primary Roast: Deduct 1 mark -->
          <button class="btn-roast" data-action="roast-1" data-id="${friend.id}" title="Deduct 1 mark for getting roasted">
            <span>🔥</span>
            <span>-1 Roast</span>
          </button>

          <!-- Quick Mega Roast: Deduct 5 marks -->
          <button class="btn-quick" data-action="roast-5" data-id="${friend.id}" title="Mega Roast (-5 marks)">
            <span>💀</span>
            <span>-5</span>
          </button>

          <!-- Comeback: +1 mark -->
          <button class="btn-quick" data-action="comeback" data-id="${friend.id}" title="Comeback / Aura Gain (+1 mark)">
            <span>🛡️</span>
            <span>+1</span>
          </button>

          <!-- Log Reason -->
          <button class="btn-quick" data-action="reason" data-id="${friend.id}" title="Log Reason">
            <span>📝</span>
          </button>

          <!-- More Options Menu (Edit / Delete) -->
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

        if (action === 'roast-1') {
          // Deduct 1 Mark
          const res = this.state.deductMarks(id, 1, 'Quick roast in canteen 🔥');
          if (res) {
            if (this.state.soundEnabled) this.sound.playRoastBonk();
            this.animateMarks(id);
            this.showToast(`🔥 ${friend.name} was roasted! -1 Mark (${friend.points} left)`, 'roast');
            this.render();
          }
        } else if (action === 'roast-5') {
          // Mega Roast (-5)
          const res = this.state.deductMarks(id, 5, 'Savage Mega Roast! 💀');
          if (res) {
            if (this.state.soundEnabled) this.sound.playMegaRoastAirhorn();
            this.animateMarks(id);
            this.showToast(`💀 MEGA ROAST! ${friend.name} lost 5 marks! (${friend.points} left)`, 'roast');
            this.render();
          }
        } else if (action === 'comeback') {
          // Comeback (+1)
          this.state.addMarks(id, 1);
          if (this.state.soundEnabled) this.sound.playComebackChime();
          this.animateMarks(id);
          this.showToast(`🛡️ ${friend.name} made a comeback! +1 Mark (${friend.points} total)`, 'aura');
          this.render();
        } else if (action === 'reason') {
          // Open Reason Modal
          this.openRoastReasonModal(friend);
        } else if (action === 'menu') {
          // Edit or Delete Prompt
          const choice = prompt(`Options for "${friend.name}":\n1: Edit details\n2: Delete friend\n(Type 1 or 2):`);
          if (choice === '1') {
            this.openEditFriendModal(friend);
          } else if (choice === '2') {
            if (confirm(`Remove "${friend.name}" from the roast board?`)) {
              this.state.deleteFriend(id);
              this.render();
              this.showToast('Friend removed.', 'info');
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
      void el.offsetWidth; // trigger reflow
      el.classList.add('pop-anim');
    }
  }

  // Render Top 3 Showcase (Most Roasted vs Aura Master)
  renderPodium() {
    if (this.state.friends.length < 2) {
      this.podiumSectionEl.classList.add('hidden');
      return;
    }
    this.podiumSectionEl.classList.remove('hidden');

    // Friends sorted ascending by marks (lowest marks first)
    const sortedAsc = [...this.state.friends].sort((a, b) => a.points - b.points);

    // Supreme Roast Victim (Lowest marks)
    const victim1 = sortedAsc[0];
    // 2nd Roast Victim
    const victim2 = sortedAsc[1];
    // Aura King (Highest marks)
    const auraKing = sortedAsc[sortedAsc.length - 1];

    // Populate Victim 1
    const p1 = document.getElementById('podiumVictim1');
    p1.querySelector('.podium-avatar').textContent = victim1.avatar;
    p1.querySelector('.podium-name').textContent = victim1.name;
    p1.querySelector('.podium-points').textContent = `${victim1.points > 0 ? '+' : ''}${victim1.points} Marks`;

    // Populate Victim 2
    const p2 = document.getElementById('podiumVictim2');
    p2.querySelector('.podium-avatar').textContent = victim2.avatar;
    p2.querySelector('.podium-name').textContent = victim2.name;
    p2.querySelector('.podium-points').textContent = `${victim2.points > 0 ? '+' : ''}${victim2.points} Marks`;

    // Populate Aura King
    const pAura = document.getElementById('podiumAuraKing');
    pAura.querySelector('.podium-avatar').textContent = auraKing.avatar;
    pAura.querySelector('.podium-name').textContent = auraKing.name;
    pAura.querySelector('.podium-points').textContent = `${auraKing.points > 0 ? '+' : ''}${auraKing.points} Marks`;
  }

  getLowestPointsFriend() {
    if (!this.state.friends.length) return null;
    return [...this.state.friends].sort((a, b) => a.points - b.points)[0];
  }

  getHighestPointsFriend() {
    if (!this.state.friends.length) return null;
    return [...this.state.friends].sort((a, b) => b.points - a.points)[0];
  }

  // --- Modals Operations ---
  openAddFriendModal() {
    this.sound.playClick();
    document.getElementById('friendModalTitle').textContent = TRANSLATIONS[this.state.currentLang].modalAddTitle;
    document.getElementById('editFriendId').value = '';
    document.getElementById('friendNameInput').value = '';
    document.getElementById('friendNicknameInput').value = '';
    document.getElementById('startingPointsGroup').classList.remove('hidden');
    document.getElementById('startingPointsInput').value = '10';

    // Reset avatar picker
    this.selectAvatarInModal('🤡');

    this.friendModalEl.classList.remove('hidden');
    document.getElementById('friendNameInput').focus();
  }

  openEditFriendModal(friend) {
    this.sound.playClick();
    document.getElementById('friendModalTitle').textContent = TRANSLATIONS[this.state.currentLang].modalEditTitle;
    document.getElementById('editFriendId').value = friend.id;
    document.getElementById('friendNameInput').value = friend.name;
    document.getElementById('friendNicknameInput').value = friend.nickname || '';
    document.getElementById('startingPointsGroup').classList.add('hidden');

    this.selectAvatarInModal(friend.avatar || '🤡');

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

  openRoastReasonModal(friend) {
    this.sound.playClick();
    document.getElementById('roastVictimId').value = friend.id;
    document.getElementById('roastVictimName').textContent = friend.name;
    document.getElementById('roastVictimAvatar').textContent = friend.avatar;
    document.getElementById('customReasonInput').value = '';

    // Populate quick reasons
    const reasons = PRESET_ROAST_REASONS[this.state.currentLang] || PRESET_ROAST_REASONS.si;
    const container = document.getElementById('quickReasonsList');
    container.innerHTML = reasons.map(r => `
      <button type="button" class="quick-reason-pill" data-text="${this.escapeHTML(r)}">${this.escapeHTML(r)}</button>
    `).join('');

    container.querySelectorAll('.quick-reason-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.quick-reason-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        document.getElementById('customReasonInput').value = pill.dataset.text;
      });
    });

    this.roastReasonModalEl.classList.remove('hidden');
  }

  openRoastFeedModal() {
    this.sound.playClick();
    this.renderRoastFeed();
    this.roastFeedModalEl.classList.remove('hidden');
  }

  renderRoastFeed() {
    const listEl = document.getElementById('roastFeedList');
    const emptyEl = document.getElementById('feedEmptyState');

    if (this.state.roastLogs.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      listEl.innerHTML = this.state.roastLogs.map(log => {
        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="feed-item">
            <span class="feed-item-icon">${log.avatar || '🤡'}</span>
            <div class="feed-content">
              <div class="feed-header">
                <span class="feed-victim">${this.escapeHTML(log.friendName)}</span>
                <span class="feed-time">${timeStr}</span>
              </div>
              <div class="feed-reason">"${this.escapeHTML(log.reason)}"</div>
            </div>
            <div class="feed-pts-tag">-${log.ptsDeducted} Mark</div>
          </div>
        `;
      }).join('');
    }
  }

  openWhatsappModal() {
    this.sound.playClick();
    const sortedAsc = [...this.state.friends].sort((a, b) => a.points - b.points);
    const auraKing = sortedAsc[sortedAsc.length - 1];

    let message = `🔥 *පෝරා පොයින්ට්ස් (PORA POINTS) - UNIVERSITY STANDINGS* 🔥\n`;
    message += `───────────────────────\n`;
    message += `💀 *වැඩිපුරම පෝර කාපු අය (Most Roasted):*\n`;

    sortedAsc.slice(0, 5).forEach((f, idx) => {
      const crown = idx === 0 ? '👑 [පෝර රජා] ' : '';
      message += `${idx + 1}. ${f.avatar} *${f.name}*: ${f.points > 0 ? '+' : ''}${f.points} Marks ${crown}\n`;
    });

    if (auraKing && auraKing.points > 0) {
      message += `\n🛡️ *Aura Master:* ${auraKing.avatar} ${auraKing.name} (${auraKing.points} Marks)\n`;
    }

    message += `───────────────────────\n`;
    message += `📅 Updated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    message += `👉 Live Link: ${window.location.href.split('#')[0]}\n`;
    message += `යාලුවෙක් පෝර කෑවොත් ලකුණු අඩු කරන්න (-1)! 🔥`;

    document.getElementById('whatsappTextPreview').value = message;
    this.whatsappModalEl.classList.remove('hidden');
  }

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

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0d111e');
    bgGradient.addColorStop(0.5, '#13192e');
    bgGradient.addColorStop(1, '#090c15');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Neon Glows
    const glow1 = ctx.createRadialGradient(700, 100, 10, 700, 100, 300);
    glow1.addColorStop(0, 'rgba(255, 87, 34, 0.35)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(100, 850, 10, 100, 850, 300);
    glow2.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // Header Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ff5722';
    ctx.fillText('🔥 පෝරා පොයින්ට්ස් 🔥', width / 2, 75);

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('PORA & AURA SCOREBOARD', width / 2, 110);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('කැන්ටිමේ සහ බැච් එකේ සදාචාර සම්පන්න රෝස්ට් ලීඩර්බෝඩ් එක', width / 2, 135);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 155);
    ctx.lineTo(750, 155);
    ctx.stroke();

    // Section 1: Top Most Roasted (#1 Supreme Victim)
    const sortedAsc = [...this.state.friends].sort((a, b) => a.points - b.points);
    const victim1 = sortedAsc[0];

    if (victim1) {
      // Big highlight card
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 50, 180, 700, 150, 18);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'left';
      ctx.fillText('💀 #1 පෝර රජා (SUPREME ROAST VICTIM):', 80, 215);

      ctx.font = '54px sans-serif';
      ctx.fillText(victim1.avatar || '🤡', 80, 290);

      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(victim1.name, 160, 260);

      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(victim1.nickname ? `(${victim1.nickname})` : 'University Legend', 160, 290);

      ctx.textAlign = 'right';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`${victim1.points > 0 ? '+' : ''}${victim1.points} Marks`, 720, 275);
    }

    // Leaderboard Table
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('📋 සම්පූර්ණ ලකුණු සටහන (All Friends):', 50, 375);

    let startY = 415;
    const maxRows = 7;
    const displayList = sortedAsc.slice(0, maxRows);

    displayList.forEach((f, idx) => {
      // Card row background
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
      this.roundRect(ctx, 50, startY - 26, 700, 52, 10);
      ctx.fill();

      // Rank
      ctx.fillStyle = idx === 0 ? '#ef4444' : '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`#${idx + 1}`, 70, startY + 6);

      // Avatar & Name
      ctx.font = '24px sans-serif';
      ctx.fillText(f.avatar || '🤡', 125, startY + 8);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(f.name, 175, startY + 7);

      if (f.nickname) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`(${f.nickname})`, 175 + ctx.measureText(f.name).width + 12, startY + 5);
      }

      // Marks
      ctx.textAlign = 'right';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = f.points < 0 ? '#ef4444' : (f.points > 0 ? '#10b981' : '#94a3b8');
      ctx.fillText(`${f.points > 0 ? '+' : ''}${f.points} Marks`, 720, startY + 7);

      startY += 64;
    });

    // Footer Watermark
    ctx.textAlign = 'center';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Pora Points • Updated on ${new Date().toLocaleDateString()} • University Edition`, width / 2, 940);
  }

  // Helper to draw rounded rectangle on Canvas
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
    const link = document.createElement('a');
    link.download = `pora_points_story_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('📸 Scorecard Image downloaded!', 'aura');
  }

  openSyncModal() {
    this.sound.playClick();
    // Generate shareable URL with encoded state
    const dataStr = btoa(unescape(encodeURIComponent(JSON.stringify({
      friends: this.state.friends,
      roastLogs: this.state.roastLogs
    }))));
    const shareUrl = `${window.location.origin}${window.location.pathname}#sync=${dataStr}`;
    document.getElementById('shareUrlInput').value = shareUrl;

    this.syncModalEl.classList.remove('hidden');
  }

  checkSharedUrlHash() {
    if (window.location.hash.startsWith('#sync=')) {
      try {
        const raw = window.location.hash.replace('#sync=', '');
        const decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
        if (decoded && Array.isArray(decoded.friends)) {
          if (confirm('A shared Pora Points scoreboard was detected from the link! Would you like to import it?')) {
            this.state.friends = decoded.friends;
            this.state.roastLogs = decoded.roastLogs || [];
            this.state.saveState();
            history.replaceState(null, null, window.location.pathname);
            alert('Board synced successfully!');
          }
        }
      } catch (e) {
        console.warn('Failed to parse sync hash', e);
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'roast' ? 'toast-roast' : (type === 'aura' ? 'toast-aura' : '')}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  updateLanguageUI() {
    const lang = this.state.currentLang;
    const dict = TRANSLATIONS[lang];
    document.getElementById('langLabel').textContent = lang === 'si' ? 'English' : 'සිංහල';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });
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

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.poraApp = new PoraApp();
});
