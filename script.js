// ============================================================
// ねこバトルチャレンジ - script.js (大型アップデート版)
// 新機能: 必殺技 / アイテムドロップ / にゃんたろう進化 / エリアマップ
// ============================================================

// --- グローバル変数 ---
let currentStage = 1;
let gameMode = '';
let playerMaxHP = 30;
let playerHP = playerMaxHP;
let currentEnemy = {};
let enemyMaxHP = 10;
let enemyHP = enemyMaxHP;
let problems = [];
let currentProblemIndex = 0;
let questionStartTime;
let battleInProgress = false;
let comboCount = 0;
let questionsForThisStage = 15;
const HIGHEST_STAGE_KEY_PREFIX = 'nekobattle_highestStage_';
let highestClearedStage = 0;

// トレーニング用変数
let trainingType = '';
let trainingTimeLimit = 50;
let trainingTimeRemaining = trainingTimeLimit;
let trainingScore = 0;
let trainingTimerInterval = null;
const BEST_SCORE_KEY_PREFIX = 'nekobattle_bestScore_';
let currentTrainingProblem = null;
let comboDisplayTimeoutId = null;

// ★新機能: 必殺技ゲージ
let skillGauge = 0;
const SKILL_GAUGE_MAX = 100;
const SKILL_DAMAGE_RATIO = 0.30; // 敵最大HPの30%

// ★新機能: アイテムシステム
let playerItems = [];
const MAX_ITEMS = 3;
let hasBarrier = false; // バリア有効中フラグ
let hasSpeedBoost = false; // スピードブースト有効中フラグ

// ★新機能: タイマー攻撃システム
let enemyAttackTimerId = null;
let enemyAttackWarningTimerId = null;
let enemyAttackCount = 0; // 1バトル中の攻撃回数（加速用）

// ★バグ修正: ゲーム内setTimeoutの一括管理（画面遷移時にクリア可能にする）
let pendingGameTimeouts = [];

// ★新機能: HP持ち越しシステム
let carryOverHP = -1; // -1 = 持ち越しなし（新エリア or 初回）
let lastAreaIndex = -1; // 前回のエリアindex

const ITEM_DEFS = [
    { id: 'herb', name: 'やくそう', emoji: '🌿', desc: 'HPを8かいふく' },
    { id: 'barrier', name: 'バリア', emoji: '🛡️', desc: 'つぎの1かいミスをふせぐ' },
    { id: 'boots', name: 'スピードブーツ', emoji: '👟', desc: 'つぎの1もん じかんにゆとり' }
];

// ★新機能: にゃんたろう進化
const PLAYER_FORMS = [
    { minStage: 1,  emoji: '😺',    name: 'にゃんたろう' },
    { minStage: 11, emoji: '😺⚔️', name: 'けんしねこ' },
    { minStage: 21, emoji: '😺🛡️', name: 'ナイトねこ' },
    { minStage: 31, emoji: '😺🔮', name: 'まほうねこ' },
    { minStage: 41, emoji: '😺✨', name: 'ゆうしゃねこ' },
    { minStage: 51, emoji: '😺🐉', name: 'りゅうきしねこ' }
];

// ★新機能: エリアマップ
const AREA_DATA = [
    { name: 'ほのおのどうくつ', emoji: '🔥', color: '#ef5350', stageMin: 1, stageMax: 10, boss: 'ファイヤードレイク' },
    { name: 'あらしのさんみゃく', emoji: '⚡', color: '#7e57c2', stageMin: 11, stageMax: 20, boss: 'ヴリトラ' },
    { name: 'しんかいのしんでん', emoji: '🌊', color: '#29b6f6', stageMin: 21, stageMax: 30, boss: 'レヴィアタン' },
    { name: 'おうごんのめいきゅう', emoji: '💰', color: '#ffa726', stageMin: 31, stageMax: 40, boss: 'ファフニール' },
    { name: 'てんくうのしろ', emoji: '⭐', color: '#66bb6a', stageMin: 41, stageMax: 50, boss: 'バハムート' },
    { name: 'あんこくのぎょくざ', emoji: '🐉', color: '#424242', stageMin: 51, stageMax: 60, boss: 'アジ・ダハーカ' }
];

// トレーニング用敵キャラリスト
const trainingEnemies = ["🦎","🔥","🦅","⚡","🦈","🌊","💎","🛡️","⭐","🌌","🐉"];

// --- DOM要素取得 ---
const modeSelectScreen = document.getElementById("modeSelectScreen");
const trainingModeBtn = document.getElementById("trainingModeBtn");
const startMethodScreen = document.getElementById("startMethodScreen");
const startFromBeginningBtn = document.getElementById("startFromBeginningBtn");
const continueFromLastBtn = document.getElementById("continueFromLastBtn");
const areaMapScreen = document.getElementById("areaMapScreen");
const areaMapGrid = document.getElementById("areaMapGrid");
const mapPlayerInfo = document.getElementById("mapPlayerInfo");
const mapStartBattleBtn = document.getElementById("mapStartBattleBtn");
const battleScreen = document.getElementById("battleScreen");
const startBtn = document.getElementById("startBtn");
const questionDiv = document.getElementById("question");
const answerChoicesDiv = document.getElementById("answerChoices");
const battleLog = document.getElementById("battleLog");
const enemyArea = document.getElementById("enemyArea");
const enemyName = document.getElementById("enemyName");
const enemyHPText = document.getElementById("enemyHPText");
const enemyHPBar = document.getElementById("enemyHPBar");
const enemyCharacter = document.getElementById("enemyCharacter");
const playerArea = document.getElementById("playerArea");
const playerHPText = document.getElementById("playerHPText");
const playerHPBar = document.getElementById("playerHPBar");
const playerCharacter = document.getElementById("playerCharacter");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const feedbackDisplay = document.getElementById("feedbackDisplay");
const comboDisplay = document.getElementById("comboDisplay");
const bgmToggleBtn = document.getElementById("bgmToggleBtn");
const damageEffectContainer = document.getElementById('damageEffectContainer');
const skillGaugeBar = document.getElementById("skillGaugeBar");
const skillGaugeContainer = document.getElementById("skillGaugeContainer");
const skillBtn = document.getElementById("skillBtn");
const itemSlotsDiv = document.getElementById("itemSlots");

// トレーニング関連DOM
const trainingTypeSelectScreen = document.getElementById("trainingTypeSelectScreen");
const trainingScreen = document.getElementById("trainingScreen");
const trainingTimer = document.getElementById("trainingTimer");
const trainingScoreDisplay = document.getElementById("trainingScore");
const trainingEnemyDisplay = document.getElementById("trainingEnemyDisplay");
const trainingQuestion = document.getElementById("trainingQuestion");
const trainingAnswerChoices = document.getElementById("trainingAnswerChoices");
const trainingResultScreen = document.getElementById("trainingResultScreen");
const finalScore = document.getElementById("finalScore");
const personalBest = document.getElementById("personalBest");
const retryTrainingBtn = document.getElementById("retryTrainingBtn");
const backToModeSelectBtn = document.getElementById("backToModeSelectBtn");
const backToModeSelectBtnFromTraining = document.getElementById("backToModeSelectBtnFromTraining");
const quitTrainingBtn = document.getElementById("quitTrainingBtn");

