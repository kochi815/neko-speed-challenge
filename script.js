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
const trainingEnemies = ["💧","🦇","👻","💀","🐗","🧊","🔥","🗿","👺","🐉","👽"];

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

// --- ★難易度調整: 計測データに基づくタイム設定 ---
function getProblemTimeLimit(mode, type, qText) {
    let limits = [1.5, 2.5, 4.0, 7.0]; 

    if (mode === 'grade1') {
        if (type === '+' || type === '-') {
            const isTwoDigit = /[1-9][0-9]/.test(qText); 
            if (isTwoDigit) {
                limits = [3.0, 5.0, 6.25, 10.0];
            } else {
                limits = [1.0, 1.5, 1.92, 2.1];
            }
        }
    }
    else if (mode === 'grade4') {
        if (type === '+' || type === '-') {
            limits = [1.5, 2.0, 2.5, 3.35];
        } else if (type === '×') {
            limits = [0.8, 1.2, 1.56, 2.2];
        } else if (type === '÷') {
            limits = [0.8, 1.1, 1.35, 1.6];
        }
    }
    if (qText.includes('□')) return limits.map(t => t + 1.5);
    return limits;
}

// --- 問題生成 (通常バトル用) ---
function generateProblems(stage, mode, count) {
    const generatedProblems = [];
    let num1, num2;
    function createProblem(op, n1, n2, ans, holePos = 0) {
        if (holePos === 0) return { q: `${n1} ${op} ${n2}`, a: ans, type: op };
        if (holePos === 1) return { q: `□ ${op} ${n2} = ${ans}`, a: n1, type: op };
        return { q: `${n1} ${op} □ = ${ans}`, a: n2, type: op };
    }
    for (let i = 0; i < count; i++) {
        try {
            if (mode === 'grade1') {
                if (stage <= 10) {
                    if (Math.random() < 0.6) { num1=Math.floor(Math.random()*11); num2=Math.floor(Math.random()*(11-num1)); generatedProblems.push(createProblem('+',num1,num2,num1+num2)); }
                    // ★修正: 答えが0にならないように、かつ簡単な引き算
                    else { 
                        num1 = Math.floor(Math.random() * 9) + 2; 
                        num2 = Math.floor(Math.random() * (num1 - 1)) + 1; 
                        generatedProblems.push(createProblem('-',num1,num2,num1-num2)); 
                    }
                } else if (stage <= 20) {
                    if (Math.random() < 0.5) { num1=Math.floor(Math.random()*9)+2; num2=Math.floor(Math.random()*9)+2; generatedProblems.push(createProblem('+',num1,num2,num1+num2)); }
                    else { num1=Math.floor(Math.random()*11)+10; num2=Math.floor(Math.random()*9)+1; generatedProblems.push(createProblem('-',num1,num2,num1-num2)); }
                } else if (stage <= 30) {
                    if (Math.random() < 0.5) { num1=Math.floor(Math.random()*20)+1; num2=Math.floor(Math.random()*20)+1; generatedProblems.push(createProblem('+',num1,num2,num1+num2)); }
                    else { num1=Math.floor(Math.random()*30)+10; num2=Math.floor(Math.random()*10)+1; generatedProblems.push(createProblem('-',num1,num2,num1-num2)); }
                } else {
                    const hole = Math.random() < 0.5 ? 1 : 2;
                    num1=Math.floor(Math.random()*15)+5; num2=Math.floor(Math.random()*10); generatedProblems.push(createProblem('+',num1,num2,num1+num2,hole));
                }
            } else if (mode === 'grade4') {
                if (stage <= 10) {
                    if (Math.random() < 0.5) { num1=Math.floor(Math.random()*80)+10; num2=Math.floor(Math.random()*80)+10; generatedProblems.push(createProblem('+',num1,num2,num1+num2)); }
                    else { num1=Math.floor(Math.random()*80)+20; num2=Math.floor(Math.random()*(num1-10))+10; generatedProblems.push(createProblem('-',num1,num2,num1-num2)); }
                } else if (stage <= 20) {
                    if (Math.random() < 0.6) { num1=Math.floor(Math.random()*80)+10; num2=Math.floor(Math.random()*8)+2; generatedProblems.push(createProblem('×',num1,num2,num1*num2)); }
                    else { const ans=Math.floor(Math.random()*20)+2; num2=Math.floor(Math.random()*8)+2; generatedProblems.push(createProblem('÷',ans*num2,num2,ans)); }
                } else {
                    const r = Math.random();
                    if (r < 0.5) { num1=Math.floor(Math.random()*50)+10; num2=Math.floor(Math.random()*40)+10; generatedProblems.push(createProblem('+',num1,num2,num1+num2, Math.random()<0.5?1:2)); }
                    else { const ans=Math.floor(Math.random()*15)+2; num2=Math.floor(Math.random()*9)+2; generatedProblems.push(createProblem('÷',ans*num2,num2,ans, Math.random()<0.5?1:2)); }
                }
            }
        } catch(e) { generatedProblems.push({q:"1+1", a:2, type:'+'}); }
    }
    return generatedProblems;
}

