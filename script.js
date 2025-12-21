// --- グローバル変数等 ---
let currentStage = 1;
let gameMode = '';
let playerMaxHP = 15;
let playerHP = playerMaxHP;
let currentEnemy = {};
let enemyMaxHP = 10;
let enemyHP = enemyMaxHP;
let problems = [];
let currentProblemIndex = 0;
let questionStartTime;
let battleInProgress = false;
let comboCount = 0;
let isBgmEnabled = true;
const BGM_KEY = 'nekobattle_bgmEnabled_v2';
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

// --- DOM要素取得 ---
const modeSelectScreen = document.getElementById("modeSelectScreen");
const trainingModeBtn = document.getElementById("trainingModeBtn");
const startMethodScreen = document.getElementById("startMethodScreen");
const startFromBeginningBtn = document.getElementById("startFromBeginningBtn");
const continueFromLastBtn = document.getElementById("continueFromLastBtn");
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
const feedbackDisplay = document.getElementById("feedbackDisplay");
const comboDisplay = document.getElementById("comboDisplay");
const bgmToggleBtn = document.getElementById("bgmToggleBtn");
const damageEffectContainer = document.getElementById('damageEffectContainer');

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

// --- 効果音とBGM ---
const sounds = {
    tap: new Audio('tap.mp3'),
    hitPlayer: new Audio('hit_player.mp3'),
    wrong: new Audio('wrong.mp3'),
    enemyDefeated: new Audio('enemy_defeated.mp3'),
    bgmNormal: new Audio('bgm_normal.mp3'),
    bgmBoss: new Audio('bgm_boss.mp3'),
    bgmTraining: new Audio('bgm_training.mp3'),
    hitGood: new Audio('hit_normal.mp3'),
    hitGreat: new Audio('hit_normal.mp3'),
    hitPerfect: new Audio('hit_perfect.mp3'),
    hitCritical: new Audio('critical_hit.mp3'),
    comboMilestone: new Audio('combo_milestone.mp3')
};
// ループ設定と音量調整
sounds.bgmNormal.loop = true; sounds.bgmNormal.volume = 0.3;
sounds.bgmBoss.loop = true; sounds.bgmBoss.volume = 0.3;
sounds.bgmTraining.loop = true; sounds.bgmTraining.volume = 0.3;

let currentBgm = null;
function playSound(n) { if (!sounds[n]) return; sounds[n].currentTime = 0; sounds[n].play().catch(e => {}); }
function playBgm(n) { 
    if (!isBgmEnabled || !sounds[n]) return; 
    stopBgm(); 
    sounds[n].play().catch(e => {}); 
    currentBgm = sounds[n]; 
}
function stopBgm() { if (currentBgm) { currentBgm.pause(); currentBgm.currentTime = 0; currentBgm = null; } }
function updateBgmButton() { bgmToggleBtn.textContent = isBgmEnabled ? '🔊' : '🔇'; bgmToggleBtn.classList.toggle('muted', !isBgmEnabled); }
function loadBgmSetting() { const s = localStorage.getItem(BGM_KEY); isBgmEnabled = (s !== null) ? JSON.parse(s) : true; updateBgmButton(); }

bgmToggleBtn.addEventListener('click', () => { 
    isBgmEnabled = !isBgmEnabled; 
    localStorage.setItem(BGM_KEY, JSON.stringify(isBgmEnabled)); 
    updateBgmButton(); 
    if (isBgmEnabled) { 
        if (!currentBgm && (battleInProgress || gameMode === 'training')) { 
            if (gameMode === 'training') playBgm('bgmTraining'); 
            else if (currentEnemy && currentEnemy.type) playBgm(currentEnemy.type === 'boss' ? 'bgmBoss' : 'bgmNormal'); 
        } 
    } else { stopBgm(); } 
    playSound('tap'); 
});

