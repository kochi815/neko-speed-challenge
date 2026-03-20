// --- グローバル変数等 ---
let currentStage = 1;
let gameMode = '';
let playerMaxHP = 20;
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

// トレーニング用敵キャラリスト
const trainingEnemies = ["🦎","🔥","🦅","⚡","🦈","🌊","💎","🛡️","⭐","🌌","🐉"];

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


// --- BGMボタンイベント設定 ---
bgmToggleBtn.addEventListener('click', () => { 
    isBgmEnabled = !isBgmEnabled; 
    localStorage.setItem(BGM_KEY, JSON.stringify(isBgmEnabled)); 
    updateBgmButton(bgmToggleBtn); 
    if (isBgmEnabled) { 
        if (!currentBgm && (battleInProgress || gameMode === 'training')) { 
            if (gameMode === 'training') playBgm('bgmTraining'); 
            else if (currentEnemy && currentEnemy.type) playBgm(currentEnemy.type === 'boss' ? 'bgmBoss' : 'bgmNormal'); 
        } 
    } else { stopBgm(); } 
    playSound('tap'); 
});

// --- localStorage ---
function getHighestStageKey(mode) { return `${HIGHEST_STAGE_KEY_PREFIX}${mode}_v2`; }
function saveHighestStage(mode, stage) { const key = getHighestStageKey(mode); const currentHighest = loadHighestStage(mode); if (stage > currentHighest && stage <= maxStage) { localStorage.setItem(key, stage.toString()); } }
function loadHighestStage(mode) { const key = getHighestStageKey(mode); const savedStage = localStorage.getItem(key); return savedStage ? parseInt(savedStage, 10) : 0; }
function getBestScoreKey(type) { return `${BEST_SCORE_KEY_PREFIX}${type}`; }
function saveBestScore(type, score) { const key = getBestScoreKey(type); const currentBest = loadBestScore(type); if (score > currentBest) { localStorage.setItem(key, score.toString()); return true; } return false; }
function loadBestScore(type) { const key = getBestScoreKey(type); const savedScore = localStorage.getItem(key); return savedScore ? parseInt(savedScore, 10) : 0; }

// --- ★難易度調整: 目標タイム設定 (Strict版) ---
function getProblemTimeLimit(mode, type, qText) {
    // 戻り値: [Critical, Perfect, Great(合格ライン), Good(失敗ライン)] (秒)
    // Greatの時間を超えると「Good」判定となり、ダメージが半減してクリアが困難になる。
    
    // 基本設定
    let targetTime = 5.0; 
    let holeBonus = 0.5; // 穴あきは一律 +0.5秒

    if (mode === 'grade1') {
        // --- 1年生モード（やや引き締め） ---
        const isHardProblem = /[1-9][0-9]/.test(qText);

        if (isHardProblem) {
            // ★ふつう計算（目標: 6.0秒 ← 7.1秒から引き締め）
            targetTime = 6.0;
        } else {
            // ★かんたん計算（目標: 1.7秒 ← 1.9秒から引き締め）
            targetTime = 1.7;
        }
    }
    else if (mode === 'grade4') {
        // --- 4年生モード（小4修了レベル向け調整） ---
        if (type === '+' || type === '-') {
            // ★ふつう計算・2桁（目標: 4.5秒）
            targetTime = 4.5;
        } else if (type === '×') {
            // ★かけ算（目標: 3.0秒）
            targetTime = 3.0;
        } else if (type === '÷') {
            // ★わり算（目標: 3.5秒）
            targetTime = 3.5;
        }
    } 
    else {
        // トレーニングモード等のデフォルト
         if (type === '+' || type === '-') {
             targetTime = /[1-9][0-9]/.test(qText) ? 4.0 : 2.0;
         } else {
             targetTime = 2.0;
         }
    }
    
    // 穴あきの場合、目標タイムを緩和
    if (qText.includes('□')) {
        targetTime += holeBonus;
    }

    // 判定基準を作成
    // Critical: 目標の60%
    // Perfect: 目標の80%
    // Great: 目標タイムジャスト (ここまでが合格)
    // Good: それ以降 (失敗扱い)
    return [
        targetTime * 0.7,  // Critical (かなり速い)
        targetTime * 0.9,  // Perfect (目標ペース通り)
        targetTime * 1.1,  // Great (少し遅れてもOK！ここを緩和しました) 
       999 // Goodの上限は実質無限（遅くてもGood扱い）
    ];
}