function generateChoices(correct) { 
    const choices = new Set(); correct = Math.round(correct); choices.add(correct);
    let attempts = 0; while (choices.size < 5 && attempts < 50) { 
        let d = Math.floor(Math.random() * 20) - 10; if (d === 0) d = 1; 
        let w = correct + d; if (w >= 0 && !choices.has(w)) choices.add(w); attempts++; 
    } 
    let filler = 1; while (choices.size < 5) { 
        let w1 = Math.max(0, correct + filler), w2 = Math.max(0, correct - filler); 
        if (!choices.has(w1)) choices.add(w1); if (choices.size < 5 && !choices.has(w2)) choices.add(w2); filler++; 
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

// --- 回答処理 ---
function handleAnswer(selectedAnswer) {
    if (battleInProgress) return; battleInProgress = true;
    answerChoicesDiv.querySelectorAll('.choice-btn').forEach(b => b.disabled = true); playSound('tap');
    const elapsed = (Date.now() - questionStartTime) / 1000; const p = problems[currentProblemIndex];
    const [criticalTime, perfectTime, greatTime, goodTime] = getProblemTimeLimit(gameMode, p.type, p.q);
    
    let baseDamage = 10, damageToEnemy = 0, damageToPlayer = 0, logMessage = "", feedbackText = "", feedbackType = "", isCritical = false, speedBonus = 1.0;

    if (selectedAnswer === p.a) {
        // 正解のとき
        comboCount++;
        
        // 判定ロジック
        if (elapsed < criticalTime) { feedbackText = "Critical!!"; feedbackType = "critical"; isCritical = true; speedBonus = 1.5; }
        else if (elapsed < perfectTime) { feedbackText = "Perfect!"; feedbackType = "perfect"; speedBonus = 1.15; }
        else if (elapsed < greatTime) { feedbackText = "Great!"; feedbackType = "great"; speedBonus = 1.0; }
        else if (elapsed < goodTime) { feedbackText = "Good"; feedbackType = "good"; speedBonus = 0.9; }
        else { 
            // Slowの場合
            feedbackText = "Slow..."; 
            feedbackType = "slow"; 
            speedBonus = 0.5; // 威力半分
            if (gameMode !== 'grade1') comboCount = 0; 
        }

        // ダメージ計算
        let comboMultiplier = 1.0;
        if (comboCount >= 10) comboMultiplier = 1.2;
        else if (comboCount >= 5) comboMultiplier = 1.1;
        else if (comboCount >= 2) comboMultiplier = 1.05;
        damageToEnemy = Math.floor(baseDamage * speedBonus * comboMultiplier);
        
        let pitch = 1.0 + (Math.min(comboCount, 10) * 0.05);
        playSound('correct', 1.0, 0.5); 

        // ログメッセージと効果音の分岐
        if (isCritical) {
            logMessage = `会心の一撃！敵に${damageToEnemy}ダメージ!`;
            playSound('hitCritical', pitch);
            if (Math.random() < 0.7) playSound('voiceSkill'); 
            else playRandomAttackVoice();
        } else {
            if (feedbackType === "perfect") {
                logMessage = `敵に${damageToEnemy}ダメージ!`;
                playSound('hitPerfect', pitch); 
            } else if (feedbackType === "great") {
                logMessage = `敵に${damageToEnemy}ダメージ!`;
                playSound('hitGreat', pitch);   
            } else if (feedbackType === "good") {
                logMessage = `敵に${damageToEnemy}ダメージ!`;
                playSound('hitGood', pitch);    
            } else {
                // Slowの場合: 弱い音
                logMessage = `おっと！当たりが弱い！${damageToEnemy}ダメージ`;
                playSound('hitGood', 0.6); 
            }

            // Slow以外なら通常攻撃ボイス
            if (feedbackType !== "slow") {
                if (comboCount >= 5 && Math.random() < 0.4) playSound('voiceSkill');
                else playRandomAttackVoice();
            }
        }

        document.body.classList.add('feedback-flash'); setTimeout(() => document.body.classList.remove('feedback-flash'), 150);
        shakeCharacter('enemyCharacter'); showDamageEffect(damageToEnemy, isCritical);
        
        // ★修正: Slowの時は絶対に「奥義ボイス」を鳴らさない
        // かつ、コンボが0（リセットされた直後）の時も鳴らさない
        if (feedbackType !== "slow" && comboCount > 0) {
            if (comboCount % 5 === 0 || comboCount === 3) {
                playSound('comboMilestone');
            }
        }

    } else {
        // 不正解のとき
        playSound('wrong'); damageToPlayer = 1;
        let healAmount = Math.max(1, Math.floor(enemyMaxHP * 0.05));
        if (enemyHP + healAmount > enemyMaxHP) healAmount = enemyMaxHP - enemyHP; 
        enemyHP += healAmount; logMessage = `Miss! 敵が${healAmount}回復した...`;
        feedbackText = "Heal..."; feedbackType = "wrong"; comboCount = 0;
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
    questionsForThisStage = (currentEnemy.type === 'boss') ? 35 : 20;
    
    let stageProgress = currentStage % 10;
    if (stageProgress === 0) stageProgress = 10;
    const difficultyScale = { 1: 0.30, 2: 0.35, 3: 0.40, 4: 0.45, 5: 0.50, 6: 0.60, 7: 0.70, 8: 0.80, 9: 0.90, 10: 1.00 };

    let multiplier = difficultyScale[stageProgress];
    enemyMaxHP = Math.floor((questionsForThisStage * 10) * multiplier);
    if (gameMode === 'grade1') enemyMaxHP = Math.floor(enemyMaxHP * 1);

    enemyHP = Math.max(5, enemyMaxHP); playerHP = playerMaxHP; currentProblemIndex = 0; comboCount = 0;
    updateComboDisplay(); problems = generateProblems(currentStage, gameMode, questionsForThisStage);
    enemyName.textContent = `${currentEnemy.emoji} ${currentEnemy.name} (Lv${currentStage})`;
    enemyHPText.textContent = enemyHP; playerHPText.textContent = playerHP;
    updateHPBar('enemyHPBar', enemyHP, enemyMaxHP); updateHPBar('playerHPBar', playerHP, playerMaxHP);
    enemyCharacter.textContent = currentEnemy.emoji; enemyCharacter.classList.remove('defeated');
    stopBgm();
    
    if (currentEnemy.type === 'boss') { 
        document.body.classList.add('boss-battle-bg'); 
        battleLog.textContent = `🔥【BOSS】${currentEnemy.name} 出現！🔥`; 
        playBgm('bgmBoss'); 
        setTimeout(() => {
            if (Math.random() < 0.5) playSound('voiceBoss1');
            else playSound('voiceBoss2');
        }, 500);
    }
    else { 
        document.body.classList.remove('boss-battle-bg'); 
        battleLog.textContent = `Lv${currentStage} ${currentEnemy.name} があらわれた！`; 
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

            bossDefeatedMessage.textContent = `🎉 ${currentEnemy.name} 撃破！ 🎉`;
            bossDefeatedOverlay.style.display = 'flex'; bossDefeatedOverlay.style.opacity = '1';
            bossDefeatedMessage.style.opacity = '1'; bossDefeatedMessage.style.transform = 'scale(1)';
            setTimeout(() => { bossDefeatedOverlay.style.opacity = '0'; setTimeout(() => bossDefeatedOverlay.style.display = 'none', 500); }, 3000);
            battleLog.textContent = `すごい！ボス ${currentEnemy.name} をたおした！🏆`;
        } else { battleLog.textContent = `🎉勝利！ ${currentEnemy.name} をたおした！🎉`; }
        saveHighestStage(gameMode, currentStage); currentStage++;
        if (currentStage > maxStage) { battleLog.textContent += " 🏆全クリア！"; startBtn.style.display = "none"; }
        else { startBtn.textContent = `次の敵 (Lv${currentStage}) へ`; startBtn.style.display = "inline-block"; }
    } else {
        battleLog.textContent = "😭敗北...また挑戦してね！"; startBtn.textContent = "再挑戦！"; startBtn.style.display = "inline-block";
    }
}

// --- ★トレーニング (修正版) ---
function generateTrainingProblem(type) {
    let num1, num2;
    // 便利なランダム関数
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    // 穴あき作成ヘルパー
    function createHole(n1, opStr, n2, ans) {
        return Math.random() < 0.5
          ? { q: `□ ${opStr} ${n2} = ${ans}`, a: n1 }
          : { q: `${n1} ${opStr} □ = ${ans}`, a: n2 };
    }

    switch (type) {
        // --- 1年生レベル ---
        case 'addsub1':
            return Math.random() < 0.6
                ? { q: `${num1 = randInt(0, 10)} + ${num2 = randInt(0, 10 - num1)}`, a: num1 + num2 }
                : { q: `${num1 = randInt(2, 10)} - ${num2 = randInt(1, num1 - 1)}`, a: num1 - num2 }; // 0にならないよう調整

        case 'addsub1_hole':
            return Math.random() < 0.6
                ? createHole(num1 = randInt(0, 10), '+', num2 = randInt(0, 10 - num1), num1 + num2)
                : createHole(num1 = randInt(2, 10), '-', num2 = randInt(1, num1 - 1), num1 - num2);

        // --- 2〜3桁・繰り上がり等 ---
        case 'addsub2': {
            if (Math.random() < 0.6) {
                num1 = randInt(10, 89);
                num2 = randInt(10, 99 - num1); // 答えを最大99に
                return { q: `${num1} + ${num2}`, a: num1 + num2 };
            } else {
                num1 = randInt(20, 99);
                num2 = randInt(10, num1);
                return { q: `${num1} - ${num2}`, a: num1 - num2 };
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

        // --- かけ算 ---
        case 'mul':
            num1 = randInt(2, 9);
            num2 = randInt(2, 9);
            return { q: `${num1} × ${num2}`, a: num1 * num2 };

        case 'mul_hole':
            num1 = randInt(2, 9);
            num2 = randInt(2, 9);
            return createHole(num1, '×', num2, num1 * num2);

        // --- わり算 ---
        case 'div':
            num2 = randInt(2, 9);
            num1 = randInt(2, 9);
            return { q: `${num2 * num1} ÷ ${num2}`, a: num1 };

        case 'div_hole': {
            const divisor = randInt(2, 9);
            const quotient = randInt(2, 9);
            const dividend = divisor * quotient;
            return Math.random() < 0.5
                ? { q: `□ ÷ ${divisor} = ${quotient}`, a: dividend }
                : { q: `${dividend} ÷ □ = ${quotient}`, a: divisor };
        }

        default:
            return { q: "1 + 1", a: 2 };
    }
}

// ★敵キャラ入れ替え演出
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
                popTrainingEnemy(); // ★敵を変える
                showFeedback("Correct!", "perfect"); 
            } else { 
                playSound('wrong'); 
                trainingTimeRemaining = Math.max(0, trainingTimeRemaining - 5); 
                showFeedback("Wrong!", "wrong"); 
            }
            trainingScoreDisplay.textContent = `たおした数: ${trainingScore}`; 
            setTimeout(showTrainingQuestion, 200);
        }; 
        trainingAnswerChoices.appendChild(btn);
    }); 
    battleInProgress = false;
}