const bossDefeatedOverlay = document.getElementById('bossDefeatedOverlay');
const bossDefeatedMessage = document.getElementById('bossDefeatedMessage');

// 進化演出オーバーレイ
const evolutionOverlay = document.getElementById('evolutionOverlay');
const evolutionMessage = document.getElementById('evolutionMessage');

// --- BGMボタン ---
bgmToggleBtn.addEventListener('click', () => {
    isBgmEnabled = !isBgmEnabled;
    localStorage.setItem(BGM_KEY, JSON.stringify(isBgmEnabled));
    updateBgmButton(bgmToggleBtn);
    if (isBgmEnabled) {
        if (!currentBgm && (gameMode === 'grade1' || gameMode === 'grade4' || gameMode === 'training')) {
            if (gameMode === 'training') playBgm('bgmTraining');
            else if (currentEnemy && currentEnemy.type) {
                const areaNum = getAreaIndex(currentStage) + 1;
                if (currentEnemy.type === 'boss') playBgmWithFallback(`bgmBoss${areaNum}`, 'bgmBoss');
                else playBgmWithFallback(`bgmArea${areaNum}`, 'bgmNormal');
            }
        }
    } else { stopBgm(); }
    playSound('tap');
});

// --- localStorage ---
function getHighestStageKey(mode) { return `${HIGHEST_STAGE_KEY_PREFIX}${mode}_v2`; }
function saveHighestStage(mode, stage) { const key = getHighestStageKey(mode); const cur = loadHighestStage(mode); if (stage > cur && stage <= maxStage) localStorage.setItem(key, stage.toString()); }
function loadHighestStage(mode) { const key = getHighestStageKey(mode); const s = localStorage.getItem(key); return s ? parseInt(s, 10) : 0; }
function getBestScoreKey(type) { return `${BEST_SCORE_KEY_PREFIX}${type}`; }
function saveBestScore(type, score) { const key = getBestScoreKey(type); const cur = loadBestScore(type); if (score > cur) { localStorage.setItem(key, score.toString()); return true; } return false; }
function loadBestScore(type) { const key = getBestScoreKey(type); const s = localStorage.getItem(key); return s ? parseInt(s, 10) : 0; }

// ============================================================
// ★ にゃんたろう進化
// ============================================================
function getPlayerForm(stage) {
    let form = PLAYER_FORMS[0];
    for (const f of PLAYER_FORMS) {
        if (stage >= f.minStage) form = f;
    }
    return form;
}

function updatePlayerDisplay() {
    const form = getPlayerForm(currentStage);
    playerCharacter.textContent = form.emoji;
    if (playerNameDisplay) playerNameDisplay.textContent = form.name;
}

function showEvolutionIfNeeded(oldStage, newStage) {
    const oldForm = getPlayerForm(oldStage);
    const newForm = getPlayerForm(newStage);
    if (oldForm.minStage !== newForm.minStage && evolutionOverlay) {
        evolutionMessage.textContent = `${newForm.emoji} しんか！ ${newForm.name} になった！`;
        evolutionOverlay.style.display = 'flex';
        evolutionOverlay.style.opacity = '1';
        evolutionMessage.style.opacity = '1';
        evolutionMessage.style.transform = 'scale(1)';
        playSound('evolution');
        setTimeout(() => {
            evolutionOverlay.style.opacity = '0';
            setTimeout(() => evolutionOverlay.style.display = 'none', 500);
        }, 2500);
    }
}

// ============================================================
// ★ エリアマップ
// ============================================================
function getAreaIndex(stage) {
    for (let i = 0; i < AREA_DATA.length; i++) {
        if (stage >= AREA_DATA[i].stageMin && stage <= AREA_DATA[i].stageMax) return i;
    }
    return AREA_DATA.length - 1;
}

function renderAreaMap() {
    areaMapGrid.innerHTML = '';
    const areaIdx = getAreaIndex(currentStage);
    AREA_DATA.forEach((area, i) => {
        const div = document.createElement('div');
        div.className = 'area-card';
        const isCleared = currentStage > area.stageMax;
        const isCurrent = (i === areaIdx);
        const isLocked = currentStage < area.stageMin;

        if (isCleared) div.classList.add('area-cleared');
        else if (isCurrent) div.classList.add('area-current');
        else if (isLocked) div.classList.add('area-locked');

        div.style.borderColor = area.color;
        if (isCurrent) div.style.boxShadow = `0 0 15px ${area.color}80`;

        const progress = isCleared ? '✓ クリア' : isCurrent ? `Lv${currentStage} / ${area.stageMax}` : '🔒';
        div.innerHTML = `
            <div class="area-emoji">${area.emoji}</div>
            <div class="area-name">${area.name}</div>
            <div class="area-progress">${progress}</div>
            ${isCurrent ? `<div class="area-boss">ボス: ${area.boss}</div>` : ''}
        `;
        areaMapGrid.appendChild(div);
    });

    const form = getPlayerForm(currentStage);
    const currentAreaIdx = getAreaIndex(currentStage);
    const nextEnemy = enemies[currentStage] || enemies[maxStage];
    const isBossNext = nextEnemy && nextEnemy.type === 'boss';
    const currentHP = (currentAreaIdx === lastAreaIndex && carryOverHP > 0) ? carryOverHP : playerMaxHP;
    const hpDisplay = isBossNext ? Math.min(playerMaxHP, currentHP + 10) : currentHP;
    const bossHealNote = (isBossNext && currentAreaIdx === lastAreaIndex && carryOverHP > 0 && carryOverHP < playerMaxHP) ? ' (ボス戦はHP+10回復！)' : '';
    mapPlayerInfo.innerHTML = `${form.emoji} ${form.name}  Lv${currentStage} &nbsp; ❤️ ${hpDisplay}/${playerMaxHP}${bossHealNote}`;
    mapStartBattleBtn.textContent = `⚔️ たたかう！ (Lv${currentStage})`;
}

function showAreaMap() {
    hideAllScreens();
    areaMapScreen.style.display = 'flex';
    renderAreaMap();
}

// ============================================================
// ★ タイマー攻撃システム
// ============================================================
function getEnemyAttackTiming() {
    // 警告表示までの時間(ms) と 警告から攻撃までの時間(ms) を返す
    let warningDelay, attackDelay;
    const isBoss = currentEnemy && currentEnemy.type === 'boss';

    if (gameMode === 'grade1') {
        warningDelay = isBoss ? 10000 : 12000;
        attackDelay = 3000;
    } else {
        warningDelay = isBoss ? 8000 : 10000;
        attackDelay = 2500;
    }

    // 攻撃回数が増えるとわずかに加速（最大10%短縮）
    const speedUp = Math.max(0.9, 1.0 - enemyAttackCount * 0.015);
    warningDelay = Math.floor(warningDelay * speedUp);
    attackDelay = Math.floor(attackDelay * speedUp);

    return { warningDelay, attackDelay };
}