// --- 敵データ (Lv1〜60) ---
const enemies = {
    // 1-10: 序盤
    1: { name: "ぷるぷるスライム", emoji: "💧", hp: 12, type: "normal" },
    2: { name: "スライム", emoji: "💧", hp: 13, type: "normal" },
    3: { name: "おおきなスライム", emoji: "💧", hp: 14, type: "normal" },
    4: { name: "ぶきみなコウモリ", emoji: "🦇", hp: 15, type: "normal" },
    5: { name: "吸血コウモリ", emoji: "🧛", hp: 16, type: "normal" },
    6: { name: "さまようゴースト", emoji: "👻", hp: 17, type: "normal" },
    7: { name: "ゴーストチーフ", emoji: "👻", hp: 18, type: "normal" },
    8: { name: "ホネホネスケルトン", emoji: "💀", hp: 19, type: "normal" },
    9: { name: "スケルトンナイト", emoji: "💀", hp: 20, type: "normal" },
    10: { name: "ボス コウモリロード", emoji: "🦇👑", hp: 30, type: "boss" },

    // 11-20: 基礎
    11: { name: "くさったしたい", emoji: "🧟", hp: 22, type: "normal" },
    12: { name: "マッドハンド", emoji: "✋", hp: 24, type: "normal" },
    13: { name: "マッドハンドリーダー", emoji: "✋", hp: 26, type: "normal" },
    14: { name: "ガーゴイル", emoji: "🗿", hp: 28, type: "normal" },
    15: { name: "ストーンマン", emoji: "🗿", hp: 30, type: "normal" },
    16: { name: "オーク", emoji: "🐗", hp: 32, type: "normal" },
    17: { name: "オークリーダー", emoji: "🐗", hp: 34, type: "normal" },
    18: { name: "ミノタウロス", emoji: "🐂", hp: 36, type: "normal" },
    19: { name: "レッドミノタウロス", emoji: "👹", hp: 38, type: "normal" },
    20: { name: "ボス ゴブリンキング", emoji: "👺👑", hp: 50, type: "boss" },

    // 21-30: 中盤
    21: { name: "アイスゴーレム", emoji: "🧊", hp: 40, type: "normal" },
    22: { name: "フレイムゴーレム", emoji: "🔥", hp: 42, type: "normal" },
    23: { name: "マグマゴーレム", emoji: "🌋", hp: 44, type: "normal" },
    24: { name: "キメラ", emoji: "🦁", hp: 46, type: "normal" },
    25: { name: "スターキメラ", emoji: "🌟", hp: 48, type: "normal" },
    26: { name: "レッサーデーモン", emoji: "👿", hp: 50, type: "normal" },
    27: { name: "アークデーモン", emoji: "🔥", hp: 52, type: "normal" },
    28: { name: "ダークナイト", emoji: "🛡️", hp: 54, type: "normal" },
    29: { name: "デスナイト", emoji: "💀", hp: 56, type: "normal" },
    30: { name: "ボス サイクロプス", emoji: "👁️", hp: 70, type: "boss" },

    // 31-40: 穴あき入門
    31: { name: "ミミック", emoji: "📦", hp: 60, type: "normal" },
    32: { name: "人食い箱", emoji: "📦", hp: 62, type: "normal" },
    33: { name: "パンドラボックス", emoji: "🎁", hp: 64, type: "normal" },
    34: { name: "メタルスライム", emoji: "⚙️", hp: 25, type: "normal" },
    35: { name: "はぐれメタル", emoji: "✨", hp: 30, type: "normal" },
    36: { name: "ドラゴン", emoji: "🐉", hp: 68, type: "normal" },
    37: { name: "キースドラゴン", emoji: "🐉", hp: 70, type: "normal" },
    38: { name: "ダースドラゴン", emoji: "🐉", hp: 72, type: "normal" },
    39: { name: "キングヒドラ", emoji: "🐍", hp: 75, type: "normal" },
    40: { name: "ボス ドラゴンゾンビ", emoji: "💀🐉", hp: 90, type: "boss" },

    // 41-50: 応用・穴あき
    41: { name: "魔界の兵士", emoji: "💂", hp: 80, type: "normal" },
    42: { name: "魔界の騎士", emoji: "⚔️", hp: 82, type: "normal" },
    43: { name: "魔界の魔道士", emoji: "🧙", hp: 84, type: "normal" },
    44: { name: "デュラハン", emoji: "🏇", hp: 86, type: "normal" },
    45: { name: "首なし騎士", emoji: "🏇", hp: 88, type: "normal" },
    46: { name: "死神", emoji: "💀", hp: 90, type: "normal" },
    47: { name: "死神貴族", emoji: "🎩", hp: 92, type: "normal" },
    48: { name: "ヘルバトラー", emoji: "👿", hp: 94, type: "normal" },
    49: { name: "アンクルホーン", emoji: "🐂", hp: 96, type: "normal" },
    50: { name: "ボス デスピサロ", emoji: "👽", hp: 120, type: "boss" },

    // 51-59: 総力戦
    51: { name: "メタルキング", emoji: "👑", hp: 50, type: "normal" },
    52: { name: "ゴールデンスライム", emoji: "💰", hp: 100, type: "normal" },
    53: { name: "プラチナキング", emoji: "💎", hp: 60, type: "normal" },
    54: { name: "エスターク", emoji: "🦗", hp: 110, type: "normal" },
    55: { name: "ダークドレアム", emoji: "👿", hp: 115, type: "normal" },
    56: { name: "魔王の右手", emoji: "🤜", hp: 120, type: "normal" },
    57: { name: "魔王の左手", emoji: "🤛", hp: 120, type: "normal" },
    58: { name: "魔王の影", emoji: "👤", hp: 125, type: "normal" },
    59: { name: "魔王親衛隊長", emoji: "⚔️", hp: 130, type: "normal" },
    
    // 60: ラスボス
    60: { name: "大魔王ニャンゾーマ", emoji: "🐈👑", hp: 200, type: "boss" }
};
const maxStage = 60;

// --- localStorage関連 ---
function getHighestStageKey(mode) { return `${HIGHEST_STAGE_KEY_PREFIX}${mode}_v2`; }
function saveHighestStage(mode, stage) { const key = getHighestStageKey(mode); const currentHighest = loadHighestStage(mode); if (stage > currentHighest && stage <= maxStage) { localStorage.setItem(key, stage.toString()); } }
function loadHighestStage(mode) { const key = getHighestStageKey(mode); const savedStage = localStorage.getItem(key); return savedStage ? parseInt(savedStage, 10) : 0; }
function getBestScoreKey(type) { return `${BEST_SCORE_KEY_PREFIX}${type}`; }
function saveBestScore(type, score) { const key = getBestScoreKey(type); const currentBest = loadBestScore(type); if (score > currentBest) { localStorage.setItem(key, score.toString()); return true; } return false; }
function loadBestScore(type) { const key = getBestScoreKey(type); const savedScore = localStorage.getItem(key); return savedScore ? parseInt(savedScore, 10) : 0; }

