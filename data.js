// --- 敵データ (Lv1〜60) ---
const enemies = {
    // 1-10: 序盤
    1: { name: "ぷるぷるスライム", emoji: "💧", type: "normal" },
    2: { name: "スライム", emoji: "💧", type: "normal" },
    3: { name: "おおきなスライム", emoji: "💧", type: "normal" },
    4: { name: "ぶきみなコウモリ", emoji: "🦇", type: "normal" },
    5: { name: "吸血コウモリ", emoji: "🧛", type: "normal" },
    6: { name: "さまようゴースト", emoji: "👻", type: "normal" },
    7: { name: "ゴーストチーフ", emoji: "👻", type: "normal" },
    8: { name: "ホネホネスケルトン", emoji: "💀", type: "normal" },
    9: { name: "スケルトンナイト", emoji: "💀", type: "normal" },
    10: { name: "ボス コウモリロード", emoji: "🦇👑", type: "boss" },

    // 11-20: 基礎
    11: { name: "くさったしたい", emoji: "🧟", type: "normal" },
    12: { name: "マッドハンド", emoji: "✋", type: "normal" },
    13: { name: "マッドハンドリーダー", emoji: "✋", type: "normal" },
    14: { name: "ガーゴイル", emoji: "🗿", type: "normal" },
    15: { name: "ストーンマン", emoji: "🗿", type: "normal" },
    16: { name: "オーク", emoji: "🐗", type: "normal" },
    17: { name: "オークリーダー", emoji: "🐗", type: "normal" },
    18: { name: "ミノタウロス", emoji: "🐂", type: "normal" },
    19: { name: "レッドミノタウロス", emoji: "👹", type: "normal" },
    20: { name: "ボス ゴブリンキング", emoji: "👺👑", type: "boss" },

    // 21-30: 中盤
    21: { name: "アイスゴーレム", emoji: "🧊", type: "normal" },
    22: { name: "フレイムゴーレム", emoji: "🔥", type: "normal" },
    23: { name: "マグマゴーレム", emoji: "🌋", type: "normal" },
    24: { name: "キメラ", emoji: "🦁", type: "normal" },
    25: { name: "スターキメラ", emoji: "🌟", type: "normal" },
    26: { name: "レッサーデーモン", emoji: "👿", type: "normal" },
    27: { name: "アークデーモン", emoji: "🔥", type: "normal" },
    28: { name: "ダークナイト", emoji: "🛡️", type: "normal" },
    29: { name: "デスナイト", emoji: "💀", type: "normal" },
    30: { name: "ボス サイクロプス", emoji: "👁️", type: "boss" },

    // 31-40: 穴あき入門
    31: { name: "ミミック", emoji: "📦", type: "normal" },
    32: { name: "人食い箱", emoji: "📦", type: "normal" },
    33: { name: "パンドラボックス", emoji: "🎁", type: "normal" },
    34: { name: "メタルスライム", emoji: "⚙️", type: "normal" },
    35: { name: "はぐれメタル", emoji: "✨", type: "normal" },
    36: { name: "ドラゴン", emoji: "🐉", type: "normal" },
    37: { name: "キースドラゴン", emoji: "🐉", type: "normal" },
    38: { name: "ダースドラゴン", emoji: "🐉", type: "normal" },
    39: { name: "キングヒドラ", emoji: "🐍", type: "normal" },
    40: { name: "ボス ドラゴンゾンビ", emoji: "💀🐉", type: "boss" },

    // 41-50: 応用・穴あき
    41: { name: "魔界の兵士", emoji: "💂", type: "normal" },
    42: { name: "魔界の騎士", emoji: "⚔️", type: "normal" },
    43: { name: "魔界の魔道士", emoji: "🧙", type: "normal" },
    44: { name: "デュラハン", emoji: "🏇", type: "normal" },
    45: { name: "首なし騎士", emoji: "🏇", type: "normal" },
    46: { name: "死神", emoji: "💀", type: "normal" },
    47: { name: "死神貴族", emoji: "🎩", type: "normal" },
    48: { name: "ヘルバトラー", emoji: "👿", type: "normal" },
    49: { name: "アンクルホーン", emoji: "🐂", type: "normal" },
    50: { name: "ボス デスピサロ", emoji: "👽", type: "boss" },

    // 51-59: 総力戦
    51: { name: "メタルキング", emoji: "👑", type: "normal" },
    52: { name: "ゴールデンスライム", emoji: "💰", type: "normal" },
    53: { name: "プラチナキング", emoji: "💎", type: "normal" },
    54: { name: "エスターク", emoji: "🦗", type: "normal" },
    55: { name: "ダークドレアム", emoji: "👿", type: "normal" },
    56: { name: "魔王の右手", emoji: "🤜", type: "normal" },
    57: { name: "魔王の左手", emoji: "🤛", type: "normal" },
    58: { name: "魔王の影", emoji: "👤", type: "normal" },
    59: { name: "魔王親衛隊長", emoji: "⚔️", type: "normal" },
    
    // 60: ラスボス
    60: { name: "大魔王ニャンゾーマ", emoji: "🐈👑", type: "boss" }
};
const maxStage = 60;