// --- 問題生成 (レベル別カリキュラム) ---
function generateProblems(stage, mode, count) {
    const generatedProblems = [];
    let num1, num2;
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    
    // 作成ヘルパー
    function createProblem(op, n1, n2, ans) { return { q: `${n1} ${op} ${n2}`, a: ans, type: op }; }
    function createHole(n1, opStr, n2, ans) {
        return Math.random() < 0.5
          ? { q: `□ ${opStr} ${n2} = ${ans}`, a: n1, type: opStr }
          : { q: `${n1} ${opStr} □ = ${ans}`, a: n2, type: opStr };
    }
    
    // 問題タイプ生成ロジック
    for (let i = 0; i < count; i++) {
        try {
            let pType = '';
            
            if (mode === 'grade1') {
                // === 1年生 カリキュラム ===
                if (stage <= 10) {
                    // Lv1-10: かんたん計算のみ (基礎スピード)
                    pType = 'easy_calc';
                } else if (stage <= 20) {
                    // Lv11-20: かんたん計算 + かんたん穴あき (構造理解)
                    pType = Math.random() < 0.5 ? 'easy_calc' : 'easy_hole';
                } else if (stage <= 30) {
                    // Lv21-30: ふつう計算メイン (2桁への挑戦)
                    pType = Math.random() < 0.8 ? 'normal_calc' : 'easy_calc';
                } else if (stage <= 40) {
                    // Lv31-40: ふつう計算 + ふつう穴あき (2桁完全習得)
                    pType = Math.random() < 0.5 ? 'normal_calc' : 'normal_hole';
                } else if (stage <= 50) {
                    // Lv41-50: 実力テスト (かんたん多めのランダム)
                    const r = Math.random();
                    if (r < 0.4) pType = 'easy_calc';
                    else if (r < 0.6) pType = 'easy_hole';
                    else if (r < 0.8) pType = 'normal_calc';
                    else pType = 'normal_hole';
                } else {
                    // Lv51-60: 総仕上げ (ふつう多めのランダム)
                    const r = Math.random();
                    if (r < 0.15) pType = 'easy_calc';
                    else if (r < 0.3) pType = 'easy_hole';
                    else if (r < 0.7) pType = 'normal_calc';
                    else pType = 'normal_hole';
                }

                // 問題データ作成
                if (pType.includes('easy')) {
                    // 1桁
                    const isAdd = Math.random() < 0.6;
                    if (isAdd) {
                        num1 = randInt(0, 10); num2 = randInt(0, 10 - num1);
                        generatedProblems.push(pType === 'easy_calc' ? createProblem('+', num1, num2, num1+num2) : createHole(num1, '+', num2, num1+num2));
                    } else {
                        num1 = randInt(2, 10); num2 = randInt(1, num1 - 1);
                        generatedProblems.push(pType === 'easy_calc' ? createProblem('-', num1, num2, num1-num2) : createHole(num1, '-', num2, num1-num2));
                    }
                } else {
                    // 2桁
                    const isAdd = Math.random() < 0.6;
                    if (isAdd) {
                        num1 = randInt(10, 89); num2 = randInt(10, 99 - num1);
                        generatedProblems.push(pType === 'normal_calc' ? createProblem('+', num1, num2, num1+num2) : createHole(num1, '+', num2, num1+num2));
                    } else {
                        num1 = randInt(20, 99); num2 = randInt(10, num1);
                        generatedProblems.push(pType === 'normal_calc' ? createProblem('-', num1, num2, num1-num2) : createHole(num1, '-', num2, num1-num2));
                    }
                }

            } else if (mode === 'grade4') {
                // === 4年生 カリキュラム ===
                if (stage <= 10) {
                    // Lv1-10: かけ算のみ (瞬発力)
                    pType = 'mul';
                } else if (stage <= 20) {
                    // Lv11-20: かけ算 + わり算 (逆算思考)
                    pType = Math.random() < 0.5 ? 'mul' : 'div';
                } else if (stage <= 30) {
                    // Lv21-30: ふつう計算メイン (暗算力)
                    pType = 'normal_calc';
                } else if (stage <= 40) {
                    // Lv31-40: かけ算穴あき + わり算穴あき (思考力強化)
                    pType = Math.random() < 0.5 ? 'mul_hole' : 'div_hole';
                } else if (stage <= 50) {
                    // Lv41-50: 上級暗算 (ふつう穴あき挑戦)
                    const r = Math.random();
                    if (r < 0.6) pType = 'normal_hole';
                    else if (r < 0.8) pType = 'normal_calc';
                    else pType = Math.random() < 0.5 ? 'mul' : 'div';
                } else {
                    // Lv51-60: 総力戦 (全種ランダム)
                    const r = Math.random();
                    if (r < 0.16) pType = 'normal_calc';
                    else if (r < 0.32) pType = 'normal_hole';
                    else if (r < 0.48) pType = 'mul';
                    else if (r < 0.64) pType = 'mul_hole';
                    else if (r < 0.8) pType = 'div';
                    else pType = 'div_hole';
                }

                // 問題データ作成
                if (pType.includes('normal')) {
                    const isAdd = Math.random() < 0.5;
                    if (isAdd) {
                        num1 = randInt(10, 89); num2 = randInt(10, 99 - num1);
                        generatedProblems.push(pType === 'normal_calc' ? createProblem('+', num1, num2, num1+num2) : createHole(num1, '+', num2, num1+num2));
                    } else {
                        num1 = randInt(20, 99); num2 = randInt(10, num1 - 10);
                        generatedProblems.push(pType === 'normal_calc' ? createProblem('-', num1, num2, num1-num2) : createHole(num1, '-', num2, num1-num2));
                    }
                } else if (pType.includes('mul')) {
                    num1 = randInt(2, 9); num2 = randInt(2, 9);
                    generatedProblems.push(pType === 'mul' ? createProblem('×', num1, num2, num1*num2) : createHole(num1, '×', num2, num1*num2));
                } else {
                    const ans = randInt(2, 9); num2 = randInt(2, 9);
                    generatedProblems.push(pType === 'div' ? createProblem('÷', ans*num2, num2, ans) : createHole(ans*num2, '÷', num2, ans));
                }
            }
        } catch(e) { generatedProblems.push({q:"1+1", a:2, type:'+'}); }
    }
    return generatedProblems;
}