// --- ★難易度調整: 問題タイプごとの目標タイム設定 ---
// 戻り値: [Critical(最高), Perfect(速い), Great(目標ペース), Good(現状ペース)]
// Critical/Perfectは Greatのさらに0.7倍/0.85倍 程度に設定
function getProblemTimeLimit(mode, type, qText) {
    // デフォルト（エラー回避用）
    let limits = [1.5, 2.5, 4.0, 7.0]; 

    // --- 🎒 １ねんせい ---
    if (mode === 'grade1') {
        if (type === '+' || type === '-') {
            // 2桁の計算（文字数や内容で簡易判定）
            const isTwoDigit = /[1-9][0-9]/.test(qText); 
            
            if (isTwoDigit) {
                // 【2桁 足し引き】
                // 現状: 50秒で5問 (10.0秒/問)
                // 目標: 50秒で8問 (6.25秒/問) => これをGreatの上限にする
                // Goodは現状の10秒まで許容してあげる（諦めさせないため）
                limits = [3.0, 5.0, 6.25, 10.0];
            } else {
                // 【1桁 足し引き】
                // 現状: 50秒で24問 (2.08秒/問)
                // 目標: 50秒で26問 (1.92秒/問) => Great上限
                limits = [1.0, 1.5, 1.92, 2.1];
            }
        }
    }
    // --- 📚 ４ねんせい ---
    else if (mode === 'grade4') {
        if (type === '+' || type === '-') {
            // 【2桁 足し引き】
            // 現状: 50秒で15問 (3.33秒/問)
            // 目標: 50秒で20問 (2.50秒/問) => Great上限
            limits = [1.5, 2.0, 2.5, 3.35];
        } else if (type === '×') {
            // 【掛け算】
            // 現状: 50秒で23問 (2.17秒/問)
            // 目標: 50秒で32問 (1.56秒/問) => Great上限
            limits = [0.8, 1.2, 1.56, 2.2];
        } else if (type === '÷') {
            // 【割り算】
            // 現状: 50秒で36問 (1.39秒/問)
            // 目標: 50秒で37問 (1.35秒/問)
            // ※差が0.04秒しかないので、Greatは目標値にするが、
            // Goodは少し余裕を持たせて(1.6秒)、理不尽なSlow判定を防ぐ
            limits = [0.8, 1.1, 1.35, 1.6];
        }
    }

    // 穴あき問題（□がある場合）は思考時間を考慮して +1.5秒 の猶予を与える
    if (qText.includes('□')) {
        return limits.map(t => t + 1.5);
    }
    
    return limits;
}