function getEnemyAttackDamage() {
    const isBoss = currentEnemy && currentEnemy.type === 'boss';
    if (gameMode === 'grade1') return isBoss ? 2 : 1;
    return isBoss ? 3 : 2;
}

function startEnemyAttackTimer() {
    clearEnemyAttackTimer();
    if (playerHP > 0 && enemyHP > 0) {
        const timing = getEnemyAttackTiming();
        // 警告タイマー
        enemyAttackWarningTimerId = setTimeout(() => {
            if (playerHP <= 0 || enemyHP <= 0) return;
            showEnemyAttackWarning();
            // 攻撃タイマー
            enemyAttackTimerId = setTimeout(() => {
                if (playerHP <= 0 || enemyHP <= 0) return;
                executeEnemyAttack();
            }, timing.attackDelay);
        }, timing.warningDelay);
    }
}

function clearEnemyAttackTimer() {
    if (enemyAttackWarningTimerId) { clearTimeout(enemyAttackWarningTimerId); enemyAttackWarningTimerId = null; }
    if (enemyAttackTimerId) { clearTimeout(enemyAttackTimerId); enemyAttackTimerId = null; }
    // 警告表示を消す
    const warningEl = document.getElementById('enemyAttackWarning');
    if (warningEl) warningEl.style.display = 'none';
}

// ★バグ修正: 管理対象setTimeoutのラッパー（バトル中断時に一括クリア可能）
function setGameTimeout(callback, delay) {
    const id = setTimeout(() => {
        // 実行されたら管理リストから除去
        pendingGameTimeouts = pendingGameTimeouts.filter(t => t !== id);
        callback();
    }, delay);
    pendingGameTimeouts.push(id);
    return id;
}

function clearAllGameTimeouts() {
    pendingGameTimeouts.forEach(id => clearTimeout(id));
    pendingGameTimeouts = [];
}

function showEnemyAttackWarning() {
    const warningEl = document.getElementById('enemyAttackWarning');
    if (warningEl) {
        warningEl.style.display = 'block';
        warningEl.textContent = `⚠️ ${currentEnemy.name} が こうげきじゅんび中...！`;
        playSound('enemyAttackWarning');
    }
}

function executeEnemyAttack() {
    const warningEl = document.getElementById('enemyAttackWarning');
    if (warningEl) warningEl.style.display = 'none';

    if (playerHP <= 0 || enemyHP <= 0 || battleInProgress) return;

    // バリアチェック
    if (hasBarrier) {
        hasBarrier = false;
        renderItems();
        showFeedback('バリア！', 'perfect');
        battleLog.textContent = `🛡️ バリアで てきのこうげきを ふせいだ！`;
        playSound('barrierBlock');
        enemyAttackCount++;
        // 次のタイマー開始
        startEnemyAttackTimer();
        return;
    }

    const damage = getEnemyAttackDamage();
    playerHP = Math.max(0, playerHP - damage);
    playerHPText.textContent = playerHP;
    updateHPBar('playerHPBar', playerHP, playerMaxHP);

    shakeCharacter('playerCharacter');
    playSound('enemyAttack');
    showFeedback(`-${damage} HP`, 'wrong');
    battleLog.textContent = `💥 ${currentEnemy.name} の こうげき！ ${damage} ダメージ！`;
    document.body.classList.add('feedback-wrong');
    setTimeout(() => document.body.classList.remove('feedback-wrong'), 150);

    enemyAttackCount++;

    // ★HP低下警告音
    if (playerHP > 0 && playerHP <= Math.floor(playerMaxHP * 0.3)) {
        playSound('hpLow');
    }

    if (playerHP <= 0) {
        endBattle();
    } else {
        // 次のタイマー開始
        startEnemyAttackTimer();
    }
}

// ============================================================
// ★ 必殺技システム
// ============================================================
function updateSkillGauge() {
    if (!skillGaugeBar) return;
    const pct = Math.min(100, Math.floor((skillGauge / SKILL_GAUGE_MAX) * 100));
    skillGaugeBar.style.width = pct + '%';

    if (skillGauge >= SKILL_GAUGE_MAX) {
        skillGaugeBar.classList.add('skill-ready');
        if (skillBtn) { skillBtn.style.display = 'inline-block'; skillBtn.classList.add('skill-pulse'); }
    } else {
        skillGaugeBar.classList.remove('skill-ready');
        if (skillBtn) { skillBtn.style.display = 'none'; skillBtn.classList.remove('skill-pulse'); }
    }
}

function useSkill() {
    if (skillGauge < SKILL_GAUGE_MAX || battleInProgress) return;
    battleInProgress = true;
    clearEnemyAttackTimer();
    skillGauge = 0;
    updateSkillGauge();

    const skillDamage = Math.max(10, Math.floor(enemyMaxHP * SKILL_DAMAGE_RATIO));
    enemyHP = Math.max(0, enemyHP - skillDamage);
    enemyHPText.textContent = enemyHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP);

    showFeedback('ひっさつわざ！', 'critical');
    showDamageEffect(skillDamage, true);
    shakeCharacter('enemyCharacter');
    playSound('hitCritical', 1.2);
    playSound('voiceSkill');
    battleLog.textContent = `⚡ ひっさつわざ！ てきに ${skillDamage} だいダメージ！`;

    document.body.classList.add('feedback-flash');
    setTimeout(() => document.body.classList.remove('feedback-flash'), 200);

    setGameTimeout(() => {
        if (enemyHP <= 0) endBattle();
        else { battleInProgress = false; startEnemyAttackTimer(); }
    }, 1200);
}

// ============================================================
// ★ アイテムシステム
// ============================================================
function renderItems() {
    if (!itemSlotsDiv) return;
    itemSlotsDiv.innerHTML = '';
    playerItems.forEach((item, idx) => {
        const btn = document.createElement('button');
        btn.className = 'item-btn';
        btn.textContent = item.emoji;
        btn.title = `${item.name}: ${item.desc}`;
        btn.onclick = () => useItem(idx);
        itemSlotsDiv.appendChild(btn);
    });
    // 空スロット表示
    for (let i = playerItems.length; i < MAX_ITEMS; i++) {
        const empty = document.createElement('span');
        empty.className = 'item-slot-empty';
        empty.textContent = '·';
        itemSlotsDiv.appendChild(empty);
    }
}

