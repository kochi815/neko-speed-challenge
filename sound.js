// --- 効果音とBGMの管理 ---
const BGM_KEY = 'nekobattle_bgmEnabled_v2';
let isBgmEnabled = true;
let currentBgm = null;

const sounds = {
    // システム音・基本SE
    tap: new Audio('tap.mp3'),
    hitPlayer: new Audio('hit_player.mp3'),
    wrong: new Audio('wrong.mp3'),
    enemyDefeated: new Audio('enemy_defeated.mp3'),
    comboMilestone: new Audio('combo_milestone.mp3'),
    correct: new Audio('correct.mp3'), // 正解ピンポン音
    
    // 斬撃音（既存ファイルを活用）
    hitGood: new Audio('hit_normal.mp3'),     // 通常斬撃
    hitGreat: new Audio('hit_perfect.mp3'),   // 強斬撃
    hitPerfect: new Audio('hit_heavy.mp3'), // 強斬撃
    hitCritical: new Audio('critical_hit.mp3'), // 必殺斬撃

    // 女剣士ボイス
    voiceAtk1: new Audio('voice_atk1.mp3'), // たあっ！
    voiceAtk2: new Audio('voice_atk2.mp3'), // スキあり！
    voiceAtk3: new Audio('voice_atk3.mp3'), // はあーっ！
    voiceAtk4: new Audio('voice_atk4.mp3'), // かわせるかしら？
    voiceSkill: new Audio('voice_skill.mp3'), // 紫電一閃！
    voiceBoss1: new Audio('voice_boss1.mp3'), // 覚悟しなさい！
    voiceBoss2: new Audio('voice_boss2.mp3'), // 負けられないわ！
    voiceWin: new Audio('voice_win.mp3'),     // 先を急ぎましょう

    // BGM
    bgmNormal: new Audio('bgm_normal.mp3'),
    bgmBoss: new Audio('bgm_boss.mp3'),
    bgmTraining: new Audio('bgm_training.mp3')
};

// ループ設定と音量調整
sounds.bgmNormal.loop = true; sounds.bgmNormal.volume = 0.3;
sounds.bgmBoss.loop = true; sounds.bgmBoss.volume = 0.3;
sounds.bgmTraining.loop = true; sounds.bgmTraining.volume = 0.3;

// ★改良版 playSound: 音程変更・音量調整・連打対応
function playSound(name, pitch = 1.0, volume = 1.0) {
    if (!sounds[name]) return;
    const clone = sounds[name].cloneNode(); // 重ねて鳴らすために複製
    
    // ピッチ（速度）は0.5〜2.0の範囲で安全に制限
    clone.playbackRate = Math.min(Math.max(pitch, 0.5), 2.0);
    
    // 音量制限
    clone.volume = Math.min(Math.max(volume, 0.0), 1.0);
    
    clone.play().catch(e => {});
}

// ★ボイスをランダムに再生するヘルパー関数
function playRandomAttackVoice() {
    const r = Math.random();
    // 40%の確率で喋る (残りの60%は無言)
    if (r < 0.1) playSound('voiceAtk1');      // たあっ！
    else if (r < 0.2) playSound('voiceAtk2'); // スキあり！
    else if (r < 0.3) playSound('voiceAtk3'); // はあーっ！
    else if (r < 0.4) playSound('voiceAtk4'); // かわせるかしら？
}

// BGM制御
function playBgm(n) { 
    if (!isBgmEnabled || !sounds[n]) return; 
    stopBgm(); 
    sounds[n].play().catch(e => {}); 
    currentBgm = sounds[n]; 
}

function stopBgm() { 
    if (currentBgm) { 
        currentBgm.pause(); 
        currentBgm.currentTime = 0; 
        currentBgm = null; 
    } 
}

function updateBgmButton(btnElement) { 
    if(!btnElement) return;
    btnElement.textContent = isBgmEnabled ? '🔊' : '🔇'; 
    btnElement.classList.toggle('muted', !isBgmEnabled); 
}

function loadBgmSetting(btnElement) { 
    const s = localStorage.getItem(BGM_KEY); 
    isBgmEnabled = (s !== null) ? JSON.parse(s) : true; 
    updateBgmButton(btnElement); 
}