// --- ★問題生成関数 (トレーニング連動) ---
function generateProblems(stage, mode, count) {
    const generatedProblems = [];
    let num1, num2, questionText;

    // ヘルパー: 問題オブジェクト作成 (type保存)
    function createProblem(op, n1, n2, ans, holePos = 0) {
        let qObj = {};
        if (holePos === 0) {
            qObj = { q: `${n1} ${op} ${n2}`, a: ans, type: op };
        } else if (holePos === 1) { // 左穴
            qObj = { q: `□ ${op} ${n2} = ${ans}`, a: n1, type: op };
        } else { // 右穴
            qObj = { q: `${n1} ${op} □ = ${ans}`, a: n2, type: op };
        }
        return qObj;
    }

    for (let i = 0; i < count; i++) {
        try {
            // --- 🎒 １ねんせい モード ---
            if (mode === 'grade1') {
                if (stage <= 10) { 
                    // Lv1-10: 【基本】1桁足し引き
                    if (Math.random() < 0.6) {
                        num1 = Math.floor(Math.random()*11); num2 = Math.floor(Math.random()*(11-num1));
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2));
                    } else {
                        num1 = Math.floor(Math.random()*11); num2 = Math.floor(Math.random()*num1);
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2));
                    }
                } else if (stage <= 20) { 
                    // Lv11-20: 【応用】繰り上がり・繰り下がり (1桁〜)
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*9)+2; num2 = Math.floor(Math.random()*9)+2;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2));
                    } else {
                        num1 = Math.floor(Math.random()*11)+10; num2 = Math.floor(Math.random()*9)+1;
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2));
                    }
                } else if (stage <= 30) {
                    // Lv21-30: 【混成】2桁混じり
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*20)+1; num2 = Math.floor(Math.random()*20)+1;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2));
                    } else {
                        num1 = Math.floor(Math.random()*30)+10; num2 = Math.floor(Math.random()*10)+1;
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2));
                    }
                } else if (stage <= 40) {
                    // Lv31-40: 【壁】穴あき計算（1桁レベル）
                    const hole = Math.random() < 0.5 ? 1 : 2;
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*10)+1; num2 = Math.floor(Math.random()*10)+1;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2, hole));
                    } else {
                        num1 = Math.floor(Math.random()*10)+5; num2 = Math.floor(Math.random()*num1);
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2, hole));
                    }
                } else if (stage <= 50) {
                    // Lv41-50: 【壁】穴あき計算（2桁レベル）
                    const hole = Math.random() < 0.5 ? 1 : 2;
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*20)+5; num2 = Math.floor(Math.random()*20)+5;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2, hole));
                    } else {
                        num1 = Math.floor(Math.random()*30)+10; num2 = Math.floor(Math.random()*10)+5;
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2, hole));
                    }
                } else {
                    // Lv51-60: 総力戦
                    const hole = Math.random() < 0.4 ? (Math.random()<0.5?1:2) : 0;
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*50)+1; num2 = Math.floor(Math.random()*50)+1;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2, hole));
                    } else {
                        num1 = Math.floor(Math.random()*90)+10; num2 = Math.floor(Math.random()*40)+1;
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2, hole));
                    }
                }
            }
            // --- 📚 ４ねんせい モード ---
            else if (mode === 'grade4') {
                if (stage <= 10) {
                    // Lv1-10: 【基本】2桁足し引き
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*80)+10; num2 = Math.floor(Math.random()*80)+10;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2));
                    } else {
                        num1 = Math.floor(Math.random()*80)+20; num2 = Math.floor(Math.random()*(num1-10))+10;
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2));
                    }
                } else if (stage <= 20) {
                    // Lv11-20: 【応用】掛け算・割り算
                    if (Math.random() < 0.6) { 
                        num1 = Math.floor(Math.random()*80)+10; num2 = Math.floor(Math.random()*8)+2;
                        generatedProblems.push(createProblem('×', num1, num2, num1*num2));
                    } else {
                        const ans = Math.floor(Math.random()*20)+2; num2 = Math.floor(Math.random()*8)+2;
                        generatedProblems.push(createProblem('÷', ans*num2, num2, ans));
                    }
                } else if (stage <= 30) {
                    // Lv21-30: 【混成】四則演算スピード
                    const r = Math.random();
                    if (r < 0.25) { num1=Math.floor(Math.random()*90)+10; num2=Math.floor(Math.random()*90)+10; generatedProblems.push(createProblem('+', num1,num2,num1+num2)); }
                    else if (r < 0.5) { num1=Math.floor(Math.random()*90)+10; num2=Math.floor(Math.random()*(num1-5))+5; generatedProblems.push(createProblem('-', num1,num2,num1-num2)); }
                    else if (r < 0.75) { num1=Math.floor(Math.random()*20)+2; num2=Math.floor(Math.random()*9)+1; generatedProblems.push(createProblem('×', num1,num2,num1*num2)); }
                    else { const ans=Math.floor(Math.random()*15)+2; num2=Math.floor(Math.random()*9)+2; generatedProblems.push(createProblem('÷', ans*num2,num2,ans)); }
                } else if (stage <= 40) {
                    // Lv31-40: 【壁】穴あき計算（足し引き）
                    const hole = Math.random() < 0.5 ? 1 : 2;
                    if (Math.random() < 0.5) {
                        num1 = Math.floor(Math.random()*50)+10; num2 = Math.floor(Math.random()*50)+10;
                        generatedProblems.push(createProblem('+', num1, num2, num1+num2, hole));
                    } else {
                        num1 = Math.floor(Math.random()*80)+20; num2 = Math.floor(Math.random()*(num1-10))+10;
                        generatedProblems.push(createProblem('-', num1, num2, num1-num2, hole));
                    }
                } else if (stage <= 50) {
                    // Lv41-50: 【壁】穴あき計算（掛け割り）
                    const hole = Math.random() < 0.5 ? 1 : 2;
                    if (Math.random() < 0.5) { 
                        num1 = Math.floor(Math.random()*9)+1; num2 = Math.floor(Math.random()*9)+1;
                        generatedProblems.push(createProblem('×', num1, num2, num1*num2, hole));
                    } else { 
                        const ans = Math.floor(Math.random()*9)+1; num2 = Math.floor(Math.random()*9)+1;
                        generatedProblems.push(createProblem('÷', ans*num2, num2, ans, hole));
                    }
                } else {
                    // Lv51-60: 総力戦
                    const hole = Math.random() < 0.4 ? (Math.random()<0.5?1:2) : 0;
                    const r = Math.random();
                    if (r < 0.25) { num1=Math.floor(Math.random()*80)+10; num2=Math.floor(Math.random()*80)+10; generatedProblems.push(createProblem('+', num1,num2,num1+num2, hole)); }
                    else if (r < 0.5) { num1=Math.floor(Math.random()*90)+10; num2=Math.floor(Math.random()*(num1-10))+10; generatedProblems.push(createProblem('-', num1,num2,num1-num2, hole)); }
                    else if (r < 0.75) { num1=Math.floor(Math.random()*15)+2; num2=Math.floor(Math.random()*9)+2; generatedProblems.push(createProblem('×', num1,num2,num1*num2, hole)); }
                    else { const ans=Math.floor(Math.random()*15)+2; num2=Math.floor(Math.random()*9)+2; generatedProblems.push(createProblem('÷', ans*num2,num2,ans, hole)); }
                }
            }
        } catch (e) {
            generatedProblems.push({ q: "1 + 1", a: 2, type: '+' });
        }
    }
    return generatedProblems;
}

// --- 選択肢生成関数 (5個に限定) ---
function generateChoices(correct) { 
    const choices = new Set(); 
    correct = Math.round(correct); 
    choices.add(correct); 
    let attempts = 0; 
    while (choices.size < 5 && attempts < 50) { 
        let d = Math.floor(Math.random() * 20) - 10; 
        if (d === 0) d = 1; 
        let w = correct + d; 
        if (w >= 0 && !choices.has(w)) choices.add(w); 
        attempts++; 
    } 
    let filler = 1; 
    while (choices.size < 5) { 
        let w1 = Math.max(0, correct + filler), w2 = Math.max(0, correct - filler); 
        if (!choices.has(w1)) choices.add(w1); 
        if (choices.size < 5 && !choices.has(w2)) choices.add(w2); 
        filler++; 
    } 
    return Array.from(choices).sort(() => Math.random() - 0.5); 
}