function generateChoices(correct) {
    const choices = new Set(); correct = Math.round(correct); choices.add(correct);
    let attempts = 0; while (choices.size < 4 && attempts < 50) {
        let d = Math.floor(Math.random() * 20) - 10; if (d === 0) d = 1;
        let w = correct + d; if (w >= 0 && !choices.has(w)) choices.add(w); attempts++;
    }
    let filler = 1; while (choices.size < 4) {
        let w1 = Math.max(0, correct + filler), w2 = Math.max(0, correct - filler);
        if (!choices.has(w1)) choices.add(w1); if (choices.size < 4 && !choices.has(w2)) choices.add(w2); filler++;
    }
    return Array.from(choices).sort(() => Math.random() - 0.5);
}

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

function showQuestion() {
    battleInProgress = false; if (currentProblemIndex >= questionsForThisStage || playerHP <= 0 || enemyHP <= 0) { endBattle(); return; }
    const p = problems[currentProblemIndex]; questionDiv.textContent = p.q; questionStartTime = Date.now();
    let currentMultiplier = comboCount >= 6 ? 1.1 : (comboCount >= 3 ? 1.05 : 1.0);
    battleLog.textContent = `Lv${currentStage} (${currentProblemIndex + 1}/${questionsForThisStage})${comboCount>=3 ? ` (x${currentMultiplier})` : ''}`;
    const choices = generateChoices(p.a); answerChoicesDiv.innerHTML = "";
    choices.forEach(c => {
        const btn = document.createElement("button"); btn.textContent = c; btn.className = "choice-btn";
        btn.onclick = () => handleAnswer(c); answerChoicesDiv.appendChild(btn);
    });
}