function startTraining(type) {
    // ★バグ修正: タイマー重複防止
    if (trainingTimerInterval) { clearInterval(trainingTimerInterval); trainingTimerInterval = null; }

    gameMode = 'training'; 
    trainingType = type; 
    trainingScore = 0; 
    trainingTimeRemaining = trainingTimeLimit;
    
    // ★追加: スタート直後に画面の表示も即リセットする（これがChatGPTの提案部分です）
    trainingTimer.textContent = `のこり時間: ${trainingTimeRemaining}秒`;
    trainingScoreDisplay.textContent = `たおした数: ${trainingScore}`;

    modeSelectScreen.style.display = 'none'; 
    trainingTypeSelectScreen.style.display = 'none'; 
    trainingScreen.style.display = 'flex';
    document.body.className = 'training-bg'; 
    playBgm('bgmTraining'); 
    
    // 初期敵キャラセット
    trainingEnemyDisplay.textContent = trainingEnemies[Math.floor(Math.random() * trainingEnemies.length)];
    
    showTrainingQuestion();
    
    trainingTimerInterval = setInterval(() => {
        trainingTimeRemaining--; 
        trainingTimer.textContent = `のこり時間: ${trainingTimeRemaining}秒`;
        
        if (trainingTimeRemaining <= 0) { 
            clearInterval(trainingTimerInterval); 
            stopBgm(); 
            
            // 結果画面表示と自己ベスト更新
            finalScore.textContent = `${trainingScore} ひき たおした！`; 
            const isNew = saveBestScore(trainingType, trainingScore);
            const best = loadBestScore(trainingType);
            personalBest.textContent = `じこベスト: ${best} ひき${isNew ? " 🎉" : ""}`;

            trainingScreen.style.display = 'none'; 
            trainingResultScreen.style.display = 'flex'; 
        }
    }, 1000);
}

function quitTraining() {
    if (trainingTimerInterval) { clearInterval(trainingTimerInterval); trainingTimerInterval = null; }
    stopBgm(); playSound('tap');
    
    document.body.className = ''; // ★バグ修正: 背景リセット
    
    trainingScreen.style.display = 'none'; 
    trainingTypeSelectScreen.style.display = 'flex';
}

// --- メニュー ---
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
loadBgmSetting(bgmToggleBtn); playerHPText.textContent = playerHP; updateHPBar('playerHPBar', playerHP, playerMaxHP); showModeSelect();


// スタート方法選択画面から「もどる」
document.getElementById("backToModeFromStartMethodBtn").addEventListener("click", () => {
    playSound('tap');
    showModeSelect();
});

// バトル画面から「中断してメニューへ」
document.getElementById("quitBattleBtn").addEventListener("click", () => {
    playSound('tap');
    battleInProgress = false;
    stopBgm();
    document.body.className = ''; 
    bossDefeatedOverlay.style.display = 'none';
    showModeSelect();
});