function updateHPBar(id, current, max) { document.getElementById(id).style.width = `${Math.max(0, (current / max) * 100)}%`; }
function shakeCharacter(id) { const el = document.getElementById(id); el.classList.add('shake-animation'); setTimeout(() => el.classList.remove('shake-animation'), 200); }
function showFeedback(text, type) { feedbackDisplay.textContent = text; feedbackDisplay.className = 'show ' + type; setTimeout(() => feedbackDisplay.className = '', 800); }

// --- コンボ表示更新関数 ---
function updateComboDisplay() {
    if (comboDisplayTimeoutId) { clearTimeout(comboDisplayTimeoutId); comboDisplayTimeoutId = null; }
    if (comboCount >= 3) {
        comboDisplay.textContent = `${comboCount} Combo!`;
        comboDisplay.className = comboCount >= 9 ? 'amazing-combo show' : (comboCount >= 6 ? 'great-combo show' : 'show');
        comboDisplayTimeoutId = setTimeout(() => { comboDisplay.classList.remove('show'); comboDisplayTimeoutId = null; }, 1500);
    } else {
        comboDisplay.classList.remove('show');
    }
}

function showQuestion() {
    battleInProgress = false;
    if (currentProblemIndex >= questionsForThisStage || playerHP <= 0 || enemyHP <= 0) { endBattle(); return; }
    const p = problems[currentProblemIndex];
    questionDiv.textContent = p.q;
    questionStartTime = Date.now();
    
    // 現在の倍率表示
    let currentMultiplier = 1.0;
    if (comboCount >= 6) currentMultiplier = 1.1;
    else if (comboCount >= 3) currentMultiplier = 1.05;

    let logText = `Lv${currentStage} (${currentProblemIndex + 1}/${questionsForThisStage})`;
    if (comboCount >= 3) logText += ` (Combo x${currentMultiplier})`;
    battleLog.textContent = logText;

    const choices = generateChoices(p.a);
    answerChoicesDiv.innerHTML = "";
    choices.forEach(c => {
        const btn = document.createElement("button");
        btn.textContent = c; btn.className = "choice-btn";
        btn.onclick = () => handleAnswer(c);
        answerChoicesDiv.appendChild(btn);
    });
}

function showDamageEffect(damage, isCritical) {
    if (!damageEffectContainer || damage <= 0) return;
    const el = document.createElement('span');
    el.textContent = `-${damage}`;
    el.className = isCritical ? 'damage-popup critical-damage' : 'damage-popup';
    el.style.left = `calc(50% + ${Math.random() * 40 - 20}px)`;
    damageEffectContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) damageEffectContainer.removeChild(el); }, 800);
}

// --- ★回答処理（スピード補正・マイルドコンボ・ミス回復） ---
function handleAnswer(selectedAnswer) {
    if (battleInProgress) return;
    battleInProgress = true;
    answerChoicesDiv.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    playSound('tap');
    
    const elapsed = (Date.now() - questionStartTime) / 1000;
    const p = problems[currentProblemIndex];
    
    // 問題タイプに応じた制限時間を取得
    const [criticalTime, perfectTime, greatTime, goodTime] = getProblemTimeLimit(gameMode, p.type, p.q);
    
    let baseDamage = 10; // 基礎ダメージ
    let damageToEnemy = 0;
    let damageToPlayer = 0;
    let logMessage = "";
    let feedbackText = "";
    let feedbackType = "";
    let isCritical = false;
    let speedBonus = 1.0;

    if (selectedAnswer === p.a) {
        // --- 正解 ---
        comboCount++;

        // 1. タイム評価
        if (elapsed < criticalTime) { 
            feedbackText = "Critical!!"; feedbackType = "critical"; isCritical = true; 
            speedBonus = 1.2; 
        } else if (elapsed < perfectTime) { 
            feedbackText = "Perfect!"; feedbackType = "perfect"; 
            speedBonus = 1.1; 
        } else if (elapsed < greatTime) { 
            feedbackText = "Great!"; feedbackType = "great"; 
            speedBonus = 1.0; 
        } else if (elapsed < goodTime) { 
            feedbackText = "Good"; feedbackType = "good"; 
            speedBonus = 0.9; 
        } else { 
            feedbackText = "Slow..."; feedbackType = "slow"; 
            speedBonus = 0.5; 
            
            // ★変更点: 1年生モード(grade1)なら、遅くてもコンボを切らない
            // 4年生はシビアに、遅すぎるとコンボリセット
            if (gameMode !== 'grade1') {
                comboCount = 0; 
            }
        }

        if (feedbackType !== "slow") {
            // 2. コンボボーナス (マイルド)
            let comboMultiplier = 1.0;
            if (comboCount >= 6) comboMultiplier = 1.1;
            else if (comboCount >= 3) comboMultiplier = 1.05;

            // 3. ダメージ計算
            damageToEnemy = Math.floor(baseDamage * speedBonus * comboMultiplier);
            
            logMessage = `敵に${damageToEnemy}ダメージ!`;
            if (speedBonus > 1.0) logMessage += " (Speed!)";
            if (comboMultiplier > 1.0) logMessage += ` (Combo x${comboMultiplier})`;

            if (isCritical) playSound('hitCritical');
            else if (feedbackType === "perfect") playSound('hitPerfect');
            else if (feedbackType === "great") playSound('hitGreat');
            else playSound('hitGood');

            document.body.classList.add('feedback-flash');
            setTimeout(() => document.body.classList.remove('feedback-flash'), 150);
            shakeCharacter('enemyCharacter');
            showDamageEffect(damageToEnemy, isCritical);
            
            if (comboCount % 5 === 0 || comboCount === 3) playSound('comboMilestone');
        } else {
            // Too slow
            logMessage = "遅かった... 攻撃がかわされた！";
            playSound('hitPlayer');
            if (comboDisplayTimeoutId) { clearTimeout(comboDisplayTimeoutId); comboDisplayTimeoutId = null; }
        }

    } else {
        // --- 不正解 ---
        playSound('wrong');
        damageToPlayer = 1;
        
        // 敵HP回復 (最大HPの5% or 最低1)
        let healAmount = Math.max(1, Math.floor(enemyMaxHP * 0.05));
        if (enemyHP + healAmount > enemyMaxHP) healAmount = enemyMaxHP - enemyHP; 
        enemyHP += healAmount;

        logMessage = `Miss! 敵が${healAmount}回復した...`;
        feedbackText = "Heal...";
        feedbackType = "wrong";
        
        comboCount = 0;
        if (comboDisplayTimeoutId) { clearTimeout(comboDisplayTimeoutId); comboDisplayTimeoutId = null; }
        
        document.body.classList.add('feedback-wrong');
        setTimeout(() => document.body.classList.remove('feedback-wrong'), 150);
        shakeCharacter('playerCharacter');
        playSound('hitPlayer');
        updateHPBar('enemyHPBar', enemyHP, enemyMaxHP);
        enemyHPText.textContent = enemyHP;
    }

    updateComboDisplay();
    enemyHP = Math.max(0, enemyHP - damageToEnemy);
    playerHP = Math.max(0, playerHP - damageToPlayer);
    enemyHPText.textContent = enemyHP;
    playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP);
    updateHPBar('playerHPBar', playerHP, playerMaxHP);
    battleLog.textContent = logMessage;
    
    if (feedbackText) showFeedback(feedbackText, feedbackType);

    currentProblemIndex++;
    setTimeout(() => {
        if (playerHP <= 0 || enemyHP <= 0 || currentProblemIndex >= questionsForThisStage) {
            endBattle();
        } else {
            showQuestion();
        }
    }, 1000);
}