function showDamageEffect(damage, isCritical) {
    const el = document.createElement('span'); el.textContent = `-${damage}`; el.className = isCritical ? 'damage-popup critical-damage' : 'damage-popup';
    el.style.left = `calc(50% + ${Math.random()*40-20}px)`; damageEffectContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) damageEffectContainer.removeChild(el); }, 800);
}

// --- 回答処理 (厳格版: 遅いとダメージ半減) ---
function handleAnswer(selectedAnswer) {
    if (battleInProgress) return; battleInProgress = true;
    answerChoicesDiv.querySelectorAll('.choice-btn').forEach(b => b.disabled = true); playSound('tap');
    const elapsed = (Date.now() - questionStartTime) / 1000; const p = problems[currentProblemIndex];
    const [criticalTime, perfectTime, greatTime, goodTime] = getProblemTimeLimit(gameMode, p.type, p.q);
    
    let baseDamage = 10, damageToEnemy = 0, damageToPlayer = 0, logMessage = "", feedbackText = "", feedbackType = "", isCritical = false, speedBonus = 1.0;

    if (selectedAnswer === p.a) {
        comboCount++;
        
        // 判定ロジック
        if (elapsed < criticalTime) { 
            feedbackText = "Critical!!"; feedbackType = "critical"; isCritical = true; speedBonus = 1.5; 
        } else if (elapsed < perfectTime) { 
            feedbackText = "Perfect!"; feedbackType = "perfect"; speedBonus = 1.2; 
        } else if (elapsed <= greatTime) { 
            // ここまでが合格（目標ペース達成）
            feedbackText = "Great!"; feedbackType = "great"; speedBonus = 1.0; 
        } else {
            // ここからは遅め判定 → ダメージ減
            feedbackText = "Good";
            feedbackType = "good";
            speedBonus = 0.8;
            if (gameMode !== 'grade1') comboCount = Math.max(0, comboCount - 1); // コンボ全リセットではなく1減
        }

        // コンボボーナス（最大1.2倍）
        let comboMultiplier = 1.0;
        if (comboCount >= 10) comboMultiplier = 1.2;
        else if (comboCount >= 5) comboMultiplier = 1.1;
        else if (comboCount >= 2) comboMultiplier = 1.05;

        damageToEnemy = Math.floor(baseDamage * speedBonus * comboMultiplier);
        
        let pitch = 1.0 + (Math.min(comboCount, 10) * 0.05);
        playSound('correct', 1.0, 0.5); 

        // ログメッセージと効果音
        if (isCritical) {
            logMessage = `かいしんの いちげき！てきに ${damageToEnemy} ダメージ!`;
            playSound('hitCritical', pitch);
            if (Math.random() < 0.7) playSound('voiceSkill'); 
            else playRandomAttackVoice();
        } else {
            if (feedbackType === "perfect") {
                logMessage = `てきに ${damageToEnemy} ダメージ!`;
                playSound('hitPerfect', pitch); 
            } else if (feedbackType === "great") {
                logMessage = `てきに ${damageToEnemy} ダメージ!`;
                playSound('hitGreat', pitch);   
            } else {
                // Good (失敗ペース)の場合
                logMessage = `スピードが たりない！${damageToEnemy} ダメージ`;
                playSound('hitGood', 0.6); 
            }

            // Good以外なら通常攻撃ボイス
            if (feedbackType !== "good") {
                if (comboCount >= 5 && Math.random() < 0.4) playSound('voiceSkill');
                else playRandomAttackVoice();
            }
        }

        document.body.classList.add('feedback-flash'); setTimeout(() => document.body.classList.remove('feedback-flash'), 150);
        shakeCharacter('enemyCharacter'); showDamageEffect(damageToEnemy, isCritical);
        
        // Good以外かつコンボ継続中ならコンボ音
        if (feedbackType !== "good" && comboCount > 0) {
            if (comboCount % 5 === 0 || comboCount === 3) {
                playSound('comboMilestone');
            }
        }

    } else {
        // 不正解のとき
        playSound('wrong'); damageToPlayer = 1;
        let healAmount = Math.max(1, Math.floor(enemyMaxHP * 0.03));
        if (enemyHP + healAmount > enemyMaxHP) healAmount = enemyMaxHP - enemyHP; 
        enemyHP += healAmount; logMessage = `Miss! てきが ${healAmount} かいふくした...`;
        feedbackText = "Miss..."; feedbackType = "wrong"; comboCount = 0;
        document.body.classList.add('feedback-wrong'); setTimeout(() => document.body.classList.remove('feedback-wrong'), 150);
        shakeCharacter('playerCharacter'); playSound('hitPlayer');
        updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); enemyHPText.textContent = enemyHP;
    }

    updateComboDisplay();
    enemyHP = Math.max(0, enemyHP - damageToEnemy); playerHP = Math.max(0, playerHP - damageToPlayer);
    enemyHPText.textContent = enemyHP; playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); updateHPBar('playerHPBar', playerHP, playerMaxHP);
    battleLog.textContent = logMessage; if (feedbackText) showFeedback(feedbackText, feedbackType);
    currentProblemIndex++;
    setTimeout(() => { if (playerHP <= 0 || enemyHP <= 0 || currentProblemIndex >= questionsForThisStage) endBattle(); else showQuestion(); }, 1000);
}

