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

    // アイテム使用音
    heal: new Audio('heal.mp3'),
    barrierBlock: new Audio('barrier_block.mp3'), // バリア防御音
    itemDrop: new Audio('item_drop.mp3'),         // アイテムドロップ音

    // タイマー攻撃音
    enemyAttackWarning: new Audio('enemy_attack_warning.mp3'), // 攻撃準備警告音
    enemyAttack: new Audio('enemy_attack.mp3'),                // 攻撃ヒット音

    // 演出音
    evolution: new Audio('evolution.mp3'),     // 進化ファンファーレ
    areaClear: new Audio('area_clear.mp3'),   // エリアボス撃破ファンファーレ
    gameOver: new Audio('game_over.mp3'),     // 敗北ジングル
    hpLow: new Audio('hp_low.mp3'),           // HP低下警告音

    // BGM（共通）
    bgmNormal: new Audio('bgm_normal.mp3'),   // フォールバック用（エリアBGMが無い場合）
    bgmBoss: new Audio('bgm_boss.mp3'),       // フォールバック用（エリアボスBGMが無い場合）
    bgmTraining: new Audio('bgm_training.mp3'),

    // BGM（エリア別・通常バトル）
    bgmArea1: new Audio('bgm_area1.mp3'),     // ほのおのどうくつ (Lv1-10)
    bgmArea2: new Audio('bgm_area2.mp3'),     // あらしのさんみゃく (Lv11-20)
    bgmArea3: new Audio('bgm_area3.mp3'),     // しんかいのしんでん (Lv21-30)
    bgmArea4: new Audio('bgm_area4.mp3'),     // おうごんのめいきゅう (Lv31-40)
    bgmArea5: new Audio('bgm_area5.mp3'),     // てんくうのしろ (Lv41-50)
    bgmArea6: new Audio('bgm_area6.mp3'),     // あんこくのぎょくざ (Lv51-60)

    // BGM（エリア別・ボスバトル）
    bgmBoss1: new Audio('bgm_boss1.mp3'),     // ファイヤードレイク (Lv10)
    bgmBoss2: new Audio('bgm_boss2.mp3'),     // ヴリトラ (Lv20)
    bgmBoss3: new Audio('bgm_boss3.mp3'),     // レヴィアタン (Lv30)
    bgmBoss4: new Audio('bgm_boss4.mp3'),     // ファフニール (Lv40)
    bgmBoss5: new Audio('bgm_boss5.mp3'),     // バハムート (Lv50)
    bgmBoss6: new Audio('bgm_boss6.mp3')      // アジ・ダハーカ (Lv60)
};

// ループ設定と音量調整
const bgmKeys = [
    'bgmNormal', 'bgmBoss', 'bgmTraining',
    'bgmArea1', 'bgmArea2', 'bgmArea3', 'bgmArea4', 'bgmArea5', 'bgmArea6',
    'bgmBoss1', 'bgmBoss2', 'bgmBoss3', 'bgmBoss4', 'bgmBoss5', 'bgmBoss6'
];
bgmKeys.forEach(key => {
    if (sounds[key]) { sounds[key].loop = true; sounds[key].volume = 0.3; }
});

// ★改良版 playSound: 音程変更・音量調整・連打対応
function playSound(name, pitch = 1.0, volume = 1.0) {
    if (!sounds[name]) return;
    const clone = sounds[name].cloneNode(); // 重ねて鳴らすために複製
    
    // ピッチ（速度）は0.5〜2.0の範囲で安全に制限
    clone.playbackRate = Math.min(Math.max(pitch, 0.5), 2.0);
    
    // 音量制限
    clone.volume = Math.min(Math.max(volume, 0.0), 1.0);
    
    // 再生終了後にリソース解放（メモリリーク防止）
    clone.addEventListener('ended', () => { clone.src = ''; });
    clone.play().catch(e => { clone.src = ''; });
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

// ★エリア別BGM: ファイルが無ければフォールバック
function playBgmWithFallback(primary, fallback) {
    if (!isBgmEnabled) return;
    stopBgm();
    if (sounds[primary]) {
        const audio = sounds[primary];
        // ファイルが読み込めるかチェック
        const tryPlay = audio.play();
        if (tryPlay !== undefined) {
            tryPlay.then(() => { currentBgm = audio; }).catch(() => {
                // ファイルが無い → フォールバック
                if (sounds[fallback]) {
                    sounds[fallback].play().catch(e => {});
                    currentBgm = sounds[fallback];
                }
            });
        } else {
            currentBgm = audio;
        }
    } else if (sounds[fallback]) {
        sounds[fallback].play().catch(e => {});
        currentBgm = sounds[fallback];
    }
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