// --- startBattle関数 ---
function startBattle() {
    currentEnemy = enemies[currentStage] || enemies[maxStage];
    
    // HP計算: 基礎ダメ(10) * 問題数 * 0.85 (85%程度の回答率で勝てる設定)
    questionsForThisStage = (currentEnemy.type === 'boss') ? 35 : 20;
    let baseStageHP = questionsForThisStage * 10; 
    
    enemyMaxHP = Math.floor(baseStageHP * 0.85); 
    if (currentEnemy.type === 'boss') {
        enemyMaxHP = Math.floor(enemyMaxHP * 1.2); 
    }
    
    // 1年生は少しHP低めに
    if (gameMode === 'grade1') enemyMaxHP = Math.floor(enemyMaxHP * 0.9);

    enemyMaxHP = Math.max(5, enemyMaxHP);
    enemyHP = enemyMaxHP;
    
    playerHP = playerMaxHP;
    currentProblemIndex = 0;
    comboCount = 0;
    updateComboDisplay();
    
    problems = generateProblems(currentStage, gameMode, questionsForThisStage);
    
    enemyName.textContent = `${currentEnemy.emoji} ${currentEnemy.name} (Lv${currentStage})`;
    enemyHPText.textContent = enemyHP;
    playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP);
    updateHPBar('playerHPBar', playerHP, playerMaxHP);
    enemyCharacter.textContent = currentEnemy.emoji;
    enemyCharacter.classList.remove('defeated');
    
    stopBgm();
    if (currentEnemy.type === 'boss') {
        document.body.classList.add('boss-battle-bg');
        battleLog.textContent = `🔥ボス出現！ ${currentEnemy.name} があらわれた！🔥`;
        playBgm('bgmBoss');
    } else {
        document.body.classList.remove('boss-battle-bg');
        battleLog.textContent = `Lv${currentStage} ${currentEnemy.name} があらわれた！`;
        playBgm('bgmNormal');
    }
    
    startBtn.style.display = "none";
    battleInProgress = false;
    setTimeout(showQuestion, 1500);
}