function useItem(idx) {
    if (idx >= playerItems.length) return;
    const item = playerItems[idx];

    switch (item.id) {
        case 'herb':
            playSound('heal');
            const heal = Math.min(8, playerMaxHP - playerHP);
            playerHP = Math.min(playerMaxHP, playerHP + heal);
            playerHPText.textContent = playerHP;
            updateHPBar('playerHPBar', playerHP, playerMaxHP);
            showFeedback(`+${heal} HP`, 'great');
            battleLog.textContent = `🌿 やくそうで ${heal} かいふく！`;
            break;
        case 'barrier':
            if (hasBarrier) {
                showFeedback('もうはってある！', 'good');
                battleLog.textContent = '🛡️ バリアは もうはってあるよ！';
                return; // アイテム消費しない
            }
            playSound('barrierBlock');
            hasBarrier = true;
            showFeedback('バリア！', 'perfect');
            battleLog.textContent = '🛡️ バリアはった！つぎのミスをふせぐ！';
            break;
        case 'boots':
            playSound('heal');
            hasSpeedBoost = true;
            showFeedback('スピードUP！', 'perfect');
            battleLog.textContent = '👟 スピードブーツ！つぎのもんだい じかんにゆとり！';
            break;
    }

    playerItems.splice(idx, 1);
    renderItems();
}

function tryDropItem() {
    if (playerItems.length >= MAX_ITEMS) return;
    const dropChance = (currentEnemy.type === 'boss') ? 1.0 : 0.35;
    if (Math.random() < dropChance) {
        const itemDef = ITEM_DEFS[Math.floor(Math.random() * ITEM_DEFS.length)];
        playerItems.push({ ...itemDef });
        renderItems();
        playSound('itemDrop');
        return itemDef;
    }
    return null;
}

// ============================================================
// 難易度調整: 目標タイム
// ============================================================
function getProblemTimeLimit(mode, type, qText) {
    let targetTime = 5.0;
    let holeBonus = 1.0;

    if (mode === 'grade1') {
        // 2年生レベル前提: iPad操作時間を考慮し余裕を持たせる
        const isHard = /[1-9][0-9]/.test(qText);
        targetTime = isHard ? 7.5 : 2.5;
    } else if (mode === 'grade4') {
        // 5年生レベル前提: 四則演算を素早く処理できる
        if (type === '+' || type === '-') targetTime = 4.5;
        else if (type === '×') targetTime = 3.5;
        else if (type === '÷') targetTime = 4.0;
    } else {
        // トレーニングモード: バトルよりやや余裕を持たせる
        if (type === '+' || type === '-') targetTime = /[1-9][0-9]/.test(qText) ? 5.0 : 2.5;
        else targetTime = 3.0;
    }

    if (qText.includes('□')) targetTime += holeBonus;

    // ★スピードブーツ効果: 制限時間1.4倍
    if (hasSpeedBoost) targetTime *= 1.4;

    return [
        targetTime * 0.7,
        targetTime * 0.9,
        targetTime * 1.1,
        999
    ];
}

// ============================================================
// 問題生成
// ============================================================
function generateProblems(stage, mode, count) {
    const gen = [];
    let num1, num2;
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function createProblem(op, n1, n2, ans) { return { q: `${n1} ${op} ${n2}`, a: ans, type: op }; }
    function createHole(n1, opStr, n2, ans) {
        return Math.random() < 0.5
          ? { q: `□ ${opStr} ${n2} = ${ans}`, a: n1, type: opStr }
          : { q: `${n1} ${opStr} □ = ${ans}`, a: n2, type: opStr };
    }

    for (let i = 0; i < count; i++) {
        try {
            let pType = '';
            if (mode === 'grade1') {
                // 2年生レベル前提: 1桁→2桁への移行を緩やかに
                // Lv1-10:  1桁の計算のみ（ウォームアップ）
                // Lv11-20: 1桁に穴あきを導入
                // Lv21-30: 2桁を少しずつ混ぜる（急激にしない）
                // Lv31-40: 2桁中心、穴あきも少し導入
                // Lv41-50: 全タイプ混合
                // Lv51-60: 2桁中心の総合問題
                if (stage <= 10) pType = 'easy_calc';
                else if (stage <= 20) pType = Math.random() < 0.5 ? 'easy_calc' : 'easy_hole';
                else if (stage <= 30) {
                    const r = Math.random();
                    if (r < 0.35) pType = 'easy_calc';
                    else if (r < 0.55) pType = 'easy_hole';
                    else pType = 'normal_calc'; // 45%→2桁（緩やかに導入）
                } else if (stage <= 40) {
                    const r = Math.random();
                    if (r < 0.15) pType = 'easy_calc';
                    else if (r < 0.30) pType = 'easy_hole';
                    else if (r < 0.70) pType = 'normal_calc';
                    else pType = 'normal_hole'; // 30%→2桁穴あき（段階的に導入）
                } else if (stage <= 50) {
                    const r = Math.random();
                    if (r < 0.15) pType = 'easy_calc';
                    else if (r < 0.30) pType = 'easy_hole';
                    else if (r < 0.60) pType = 'normal_calc';
                    else pType = 'normal_hole';
                } else {
                    const r = Math.random();
                    if (r < 0.10) pType = 'easy_calc';
                    else if (r < 0.20) pType = 'easy_hole';
                    else if (r < 0.60) pType = 'normal_calc';
                    else pType = 'normal_hole';
                }
                if (pType.includes('easy')) {
                    const isAdd = Math.random() < 0.6;
                    if (isAdd) { num1 = randInt(1, 9); num2 = randInt(1, 10 - num1); gen.push(pType === 'easy_calc' ? createProblem('+', num1, num2, num1+num2) : createHole(num1, '+', num2, num1+num2)); }
                    else { num1 = randInt(2, 10); num2 = randInt(1, num1 - 1); gen.push(pType === 'easy_calc' ? createProblem('-', num1, num2, num1-num2) : createHole(num1, '-', num2, num1-num2)); }
                } else {
                    const isAdd = Math.random() < 0.6;
                    if (isAdd) { num1 = randInt(10, 89); num2 = randInt(10, 99 - num1); gen.push(pType === 'normal_calc' ? createProblem('+', num1, num2, num1+num2) : createHole(num1, '+', num2, num1+num2)); }
                    else { num1 = randInt(20, 99); num2 = randInt(10, num1); gen.push(pType === 'normal_calc' ? createProblem('-', num1, num2, num1-num2) : createHole(num1, '-', num2, num1-num2)); }
                }
            } else if (mode === 'grade4') {
                // 5年生レベル前提: 九九→割り算→四則混合→穴あきの滑らかな曲線
                // Lv1-10:  掛け算（九九）のみ
                // Lv11-20: 掛け算＋割り算
                // Lv21-30: 四則混合（掛け割り維持＋足し引き追加、難易度の谷を防止）
                // Lv31-40: 穴あきを段階的に導入（通常問題も残す）
                // Lv41-50: 穴あき中心の混合
                // Lv51-60: 全タイプ均等の総合問題
                if (stage <= 10) pType = 'mul';
                else if (stage <= 20) pType = Math.random() < 0.5 ? 'mul' : 'div';
                else if (stage <= 30) {
                    const r = Math.random();
                    if (r < 0.30) pType = 'mul';
                    else if (r < 0.55) pType = 'div';
                    else pType = 'normal_calc'; // 足し引きは補助的に
                } else if (stage <= 40) {
                    const r = Math.random();
                    if (r < 0.20) pType = 'mul';
                    else if (r < 0.40) pType = 'div';
                    else if (r < 0.55) pType = 'mul_hole';
                    else if (r < 0.70) pType = 'div_hole';
                    else if (r < 0.85) pType = 'normal_calc';
                    else pType = 'normal_hole';
                } else if (stage <= 50) {
                    const r = Math.random();
                    if (r < 0.15) pType = 'normal_calc';
                    else if (r < 0.35) pType = 'normal_hole';
                    else if (r < 0.50) pType = 'mul';
                    else if (r < 0.65) pType = 'mul_hole';
                    else if (r < 0.80) pType = 'div';
                    else pType = 'div_hole';
                } else {
                    const r = Math.random();
                    if (r < 0.12) pType = 'normal_calc';
                    else if (r < 0.28) pType = 'normal_hole';
                    else if (r < 0.42) pType = 'mul';
                    else if (r < 0.58) pType = 'mul_hole';
                    else if (r < 0.72) pType = 'div';
                    else pType = 'div_hole';
                }

                if (pType.includes('normal')) {
                    const isAdd = Math.random() < 0.5;
                    if (isAdd) { num1 = randInt(10, 89); num2 = randInt(10, 99 - num1); gen.push(pType === 'normal_calc' ? createProblem('+', num1, num2, num1+num2) : createHole(num1, '+', num2, num1+num2)); }
                    else { num1 = randInt(20, 99); num2 = randInt(10, num1 - 10); gen.push(pType === 'normal_calc' ? createProblem('-', num1, num2, num1-num2) : createHole(num1, '-', num2, num1-num2)); }
                } else if (pType.includes('mul')) {
                    num1 = randInt(2, 9); num2 = randInt(2, 9);
                    gen.push(pType === 'mul' ? createProblem('×', num1, num2, num1*num2) : createHole(num1, '×', num2, num1*num2));
                } else {
                    const ans = randInt(2, 9); num2 = randInt(2, 9);
                    gen.push(pType === 'div' ? createProblem('÷', ans*num2, num2, ans) : createHole(ans*num2, '÷', num2, ans));
                }
            }
        } catch(e) { gen.push({q:"1+1", a:2, type:'+'}); }
    }
    return gen;
}

