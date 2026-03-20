// --- 敵データ (Lv1〜60) ---
// テーマ: ドラゴン最強王図鑑の軍団
const enemies = {
    // === 1-10: 炎の洞窟（ファイヤードレイクの領域）===
    1:  { name: "ちびサラマンダー", emoji: "🦎", type: "normal" },
    2:  { name: "ファイアリザード", emoji: "🦎🔥", type: "normal" },
    3:  { name: "マグマスライム", emoji: "🟠", type: "normal" },
    4:  { name: "フレイムバット", emoji: "🦇🔥", type: "normal" },
    5:  { name: "ようがんガメ", emoji: "🐢", type: "normal" },
    6:  { name: "ヒートスネーク", emoji: "🐍", type: "normal" },
    7:  { name: "ファイアワイバーン", emoji: "🔥", type: "normal" },
    8:  { name: "フレイムナイト", emoji: "⚔️", type: "normal" },
    9:  { name: "ようがんドラゴン", emoji: "🌋", type: "normal" },
    10: { name: "ボス ファイヤードレイク", emoji: "🐉🔥", type: "boss" },

    // === 11-20: 嵐の山脈（ヴリトラの領域）===
    11: { name: "かぜのせい", emoji: "🌬️", type: "normal" },
    12: { name: "サンダーバード", emoji: "🦅⚡", type: "normal" },
    13: { name: "ストームウルフ", emoji: "🐺", type: "normal" },
    14: { name: "いなずまトカゲ", emoji: "⚡", type: "normal" },
    15: { name: "スカイドレイク", emoji: "☁️", type: "normal" },
    16: { name: "かみなりゴーレム", emoji: "🗿⚡", type: "normal" },
    17: { name: "テンペストイーグル", emoji: "🦅", type: "normal" },
    18: { name: "ストームドラゴン", emoji: "🌩️", type: "normal" },
    19: { name: "ヴリトラのかげ", emoji: "👤", type: "normal" },
    20: { name: "ボス ヴリトラ", emoji: "🐉⚡", type: "boss" },

    // === 21-30: 深海の神殿（レヴィアタンの領域）===
    21: { name: "バブルスライム", emoji: "🫧", type: "normal" },
    22: { name: "シードラゴン", emoji: "🐟", type: "normal" },
    23: { name: "うみへびソルジャー", emoji: "🐍🌊", type: "normal" },
    24: { name: "クラーケンのうで", emoji: "🦑", type: "normal" },
    25: { name: "アビスシャーク", emoji: "🦈", type: "normal" },
    26: { name: "こおりのまじん", emoji: "🧊", type: "normal" },
    27: { name: "タイダルドレイク", emoji: "🌊", type: "normal" },
    28: { name: "しんかいのばんにん", emoji: "🐙", type: "normal" },
    29: { name: "レヴィアタンのうろこ", emoji: "💎", type: "normal" },
    30: { name: "ボス レヴィアタン", emoji: "🐉🌊", type: "boss" },

    // === 31-40: 黄金の迷宮（ファフニールの領域）===
    31: { name: "トレジャーミミック", emoji: "📦", type: "normal" },
    32: { name: "ゴールドゴーレム", emoji: "🥇", type: "normal" },
    33: { name: "ダイヤモンドバット", emoji: "💎🦇", type: "normal" },
    34: { name: "きんのサラマンダー", emoji: "✨🦎", type: "normal" },
    35: { name: "アーマードレイク", emoji: "🛡️", type: "normal" },
    36: { name: "ジュエルスネーク", emoji: "💍", type: "normal" },
    37: { name: "どくのドラゴン", emoji: "☠️", type: "normal" },
    38: { name: "プラチナナイト", emoji: "⚔️✨", type: "normal" },
    39: { name: "ファフニールのつめ", emoji: "🐾", type: "normal" },
    40: { name: "ボス ファフニール", emoji: "🐉💰", type: "boss" },

    // === 41-50: 天空の城（バハムートの領域）===
    41: { name: "そらのみはり", emoji: "👁️", type: "normal" },
    42: { name: "ホーリーグリフォン", emoji: "🦁", type: "normal" },
    43: { name: "てんくうのきし", emoji: "⚔️☁️", type: "normal" },
    44: { name: "ひかりのせいれい", emoji: "✨", type: "normal" },
    45: { name: "スターワイバーン", emoji: "⭐", type: "normal" },
    46: { name: "コスモドレイク", emoji: "🌙", type: "normal" },
    47: { name: "てんくうのまどうし", emoji: "🧙", type: "normal" },
    48: { name: "ギャラクシードラゴン", emoji: "🌌", type: "normal" },
    49: { name: "バハムートのつばさ", emoji: "🪽", type: "normal" },
    50: { name: "ボス バハムート", emoji: "🐉⭐", type: "boss" },

    // === 51-59: 暗黒の玉座（アジ・ダハーカの領域）===
    51: { name: "ダークスライムキング", emoji: "👑", type: "normal" },
    52: { name: "やみのドレイク", emoji: "🌑", type: "normal" },
    53: { name: "しにがみドラゴン", emoji: "💀", type: "normal" },
    54: { name: "カオスワイバーン", emoji: "🖤", type: "normal" },
    55: { name: "あんこくのまどうし", emoji: "🧙‍♂️", type: "normal" },
    56: { name: "ダハーカのみぎて", emoji: "🤜", type: "normal" },
    57: { name: "ダハーカのひだりて", emoji: "🤛", type: "normal" },
    58: { name: "やみのしんえいたい", emoji: "⚔️🌑", type: "normal" },
    59: { name: "ダハーカのかげ", emoji: "👤🖤", type: "normal" },

    // === 60: ラスボス ===
    60: { name: "だいまりゅうアジ・ダハーカ", emoji: "🐉👑", type: "boss" }
};
const maxStage = 60;