// --- endBattle関数 ---
function endBattle() {
    battleInProgress = true;
    answerChoicesDiv.innerHTML = "";
    questionDiv.textContent = "Battle End!";
    comboDisplay.classList.remove('show');
    if (comboDisplayTimeoutId) { clearTimeout(comboDisplayTimeoutId); comboDisplayTimeoutId = null; }
    stopBgm();

    let resultMessage = "";
    let nextButtonText = "";
    let isVictory = false;

    if (enemyHP <= 0) {
        isVictory = true;
        enemyCharacter.classList.add('defeated');
        playSound('enemyDefeated');
        
        if (currentEnemy.type === 'boss') {
            bossDefeatedMessage.textContent = `🎉  ${currentEnemy.name} 撃破！ 🎉`;
            bossDefeatedOverlay.style.display = 'flex';
            bossDefeatedOverlay.style.opacity = '1';
            bossDefeatedMessage.style.opacity = '1'; 
            bossDefeatedMessage.style.transform = 'scale(1)';
            setTimeout(() => {
                bossDefeatedOverlay.style.opacity = '0';
                bossDefeatedMessage.style.opacity = '0'; bossDefeatedMessage.style.transform = 'scale(0.5)';
                setTimeout(() => bossDefeatedOverlay.style.display = 'none', 500);
            }, 3000);
            resultMessage = `すごい！ボス ${currentEnemy.name} をたおした！🏆`;
        } else {
            resultMessage = `🎉勝利！ ${currentEnemy.name} をたおした！🎉`;
        }

        saveHighestStage(gameMode, currentStage);
        currentStage++;

        if (currentStage > maxStage) {
            resultMessage += " 🏆全ステージクリア！おめでとう！🏆";
            startBtn.style.display = "none";
        } else {
            nextButtonText = `次の敵 (Lv${currentStage}) と戦う！`;
            startBtn.style.display = "inline-block";
        }
    } else {
        isVictory = false;
        resultMessage = playerHP <= 0 ? "😭敗北...また挑戦してね！" : "時間切れ...もう一度挑戦！";
        nextButtonText = "再挑戦！";
        startBtn.style.display = "inline-block";
    }

    battleLog.textContent = resultMessage;
    if (nextButtonText) startBtn.textContent = nextButtonText;

    document.body.classList.add(isVictory ? 'feedback-correct' : 'feedback-wrong');
    setTimeout(() => document.body.classList.remove('feedback-correct', 'feedback-wrong'), 1000);
    setTimeout(() => document.body.classList.remove('boss-battle-bg'), 500);
}

// --- ★トレーニングモード (8種類対応) ---
function generateTrainingProblem(type) {
    let num1, num2, answer, questionText, op;

    function createHole(n1, opStr, n2, ans) {
        const holePos = Math.random() < 0.5 ? 0 : 1;
        if (holePos === 0) { return { q: `□ ${opStr} ${n2} = ${ans}`, a: n1 }; } 
        else { return { q: `${n1} ${opStr} □ = ${ans}`, a: n2 }; }
    }

    switch (type) {
        // --- 1. かんたん ---
        case 'addsub1': 
            if (Math.random() < 0.6) { op = '+'; num1 = Math.floor(Math.random()*11); num2 = Math.floor(Math.random()*(11-num1)); answer = num1+num2; }
            else { op = '-'; num1 = Math.floor(Math.random()*11); num2 = Math.floor(Math.random()*num1); answer = num1-num2; }
            return { q: `${num1} ${op} ${num2}`, a: answer };
        
        case 'addsub1_hole': 
            if (Math.random() < 0.6) { 
                num1 = Math.floor(Math.random()*11); num2 = Math.floor(Math.random()*(11-num1));
                return createHole(num1, '+', num2, num1+num2);
            } else { 
                num1 = Math.floor(Math.random()*11); num2 = Math.floor(Math.random()*num1);
                return createHole(num1, '-', num2, num1-num2);
            }

        // --- 2. ふつう ---
        case 'addsub2': 
            if (Math.random() < 0.5) { op = '+'; num1 = Math.floor(Math.random()*80)+10; num2 = Math.floor(Math.random()*80)+10; answer = num1+num2; }
            else { op = '-'; num1 = Math.floor(Math.random()*80)+20; num2 = Math.floor(Math.random()*(num1-10))+10; answer = num1-num2; }
            return { q: `${num1} ${op} ${num2}`, a: answer };

        case 'addsub2_hole': 
            if (Math.random() < 0.5) { 
                num1 = Math.floor(Math.random()*50)+10; num2 = Math.floor(Math.random()*40)+10;
                return createHole(num1, '+', num2, num1+num2);
            } else { 
                num1 = Math.floor(Math.random()*80)+20; num2 = Math.floor(Math.random()*(num1-10))+10;
                return createHole(num1, '-', num2, num1-num2);
            }

        // --- 3. 掛け算 ---
        case 'mul': 
            num1 = Math.floor(Math.random()*8)+2; num2 = Math.floor(Math.random()*8)+2;
            return { q: `${num1} × ${num2}`, a: num1*num2 };

        case 'mul_hole': 
            num1 = Math.floor(Math.random()*8)+2; num2 = Math.floor(Math.random()*8)+2;
            return createHole(num1, '×', num2, num1*num2);

        // --- 4. 割り算 ---
        case 'div': 
            num2 = Math.floor(Math.random()*8)+2; answer = Math.floor(Math.random()*8)+2; num1 = num2*answer;
            return { q: `${num1} ÷ ${num2}`, a: answer };

        case 'div_hole': 
            const divAns = Math.floor(Math.random()*8)+2; num2 = Math.floor(Math.random()*8)+2; num1 = divAns * num2;
            return createHole(num1, '÷', num2, divAns);

        default: return { q: "1 + 1", a: 2 };
    }
}

function showTrainingQuestion() {
    if (trainingTimeRemaining <= 0) return;
    currentTrainingProblem = generateTrainingProblem(trainingType);
    trainingQuestion.textContent = currentTrainingProblem.q;
    const choices = generateChoices(currentTrainingProblem.a);
    trainingAnswerChoices.innerHTML = "";
    trainingEnemyDisplay.classList.remove('defeated');
    choices.forEach(c => {
        const btn = document.createElement("button");
        btn.textContent = c; btn.className = "choice-btn";
        btn.onclick = () => handleTrainingAnswer(c);
        trainingAnswerChoices.appendChild(btn);
    });
    battleInProgress = false;
}