function generateChoices(correct) {
    const choices = new Set(); correct = Math.round(correct); choices.add(correct);
    let att = 0; while (choices.size < 4 && att < 50) { let d = Math.floor(Math.random() * 20) - 10; if (d === 0) d = 1; let w = correct + d; if (w >= 0 && !choices.has(w)) choices.add(w); att++; }
    let f = 1; while (choices.size < 4) { let w1 = Math.max(0, correct + f), w2 = Math.max(0, correct - f); if (!choices.has(w1)) choices.add(w1); if (choices.size < 4 && !choices.has(w2)) choices.add(w2); f++; }
    return Array.from(choices).sort(() => Math.random() - 0.5);
}

// ============================================================
// UI ヘルパー
// ============================================================
function updateHPBar(id, current, max) { document.getElementById(id).style.width = `${Math.max(0, (current / max) * 100)}%`; }
function shakeCharacter(id) { const el = document.getElementById(id); el.classList.add('shake-animation'); setTimeout(() => el.classList.remove('shake-animation'), 200); }
function showFeedback(text, type) { feedbackDisplay.textContent = text; feedbackDisplay.className = 'show ' + type; setTimeout(() => feedbackDisplay.className = '', 800); }

function updateComboDisplay() {
    if (comboDisplayTimeoutId) { clearTimeout(comboDisplayTimeoutId); comboDisplayTimeoutId = null; }
    if (comboCount >= 3) {
        comboDisplay.textContent = `${comboCount} Combo!`;
        comboDisplay.className = comboCount >= 9 ? 'amazing-combo show' : (comboCount >= 6 ? 'great-combo show' : 'show');
        comboDisplayTimeoutId = setTimeout(() => { comboDisplay.classList.remove('show'); comboDisplayTimeoutId = null; }, 1500);
    } else { comboDisplay.classList.remove('show'); }
}

function showDamageEffect(damage, isCritical) {
    const el = document.createElement('span'); el.textContent = `-${damage}`; el.className = isCritical ? 'damage-popup critical-damage' : 'damage-popup';
    el.style.left = `calc(50% + ${Math.random()*40-20}px)`; damageEffectContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) damageEffectContainer.removeChild(el); }, 800);
}

function hideAllScreens() {
    [modeSelectScreen, startMethodScreen, areaMapScreen, battleScreen, trainingTypeSelectScreen, trainingScreen, trainingResultScreen].forEach(s => { if (s) s.style.display = 'none'; });
    // オーバーレイも確実に消す
    if (bossDefeatedOverlay) bossDefeatedOverlay.style.display = 'none';
    if (evolutionOverlay) evolutionOverlay.style.display = 'none';
}

// ============================================================
// 問題表示
// ============================================================
function showQuestion() {
    battleInProgress = false;
    if (currentProblemIndex >= questionsForThisStage || playerHP <= 0 || enemyHP <= 0) { endBattle(); return; }

    // タイマー攻撃リセット＆開始
    clearEnemyAttackTimer();
    startEnemyAttackTimer();

    const p = problems[currentProblemIndex];
    questionDiv.textContent = p.q;
    questionStartTime = Date.now();

    let currentMultiplier = comboCount >= 10 ? 1.2 : (comboCount >= 5 ? 1.1 : (comboCount >= 2 ? 1.05 : 1.0));
    battleLog.textContent = `Lv${currentStage} (${currentProblemIndex + 1}/${questionsForThisStage})${comboCount>=2 ? ` (x${currentMultiplier})` : ''}`;

    const choices = generateChoices(p.a);
    answerChoicesDiv.innerHTML = "";
    choices.forEach(c => {
        const btn = document.createElement("button"); btn.textContent = c; btn.className = "choice-btn";
        btn.onclick = () => handleAnswer(c); answerChoicesDiv.appendChild(btn);
    });
}