// --- startBattle ---
function startBattle() {
    currentEnemy = enemies[currentStage] || enemies[maxStage];
    if (gameMode === 'grade1') {
        // 1年生モード: ボス25問、通常15問（やや引き締め）
        questionsForThisStage = (currentEnemy.type === 'boss') ? 25 : 15;
    } else {
        // 4年生モード: ボス25問、通常15問（緩和）
        questionsForThisStage = (currentEnemy.type === 'boss') ? 25 : 15;
    }

    // ★敵HP計算
    // Great(10ダメ)で7割正解 + Good(7ダメ)が3割でもクリアできるバランス
    // 15問: 10*10 + 5*7 = 135 → HP120程度なら倒せる
    let hpMultiplier = 1.0;

    if (gameMode === 'grade4') {
        // 4年生: 序盤は自信をつけさせ、後半で歯ごたえを出す
        if (currentStage <= 10) hpMultiplier = 0.55;
        else if (currentStage <= 20) hpMultiplier = 0.6;
        else if (currentStage <= 30) hpMultiplier = 0.65;
        else if (currentStage <= 40) hpMultiplier = 0.7;
        else if (currentStage <= 50) hpMultiplier = 0.75;
        else hpMultiplier = 0.8;
    } else {
        // 1年生: 既にクリアできているのでやや引き締め
        if (currentStage <= 10) hpMultiplier = 0.7;
        else if (currentStage <= 30) hpMultiplier = 0.8;
        else if (currentStage <= 50) hpMultiplier = 0.85;
        else hpMultiplier = 0.9;
    }

    enemyMaxHP = Math.floor((questionsForThisStage * 10) * hpMultiplier);
    
    enemyHP = Math.max(5, enemyMaxHP); playerHP = playerMaxHP; currentProblemIndex = 0; comboCount = 0;
    updateComboDisplay(); problems = generateProblems(currentStage, gameMode, questionsForThisStage);
    enemyName.textContent = `${currentEnemy.emoji} ${currentEnemy.name} (Lv${currentStage})`;
    enemyHPText.textContent = enemyHP; playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); updateHPBar('playerHPBar', playerHP, playerMaxHP);
    enemyCharacter.textContent = currentEnemy.emoji; enemyCharacter.classList.remove('defeated');
    stopBgm();
    
    if (currentEnemy.type === 'boss') { 
        document.body.classList.add('boss-battle-bg'); 
        battleLog.textContent = `🔥【ボス】${currentEnemy.name} あらわれた！🔥`; 
        playBgm('bgmBoss'); 
        setTimeout(() => {
            if (Math.random() < 0.5) playSound('voiceBoss1');
            else playSound('voiceBoss2');
        }, 500);
    }
    else { 
        document.body.classList.remove('boss-battle-bg'); 
        battleLog.textContent = `Lv${currentStage} ${currentEnemy.name} が あらわれた！`; 
        playBgm('bgmNormal'); 
    }
    startBtn.style.display = "none"; battleInProgress = false; setTimeout(showQuestion, 1500);
}