function handleTrainingAnswer(selectedAnswer) {
    if (battleInProgress || trainingTimeRemaining <= 0) return;
    battleInProgress = true;
    trainingAnswerChoices.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    playSound('tap');
    if (selectedAnswer === currentTrainingProblem.a) {
        playSound('hit_perfect');
        showFeedback("Correct!", "perfect");
        trainingScore++;
        trainingScoreDisplay.textContent = `たおした数: ${trainingScore}`;
        trainingEnemyDisplay.classList.add('defeated');
        playSound('enemyDefeated');
    } else {
        playSound('wrong');
        showFeedback("Wrong!", "wrong");
        // ★修正: 時間が0未満にならないようにガード
        trainingTimeRemaining = Math.max(0, trainingTimeRemaining - 5);
        trainingTimer.textContent = `のこり時間: ${trainingTimeRemaining}秒`;
    }
    setTimeout(showTrainingQuestion, 200);
}

function startTraining(type) {
    gameMode = 'training'; trainingType = type; trainingScore = 0; trainingTimeRemaining = trainingTimeLimit;
    battleInProgress = false; modeSelectScreen.style.display = 'none'; trainingTypeSelectScreen.style.display = 'none'; battleScreen.style.display = 'none'; trainingScreen.style.display = 'flex'; trainingResultScreen.style.display = 'none';
    document.body.className = 'training-bg';
    trainingTimer.textContent = `のこり時間: ${trainingTimeRemaining}秒`; trainingScoreDisplay.textContent = `たおした数: ${trainingScore}`;
    trainingEnemyDisplay.textContent = '💧'; stopBgm(); playBgm('bgmTraining');
    showTrainingQuestion();
    trainingTimerInterval = setInterval(() => {
        trainingTimeRemaining--;
        trainingTimer.textContent = `のこり時間: ${trainingTimeRemaining}秒`;
        if (trainingTimeRemaining <= 0) { clearInterval(trainingTimerInterval); battleInProgress = true; stopBgm(); finalScore.textContent = `${trainingScore} ひき たおした！`; const best = loadBestScore(trainingType); if (saveBestScore(trainingType, trainingScore)) personalBest.textContent = `じこベスト: ${best} → ${trainingScore} ✨新記録！✨`; else personalBest.textContent = `じこベスト: ${best} ひき`; trainingScreen.style.display = 'none'; trainingResultScreen.style.display = 'flex'; }
    }, 1000);
}

function quitTraining() {
    if (trainingTimerInterval) { clearInterval(trainingTimerInterval); trainingTimerInterval = null; }
    stopBgm(); playSound('tap');
    trainingScreen.style.display = 'none'; trainingTypeSelectScreen.style.display = 'flex';
}

// --- メニュー操作 ---
function showModeSelect() { stopBgm(); document.body.className = ''; modeSelectScreen.style.display = 'flex'; startMethodScreen.style.display = 'none'; battleScreen.style.display = 'none'; trainingTypeSelectScreen.style.display = 'none'; trainingScreen.style.display = 'none'; trainingResultScreen.style.display = 'none'; }
function selectMode(m) { playSound('tap'); gameMode = m; highestClearedStage = loadHighestStage(gameMode); modeSelectScreen.style.display = 'none'; startMethodScreen.style.display = 'flex'; continueFromLastBtn.textContent = highestClearedStage > 0 && highestClearedStage < maxStage ? `つづきから (Lv ${highestClearedStage + 1})` : "つづきから"; continueFromLastBtn.style.display = highestClearedStage > 0 && highestClearedStage < maxStage ? 'inline-block' : 'none'; }

document.getElementById("grade1ModeBtn").addEventListener("click", () => selectMode('grade1'));
document.getElementById("grade4ModeBtn").addEventListener("click", () => selectMode('grade4'));
trainingModeBtn.addEventListener("click", () => { playSound('tap'); modeSelectScreen.style.display = 'none'; trainingTypeSelectScreen.style.display = 'flex'; stopBgm(); });

startFromBeginningBtn.addEventListener('click', () => { currentStage = 1; playSound('tap'); startMethodScreen.style.display = 'none'; battleScreen.style.display = 'flex'; document.body.className = ''; startBattle(); });
continueFromLastBtn.addEventListener('click', () => { currentStage = highestClearedStage + 1; if (currentStage > maxStage) currentStage = maxStage; playSound('tap'); startMethodScreen.style.display = 'none'; battleScreen.style.display = 'flex'; document.body.className = ''; startBattle(); });
startBtn.addEventListener("click", () => { playSound('tap'); enemyCharacter.classList.remove('defeated'); startBattle(); });
document.querySelectorAll('.training-type-btn').forEach(b => b.addEventListener('click', (e) => startTraining(e.target.dataset.trainingType)));
retryTrainingBtn.addEventListener('click', () => { playSound('tap'); trainingResultScreen.style.display = 'none'; startTraining(trainingType); });
backToModeSelectBtn.addEventListener('click', showModeSelect);
backToModeSelectBtnFromTraining.addEventListener('click', showModeSelect);
quitTrainingBtn.addEventListener('click', quitTraining);

// 初期化
loadBgmSetting(); playerHPText.textContent = playerHP; updateHPBar('playerHPBar', playerHP, playerMaxHP); showModeSelect();