// ============================================================
// 回答処理
// ============================================================
function handleAnswer(selectedAnswer) {
    if (battleInProgress) return; battleInProgress = true;
    clearEnemyAttackTimer(); // 回答したらタイマーリセット
    answerChoicesDiv.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    playSound('tap');
    const elapsed = (Date.now() - questionStartTime) / 1000;
    const p = problems[currentProblemIndex];
    const [criticalTime, perfectTime, greatTime] = getProblemTimeLimit(gameMode, p.type, p.q);

    // スピードブースト消費
    if (hasSpeedBoost) hasSpeedBoost = false;

    let baseDamage = 10, damageToEnemy = 0, damageToPlayer = 0;
    let logMessage = "", feedbackText = "", feedbackType = "", isCritical = false, speedBonus = 1.0;

    if (selectedAnswer === p.a) {
        comboCount++;

        if (elapsed < criticalTime) {
            feedbackText = "Critical!!"; feedbackType = "critical"; isCritical = true; speedBonus = 1.5;
            skillGauge = Math.min(SKILL_GAUGE_MAX, skillGauge + 20);
        } else if (elapsed < perfectTime) {
            feedbackText = "Perfect!"; feedbackType = "perfect"; speedBonus = 1.2;
            skillGauge = Math.min(SKILL_GAUGE_MAX, skillGauge + 12);
        } else if (elapsed <= greatTime) {
            feedbackText = "Great!"; feedbackType = "great"; speedBonus = 1.0;
            skillGauge = Math.min(SKILL_GAUGE_MAX, skillGauge + 8);
        } else {
            feedbackText = "Good"; feedbackType = "good"; speedBonus = 0.8;
            skillGauge = Math.min(SKILL_GAUGE_MAX, skillGauge + 4);
            if (gameMode !== 'grade1') comboCount = Math.max(0, comboCount - 1);
        }

        let comboMul = 1.0;
        if (comboCount >= 10) comboMul = 1.2;
        else if (comboCount >= 5) comboMul = 1.1;
        else if (comboCount >= 2) comboMul = 1.05;

        damageToEnemy = Math.floor(baseDamage * speedBonus * comboMul);
        let pitch = 1.0 + (Math.min(comboCount, 10) * 0.05);
        playSound('correct', 1.0, 0.5);

        if (isCritical) {
            logMessage = `かいしんの いちげき！てきに ${damageToEnemy} ダメージ!`;
            playSound('hitCritical', pitch);
            if (Math.random() < 0.7) playSound('voiceSkill'); else playRandomAttackVoice();
        } else {
            if (feedbackType === "perfect") { logMessage = `てきに ${damageToEnemy} ダメージ!`; playSound('hitPerfect', pitch); }
            else if (feedbackType === "great") { logMessage = `てきに ${damageToEnemy} ダメージ!`; playSound('hitGreat', pitch); }
            else { logMessage = `スピードが たりない！${damageToEnemy} ダメージ`; playSound('hitGood', 0.6); }
            if (feedbackType !== "good") {
                if (comboCount >= 5 && Math.random() < 0.4) playSound('voiceSkill'); else playRandomAttackVoice();
            }
        }

        document.body.classList.add('feedback-flash'); setTimeout(() => document.body.classList.remove('feedback-flash'), 150);
        shakeCharacter('enemyCharacter'); showDamageEffect(damageToEnemy, isCritical);
        if (feedbackType !== "good" && comboCount > 0 && (comboCount % 5 === 0 || comboCount === 3)) playSound('comboMilestone');

    } else {
        // 不正解
        if (hasBarrier) {
            // バリアで防御！（コンボは維持）
            hasBarrier = false;
            logMessage = '🛡️ バリアで ふせいだ！';
            feedbackText = "バリア！"; feedbackType = "perfect";
            playSound('barrierBlock');
        } else {
            playSound('wrong'); damageToPlayer = 1;
            let healAmount = Math.max(1, Math.floor(enemyMaxHP * 0.05));
            if (enemyHP + healAmount > enemyMaxHP) healAmount = enemyMaxHP - enemyHP;
            enemyHP += healAmount;
            logMessage = `Miss! てきが ${healAmount} かいふくした...`;
            feedbackText = "Miss..."; feedbackType = "wrong"; comboCount = 0;
            document.body.classList.add('feedback-wrong'); setTimeout(() => document.body.classList.remove('feedback-wrong'), 150);
            shakeCharacter('playerCharacter'); playSound('hitPlayer');
            updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); enemyHPText.textContent = enemyHP;
        }
    }

    updateComboDisplay();
    updateSkillGauge();
    enemyHP = Math.max(0, enemyHP - damageToEnemy);
    playerHP = Math.max(0, playerHP - damageToPlayer);
    enemyHPText.textContent = enemyHP; playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); updateHPBar('playerHPBar', playerHP, playerMaxHP);
    battleLog.textContent = logMessage;
    if (feedbackText) showFeedback(feedbackText, feedbackType);
    // ★HP低下警告音（不正解ダメージ後もチェック）
    if (damageToPlayer > 0 && playerHP > 0 && playerHP <= Math.floor(playerMaxHP * 0.3)) {
        playSound('hpLow');
    }
    currentProblemIndex++;
    renderItems();
    setGameTimeout(() => { if (playerHP <= 0 || enemyHP <= 0 || currentProblemIndex >= questionsForThisStage) endBattle(); else showQuestion(); }, 1000);
}

// ============================================================
// バトル開始
// ============================================================
function startBattle() {
    currentEnemy = enemies[currentStage] || enemies[maxStage];
    questionsForThisStage = (currentEnemy.type === 'boss') ? 25 : 15;

    // ★敵HP: 必殺技による追加ダメージ(約30-50)を考慮して少し増量
    // 1年生モードは低学年のミス率を考慮して全体的に低めに設定
    let hpMultiplier = 1.0;
    if (gameMode === 'grade4') {
        // 5年生レベル: 正答率が高い前提でやや硬め
        if (currentStage <= 10) hpMultiplier = 0.66;
        else if (currentStage <= 20) hpMultiplier = 0.72;
        else if (currentStage <= 30) hpMultiplier = 0.77;
        else if (currentStage <= 40) hpMultiplier = 0.80;
        else if (currentStage <= 50) hpMultiplier = 0.84;
        else hpMultiplier = 0.88;
    } else {
        // 2年生レベル: 後半は2桁問題でミス率が上がるため、HP増加カーブを緩やかに
        if (currentStage <= 10) hpMultiplier = 0.55;
        else if (currentStage <= 20) hpMultiplier = 0.58;
        else if (currentStage <= 30) hpMultiplier = 0.61;
        else if (currentStage <= 40) hpMultiplier = 0.63;
        else if (currentStage <= 50) hpMultiplier = 0.65;
        else hpMultiplier = 0.67;
    }

    enemyMaxHP = Math.floor((questionsForThisStage * 10) * hpMultiplier);
    enemyHP = Math.max(5, enemyMaxHP);

    // ★HP持ち越しシステム: 同じエリア内ならHPを引き継ぐ
    const currentAreaIdx = getAreaIndex(currentStage);
    const isBossStage = (currentEnemy.type === 'boss');
    if (currentAreaIdx !== lastAreaIndex || carryOverHP < 0) {
        // 新エリアまたは初回 → HP全回復
        playerHP = playerMaxHP;
        carryOverHP = playerMaxHP;
    } else if (isBossStage) {
        // ★ボス戦突入時 → HP+10回復（全回復ではなく、エリアでの消耗が残る）
        playerHP = Math.min(playerMaxHP, Math.max(1, carryOverHP) + 10);
        carryOverHP = playerHP;
    } else {
        // 同じエリア → 持ち越しHP
        playerHP = Math.max(1, carryOverHP);
    }
    lastAreaIndex = currentAreaIdx;

    currentProblemIndex = 0; comboCount = 0;
    skillGauge = 0; hasBarrier = false; hasSpeedBoost = false;
    enemyAttackCount = 0; // タイマー攻撃カウントリセット
    clearEnemyAttackTimer();
    updateSkillGauge(); updateComboDisplay(); renderItems();

    problems = generateProblems(currentStage, gameMode, questionsForThisStage);
    updatePlayerDisplay();
    enemyName.textContent = `${currentEnemy.emoji} ${currentEnemy.name} (Lv${currentStage})`;
    enemyHPText.textContent = enemyHP; playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); updateHPBar('playerHPBar', playerHP, playerMaxHP);
    enemyCharacter.textContent = currentEnemy.emoji; enemyCharacter.classList.remove('defeated');
    stopBgm();

    // ★エリア別BGM再生
    const areaNum = getAreaIndex(currentStage) + 1; // 1-6
    if (currentEnemy.type === 'boss') {
        document.body.classList.add('boss-battle-bg');
        battleLog.textContent = `🔥【ボス】${currentEnemy.name} あらわれた！🔥`;
        playBgmWithFallback(`bgmBoss${areaNum}`, 'bgmBoss');
        setTimeout(() => { if (Math.random() < 0.5) playSound('voiceBoss1'); else playSound('voiceBoss2'); }, 500);
    } else {
        document.body.classList.remove('boss-battle-bg');
        battleLog.textContent = `Lv${currentStage} ${currentEnemy.name} が あらわれた！`;
        playBgmWithFallback(`bgmArea${areaNum}`, 'bgmNormal');
    }
    startBtn.style.display = "none"; battleInProgress = false;
    setGameTimeout(showQuestion, 1500);
}