// --- endBattle ---
function endBattle() {
    battleInProgress = true; answerChoicesDiv.innerHTML = ""; questionDiv.textContent = "Battle End!";
    comboDisplay.classList.remove('show'); stopBgm();
    let isVictory = enemyHP <= 0;
    if (isVictory) {
        enemyCharacter.classList.add('defeated'); playSound('enemyDefeated');
        if (currentEnemy.type === 'boss') {
            setTimeout(() => playSound('voiceWin'), 1000); 

            bossDefeatedMessage.textContent = `🎉 ${currentEnemy.name} げきは！ 🎉`;
            bossDefeatedOverlay.style.display = 'flex'; bossDefeatedOverlay.style.opacity = '1';
            bossDefeatedMessage.style.opacity = '1'; bossDefeatedMessage.style.transform = 'scale(1)';
            setTimeout(() => { bossDefeatedOverlay.style.opacity = '0'; setTimeout(() => bossDefeatedOverlay.style.display = 'none', 500); }, 3000);
            battleLog.textContent = `すごい！ボス ${currentEnemy.name} を たおした！🏆`;
        } else { battleLog.textContent = `🎉やったー！ ${currentEnemy.name} をたおした！🎉`; }
        saveHighestStage(gameMode, currentStage); currentStage++;
        if (currentStage > maxStage) { battleLog.textContent += " 🏆ぜんクリア！すごい！"; startBtn.style.display = "none"; }
        else { startBtn.textContent = `つぎのてき (Lv${currentStage}) へ`; startBtn.style.display = "inline-block"; }
    } else {
        battleLog.textContent = "😭まけちゃった...もういっかい がんばろう！"; startBtn.textContent = "もういっかい！"; startBtn.style.display = "inline-block";
    }
}

// --- ★トレーニング (修正版) ---
function generateTrainingProblem(type) {
    let num1, num2;
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function createHole(n1, opStr, n2, ans) {
        return Math.random() < 0.5
          ? { q: `□ ${opStr} ${n2} = ${ans}`, a: n1, type: opStr }
          : { q: `${n1} ${opStr} □ = ${ans}`, a: n2, type: opStr };
    }

    switch (type) {
        case 'addsub1':
            return Math.random() < 0.6
                ? { q: `${num1 = randInt(0, 10)} + ${num2 = randInt(0, 10 - num1)}`, a: num1 + num2, type: '+' }
                : { q: `${num1 = randInt(2, 10)} - ${num2 = randInt(1, num1 - 1)}`, a: num1 - num2, type: '-' }; 

        case 'addsub1_hole':
            return Math.random() < 0.6
                ? createHole(num1 = randInt(0, 10), '+', num2 = randInt(0, 10 - num1), num1 + num2)
                : createHole(num1 = randInt(2, 10), '-', num2 = randInt(1, num1 - 1), num1 - num2);

        case 'addsub2': {
            if (Math.random() < 0.6) {
                num1 = randInt(10, 89);
                num2 = randInt(10, 99 - num1); 
                return { q: `${num1} + ${num2}`, a: num1 + num2, type: '+' };
            } else {
                num1 = randInt(20, 99);
                num2 = randInt(10, num1);
                return { q: `${num1} - ${num2}`, a: num1 - num2, type: '-' };
            }
        }
        case 'addsub2_hole': {
            if (Math.random() < 0.6) {
                num1 = randInt(10, 89);
                num2 = randInt(10, 99 - num1);
                return createHole(num1, '+', num2, num1 + num2);
            } else {
                num1 = randInt(20, 99);
                num2 = randInt(10, num1);
                return createHole(num1, '-', num2, num1 - num2);
            }
        }

        case 'mul':
            num1 = randInt(2, 9);
            num2 = randInt(2, 9);
            return { q: `${num1} × ${num2}`, a: num1 * num2, type: '×' };

        case 'mul_hole':
            num1 = randInt(2, 9);
            num2 = randInt(2, 9);
            return createHole(num1, '×', num2, num1 * num2);

        case 'div':
            num2 = randInt(2, 9);
            num1 = randInt(2, 9);
            return { q: `${num2 * num1} ÷ ${num2}`, a: num1, type: '÷' };

        case 'div_hole': {
            const divisor = randInt(2, 9);
            const quotient = randInt(2, 9);
            const dividend = divisor * quotient;
            return Math.random() < 0.5
                ? { q: `□ ÷ ${divisor} = ${quotient}`, a: dividend, type: '÷' }
                : { q: `${dividend} ÷ □ = ${quotient}`, a: divisor, type: '÷' };
        }

        default:
            return { q: "1 + 1", a: 2, type: '+' };
    }
}