// ============================================================
// バトル終了
// ============================================================
function endBattle() {
    battleInProgress = true; answerChoicesDiv.innerHTML = ""; questionDiv.textContent = "Battle End!";
    comboDisplay.classList.remove('show'); stopBgm();
    clearEnemyAttackTimer(); // タイマー攻撃停止
    clearAllGameTimeouts(); // ★保留中のゲームタイマーも全クリア
    if (skillBtn) skillBtn.style.display = 'none';

    let isVictory = enemyHP <= 0;
    if (isVictory) {
        enemyCharacter.classList.add('defeated'); playSound('enemyDefeated');

        // アイテムドロップ判定
        const dropped = tryDropItem();

        if (currentEnemy.type === 'boss') {
            playSound('areaClear');
            setTimeout(() => playSound('voiceWin'), 1000);
            bossDefeatedMessage.textContent = `🎉 ${currentEnemy.name} げきは！ 🎉`;
            bossDefeatedOverlay.style.display = 'flex'; bossDefeatedOverlay.style.opacity = '1';
            bossDefeatedMessage.style.opacity = '1'; bossDefeatedMessage.style.transform = 'scale(1)';
            setTimeout(() => { bossDefeatedOverlay.style.opacity = '0'; setTimeout(() => bossDefeatedOverlay.style.display = 'none', 500); }, 3000);
            battleLog.textContent = `すごい！ボス ${currentEnemy.name} を たおした！🏆`;
        } else {
            let msg = `🎉やったー！ ${currentEnemy.name} をたおした！🎉`;
            if (dropped) msg += ` ${dropped.emoji}${dropped.name} ゲット！`;
            battleLog.textContent = msg;
        }

        // ★HP持ち越し: 勝利時の残りHPを保存（+2回復ボーナス）
        playerHP = Math.min(playerMaxHP, playerHP + 2);
        carryOverHP = playerHP;

        const oldStage = currentStage;
        saveHighestStage(gameMode, currentStage);
        currentStage++;

        if (currentStage > maxStage) {
            battleLog.textContent += " 🏆ぜんクリア！すごい！";
            startBtn.textContent = "🏠 モードせんたくへ";
            startBtn.style.display = "inline-block";
            startBtn.onclick = () => {
                playSound('tap');
                document.body.className = '';
                showModeSelect();
                startBtn.onclick = defaultStartBtnHandler;
            };
        } else {
            // 進化チェック
            showEvolutionIfNeeded(oldStage, currentStage);
            // マップへ戻るボタン
            startBtn.textContent = `🗺️ マップへ`;
            startBtn.style.display = "inline-block";
            startBtn.onclick = () => {
                playSound('tap');
                document.body.className = '';
                hideAllScreens();
                showAreaMap();
                // onclickを元に戻す
                startBtn.onclick = defaultStartBtnHandler;
            };
        }
    } else {
        // ★敗北時: HP持ち越しリセット（次回は全回復）
        carryOverHP = -1;
        playSound('gameOver');
        battleLog.textContent = "😭まけちゃった...もういっかい がんばろう！";
        startBtn.textContent = "もういっかい！";
        startBtn.style.display = "inline-block";
        startBtn.onclick = defaultStartBtnHandler;
    }
}

function defaultStartBtnHandler() {
    playSound('tap'); enemyCharacter.classList.remove('defeated'); startBattle();
}

// ============================================================
// トレーニングモード (変更なし)
// ============================================================
function generateTrainingProblem(type) {
    let num1, num2;
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function createHole(n1, opStr, n2, ans) {
        return Math.random() < 0.5 ? { q: `□ ${opStr} ${n2} = ${ans}`, a: n1, type: opStr } : { q: `${n1} ${opStr} □ = ${ans}`, a: n2, type: opStr };
    }
    switch (type) {
        case 'addsub1': return Math.random() < 0.6 ? { q: `${num1 = randInt(0, 10)} + ${num2 = randInt(0, 10 - num1)}`, a: num1 + num2, type: '+' } : { q: `${num1 = randInt(2, 10)} - ${num2 = randInt(1, num1 - 1)}`, a: num1 - num2, type: '-' };
        case 'addsub1_hole': return Math.random() < 0.6 ? createHole(num1 = randInt(0, 10), '+', num2 = randInt(0, 10 - num1), num1 + num2) : createHole(num1 = randInt(2, 10), '-', num2 = randInt(1, num1 - 1), num1 - num2);
        case 'addsub2': { if (Math.random() < 0.6) { num1 = randInt(10, 89); num2 = randInt(10, 99 - num1); return { q: `${num1} + ${num2}`, a: num1 + num2, type: '+' }; } else { num1 = randInt(20, 99); num2 = randInt(10, num1); return { q: `${num1} - ${num2}`, a: num1 - num2, type: '-' }; } }
        case 'addsub2_hole': { if (Math.random() < 0.6) { num1 = randInt(10, 89); num2 = randInt(10, 99 - num1); return createHole(num1, '+', num2, num1 + num2); } else { num1 = randInt(20, 99); num2 = randInt(10, num1); return createHole(num1, '-', num2, num1 - num2); } }
        case 'mul': num1 = randInt(2, 9); num2 = randInt(2, 9); return { q: `${num1} × ${num2}`, a: num1 * num2, type: '×' };
        case 'mul_hole': num1 = randInt(2, 9); num2 = randInt(2, 9); return createHole(num1, '×', num2, num1 * num2);
        case 'div': num2 = randInt(2, 9); num1 = randInt(2, 9); return { q: `${num2 * num1} ÷ ${num2}`, a: num1, type: '÷' };
        case 'div_hole': { const dv = randInt(2, 9); const qt = randInt(2, 9); const dd = dv * qt; return Math.random() < 0.5 ? { q: `□ ÷ ${dv} = ${qt}`, a: dd, type: '÷' } : { q: `${dd} ÷ □ = ${qt}`, a: dv, type: '÷' }; }
        default: return { q: "1 + 1", a: 2, type: '+' };
    }
}

function popTrainingEnemy() {
    trainingEnemyDisplay.classList.add('defeated');
    setTimeout(() => { trainingEnemyDisplay.textContent = trainingEnemies[Math.floor(Math.random() * trainingEnemies.length)]; trainingEnemyDisplay.classList.remove('defeated'); }, 120);
}

function showTrainingQuestion() {
    if (trainingTimeRemaining <= 0) return;
    currentTrainingProblem = generateTrainingProblem(trainingType);
    trainingQuestion.textContent = currentTrainingProblem.q;
    trainingAnswerChoices.innerHTML = "";
    generateChoices(currentTrainingProblem.a).forEach(c => {
        const btn = document.createElement("button"); btn.textContent = c; btn.className = "choice-btn";
        btn.onclick = () => {
            if (battleInProgress) return; battleInProgress = true; playSound('tap');
            if (c === currentTrainingProblem.a) { playSound('hitPerfect'); trainingScore++; popTrainingEnemy(); showFeedback("Correct!", "perfect"); }
            else { playSound('wrong'); trainingTimeRemaining = Math.max(0, trainingTimeRemaining - 5); showFeedback("Wrong!", "wrong"); }
            trainingScoreDisplay.textContent = `たおしたかず: ${trainingScore}`;
            setTimeout(showTrainingQuestion, 200);
        };
        trainingAnswerChoices.appendChild(btn);
    });
    battleInProgress = false;
}

function startTraining(type) {
    if (trainingTimerInterval) { clearInterval(trainingTimerInterval); trainingTimerInterval = null; }
    gameMode = 'training'; trainingType = type; trainingScore = 0; trainingTimeRemaining = trainingTimeLimit;
    trainingTimer.textContent = `のこりじかん: ${trainingTimeRemaining}びょう`;
    trainingScoreDisplay.textContent = `たおしたかず: ${trainingScore}`;
    hideAllScreens(); trainingScreen.style.display = 'flex';
    document.body.className = 'training-bg'; playBgm('bgmTraining');
    trainingEnemyDisplay.textContent = trainingEnemies[Math.floor(Math.random() * trainingEnemies.length)];
    showTrainingQuestion();
    trainingTimerInterval = setInterval(() => {
        trainingTimeRemaining--; trainingTimer.textContent = `のこりじかん: ${trainingTimeRemaining}びょう`;
        if (trainingTimeRemaining <= 0) {
            clearInterval(trainingTimerInterval); trainingTimerInterval = null; stopBgm();
            finalScore.textContent = `${trainingScore} ひき たおした！`;
            const isNew = saveBestScore(trainingType, trainingScore);
            const best = loadBestScore(trainingType);
            personalBest.textContent = `じこベスト: ${best} ひき${isNew ? " 🎉" : ""}`;
            hideAllScreens(); trainingResultScreen.style.display = 'flex';
        }
    }, 1000);
}

function quitTraining() {
    if (trainingTimerInterval) { clearInterval(trainingTimerInterval); trainingTimerInterval = null; }
    stopBgm(); playSound('tap'); document.body.className = '';
    hideAllScreens(); trainingTypeSelectScreen.style.display = 'flex';
}

// ============================================================
// 画面遷移
// ============================================================
function showModeSelect() {
    stopBgm(); document.body.className = '';
    hideAllScreens(); modeSelectScreen.style.display = 'flex';
}

function selectMode(m) {
    playSound('tap'); gameMode = m;
    highestClearedStage = loadHighestStage(gameMode);
    hideAllScreens(); startMethodScreen.style.display = 'flex';
    if (highestClearedStage >= maxStage) {
        continueFromLastBtn.textContent = `つづきから (Lv${maxStage} さいしゅうボス)`;
        continueFromLastBtn.style.display = 'inline-block';
    } else if (highestClearedStage > 0) {
        continueFromLastBtn.textContent = `つづきから (Lv ${highestClearedStage + 1})`;
        continueFromLastBtn.style.display = 'inline-block';
    } else {
        continueFromLastBtn.textContent = "つづきから";
        continueFromLastBtn.style.display = 'none';
    }
}

// ============================================================
// イベントリスナー
// ============================================================
document.getElementById("grade1ModeBtn").addEventListener("click", () => selectMode('grade1'));
document.getElementById("grade4ModeBtn").addEventListener("click", () => selectMode('grade4'));
trainingModeBtn.addEventListener("click", () => { playSound('tap'); hideAllScreens(); trainingTypeSelectScreen.style.display = 'flex'; stopBgm(); });

startFromBeginningBtn.addEventListener('click', () => {
    currentStage = 1; playerItems = []; carryOverHP = -1; lastAreaIndex = -1;
    playSound('tap');
    hideAllScreens(); document.body.className = '';
    showAreaMap();
});
continueFromLastBtn.addEventListener('click', () => {
    currentStage = highestClearedStage + 1; if (currentStage > maxStage) currentStage = maxStage;
    playerItems = []; carryOverHP = -1; lastAreaIndex = -1;
    playSound('tap');
    hideAllScreens(); document.body.className = '';
    showAreaMap();
});

// マップからバトル開始
mapStartBattleBtn.addEventListener('click', () => {
    playSound('tap'); hideAllScreens(); battleScreen.style.display = 'flex'; document.body.className = ''; startBattle();
});
document.getElementById("backToModeFromMapBtn").addEventListener("click", () => { playSound('tap'); showModeSelect(); });

startBtn.onclick = defaultStartBtnHandler;
if (skillBtn) skillBtn.addEventListener("click", useSkill);

document.querySelectorAll('.training-type-btn').forEach(b => b.addEventListener('click', (e) => startTraining(e.target.dataset.trainingType)));
retryTrainingBtn.addEventListener('click', () => { playSound('tap'); hideAllScreens(); startTraining(trainingType); });
backToModeSelectBtn.addEventListener('click', showModeSelect);
backToModeSelectBtnFromTraining.addEventListener('click', showModeSelect);
quitTrainingBtn.addEventListener('click', quitTraining);

// 初期化
loadBgmSetting(bgmToggleBtn); playerHPText.textContent = playerHP; updateHPBar('playerHPBar', playerHP, playerMaxHP); showModeSelect();
document.getElementById("backToModeFromStartMethodBtn").addEventListener("click", () => { playSound('tap'); showModeSelect(); });
document.getElementById("quitBattleBtn").addEventListener("click", () => { playSound('tap'); battleInProgress = false; clearEnemyAttackTimer(); clearAllGameTimeouts(); stopBgm(); document.body.className = ''; bossDefeatedOverlay.style.display = 'none'; showModeSelect(); });