function popTrainingEnemy() {
    trainingEnemyDisplay.classList.add('defeated');
    setTimeout(() => {
        trainingEnemyDisplay.textContent = trainingEnemies[Math.floor(Math.random() * trainingEnemies.length)];
        trainingEnemyDisplay.classList.remove('defeated');
    }, 120);
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
            
            if (c === currentTrainingProblem.a) { 
                playSound('hitPerfect'); 
                trainingScore++; 
                popTrainingEnemy(); 
                showFeedback("Correct!", "perfect"); 
            } else { 
                playSound('wrong'); 
                trainingTimeRemaining = Math.max(0, trainingTimeRemaining - 5); 
                showFeedback("Wrong!", "wrong"); 
            }
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
    modeSelectScreen.style.display = 'none'; trainingTypeSelectScreen.style.display = 'none'; trainingScreen.style.display = 'flex';
    document.body.className = 'training-bg'; playBgm('bgmTraining'); 
    trainingEnemyDisplay.textContent = trainingEnemies[Math.floor(Math.random() * trainingEnemies.length)];
    showTrainingQuestion();
    trainingTimerInterval = setInterval(() => {
        trainingTimeRemaining--; trainingTimer.textContent = `のこりじかん: ${trainingTimeRemaining}びょう`;
        if (trainingTimeRemaining <= 0) { 
            clearInterval(trainingTimerInterval); stopBgm(); 
            finalScore.textContent = `${trainingScore} ひき たおした！`; 
            const isNew = saveBestScore(trainingType, trainingScore);
            const best = loadBestScore(trainingType);
            personalBest.textContent = `じこベスト: ${best} ひき${isNew ? " 🎉" : ""}`;
            trainingScreen.style.display = 'none'; trainingResultScreen.style.display = 'flex'; 
        }
    }, 1000);
}

function quitTraining() {
    if (trainingTimerInterval) { clearInterval(trainingTimerInterval); trainingTimerInterval = null; }
    stopBgm(); playSound('tap');
    document.body.className = ''; 
    trainingScreen.style.display = 'none'; trainingTypeSelectScreen.style.display = 'flex';
}

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

loadBgmSetting(bgmToggleBtn); playerHPText.textContent = playerHP; updateHPBar('playerHPBar', playerHP, playerMaxHP); showModeSelect();
document.getElementById("backToModeFromStartMethodBtn").addEventListener("click", () => { playSound('tap'); showModeSelect(); });
document.getElementById("quitBattleBtn").addEventListener("click", () => { playSound('tap'); battleInProgress = false; stopBgm(); document.body.className = ''; bossDefeatedOverlay.style.display = 'none'; showModeSelect(); });