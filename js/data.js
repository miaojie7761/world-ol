'use strict';

/* ================= 世界OL 数据层 ================= */

const Data = {};

/* ---------- 职业 ---------- */
Data.CLASSES = {
  warrior: {
    id: 'warrior',
    name: '战士',
    icon: '⚔️',
    color: '#e05a5a',
    desc: '近战职业，拥有最高的生命与防御，擅长正面硬抗敌人。',
    base: { hp: 120, mp: 30, atk: 15, def: 10, spd: 8, crit: 0.05 },
    growth: { hp: 20, mp: 4, atk: 3, def: 2.2, spd: 0.5, crit: 0.002 },
    skills: ['smash', 'whirlwind', 'warcry', 'ironwall', 'sacrifice'],
    defaultWeapon: 'wooden_sword',
    defaultArmor: 'cloth_armor',
  },
  mage: {
    id: 'mage',
    name: '法师',
    icon: '🔮',
    color: '#5a8de0',
    desc: '远程法术职业，法力深厚，拥有强力的范围攻击与治疗能力。',
    base: { hp: 80, mp: 90, atk: 10, def: 5, spd: 7, crit: 0.08 },
    growth: { hp: 14, mp: 10, atk: 2.4, def: 1.2, spd: 0.5, crit: 0.003 },
    skills: ['fireball', 'frostnova', 'arcane', 'heal', 'meteor'],
    defaultWeapon: 'wooden_staff',
    defaultArmor: 'cloth_armor',
  },
  assassin: {
    id: 'assassin',
    name: '刺客',
    icon: '🗡️',
    color: '#9b6ad0',
    desc: '敏捷职业，速度与暴击极高，出手快如闪电，脆皮但致命。',
    base: { hp: 90, mp: 55, atk: 18, def: 6, spd: 15, crit: 0.25 },
    growth: { hp: 15, mp: 6, atk: 3.2, def: 1.4, spd: 1.2, crit: 0.006 },
    skills: ['shadowstrike', 'combo', 'poisonblade', 'phantomstep', 'lethal'],
    defaultWeapon: 'iron_dagger',
    defaultArmor: 'leather_armor',
  },
};

/* ---------- 技能 ---------- */
Data.SKILLS = {
  /* 战士 */
  smash: {
    id: 'smash', name: '猛击', icon: '🔨', mp: 8, unlockLevel: 1, target: 'single',
    desc: '奋力一击，造成 150% 攻击力的伤害。',
    effect: { type: 'damage', multiplier: 1.5 },
  },
  whirlwind: {
    id: 'whirlwind', name: '旋风斩', icon: '🌀', mp: 14, unlockLevel: 3, target: 'all',
    desc: '旋转挥砍，对全体敌人造成 85% 攻击力的伤害。',
    effect: { type: 'damage', multiplier: 0.85 },
  },
  warcry: {
    id: 'warcry', name: '战吼', icon: '📢', mp: 10, unlockLevel: 5, target: 'self',
    desc: '怒吼提振士气，攻击力提升 40%，持续 3 回合。',
    effect: { type: 'buff', stat: 'atk', amount: 0.4, turns: 3 },
  },
  ironwall: {
    id: 'ironwall', name: '铁壁', icon: '🛡️', mp: 10, unlockLevel: 7, target: 'self',
    desc: '进入防御姿态，防御力提升 60%，持续 2 回合。',
    effect: { type: 'buff', stat: 'def', amount: 0.6, turns: 2 },
  },
  sacrifice: {
    id: 'sacrifice', name: '舍身一击', icon: '💥', mp: 20, unlockLevel: 9, target: 'single',
    desc: '燃烧生命的全力一击，造成 250% 攻击力伤害，自身承受 10% 反伤。',
    effect: { type: 'damage', multiplier: 2.5, recoil: 0.1 },
  },

  /* 法师 */
  fireball: {
    id: 'fireball', name: '火球术', icon: '🔥', mp: 10, unlockLevel: 1, target: 'single',
    desc: '投掷火球，造成 180% 攻击力的伤害。',
    effect: { type: 'damage', multiplier: 1.8 },
  },
  frostnova: {
    id: 'frostnova', name: '冰霜新星', icon: '❄️', mp: 16, unlockLevel: 3, target: 'all',
    desc: '冰霜爆裂，对全体造成 100% 伤害，并降低敌人速度 2 回合。',
    effect: { type: 'damage', multiplier: 1.0, debuff: { stat: 'spd', amount: 0.3, turns: 2 } },
  },
  arcane: {
    id: 'arcane', name: '奥术冲击', icon: '💠', mp: 18, unlockLevel: 5, target: 'single',
    desc: '奥术能量爆发，造成 220% 攻击力的伤害。',
    effect: { type: 'damage', multiplier: 2.2 },
  },
  heal: {
    id: 'heal', name: '治疗术', icon: '💚', mp: 15, unlockLevel: 7, target: 'self',
    desc: '召唤神圣之力，恢复自身最大生命值的 45%。',
    effect: { type: 'heal', healRatio: 0.45 },
  },
  meteor: {
    id: 'meteor', name: '陨石术', icon: '☄️', mp: 30, unlockLevel: 9, target: 'all',
    desc: '召唤陨石轰击，对全体造成 190% 攻击力的伤害。',
    effect: { type: 'damage', multiplier: 1.9 },
  },

  /* 刺客 */
  shadowstrike: {
    id: 'shadowstrike', name: '影袭', icon: '🌑', mp: 8, unlockLevel: 1, target: 'single',
    desc: '从阴影中突袭，造成 140% 伤害，暴击率翻倍。',
    effect: { type: 'damage', multiplier: 1.4, critBonus: 0.25 },
  },
  combo: {
    id: 'combo', name: '连击', icon: '⚡', mp: 12, unlockLevel: 3, target: 'single',
    desc: '快速出手两次，每次造成 80% 攻击力的伤害。',
    effect: { type: 'damage', multiplier: 0.8, hits: 2 },
  },
  poisonblade: {
    id: 'poisonblade', name: '毒刃', icon: '☠️', mp: 12, unlockLevel: 5, target: 'single',
    desc: '淬毒一击，造成 85% 伤害并使目标中毒 3 回合。',
    effect: { type: 'damage', multiplier: 0.85, dot: { ratio: 0.12, turns: 3 } },
  },
  phantomstep: {
    id: 'phantomstep', name: '幻影步', icon: '👻', mp: 10, unlockLevel: 7, target: 'self',
    desc: '身形化作幻影，闪避率大幅提升，持续 3 回合。',
    effect: { type: 'buff', stat: 'evade', amount: 0.4, turns: 3 },
  },
  lethal: {
    id: 'lethal', name: '致命一击', icon: '💀', mp: 22, unlockLevel: 9, target: 'single',
    desc: '瞄准要害，造成 200% 伤害并大幅提高暴击率。',
    effect: { type: 'damage', multiplier: 2.0, critBonus: 0.5 },
  },
};

/* ---------- 装备 ---------- */
Data.EQUIP_SLOTS = {
  weapon: '武器',
  armor: '防具',
  accessory: '饰品',
};

Data.QUALITIES = {
  common:     { name: '普通', color: '#c8c8c8', mult: 1.0 },
  uncommon:   { name: '优秀', color: '#4ade80', mult: 1.4 },
  rare:       { name: '稀有', color: '#60a5fa', mult: 1.9 },
  epic:       { name: '史诗', color: '#c084fc', mult: 2.5 },
  legendary:  { name: '传说', color: '#fb923c', mult: 3.2 },
};
Data.QUALITY_WEIGHTS = [
  { key: 'common', w: 45 },
  { key: 'uncommon', w: 30 },
  { key: 'rare', w: 16 },
  { key: 'epic', w: 7 },
  { key: 'legendary', w: 2 },
];

/* 装备模板：base 属性为普通品质数值 */
Data.EQUIPMENT = {
  wooden_sword:  { id: 'wooden_sword',  name: '木剑',     slot: 'weapon',    icon: '🗡️', tier: 1, base: { atk: 4 } },
  wooden_staff:  { id: 'wooden_staff',  name: '木法杖',   slot: 'weapon',    icon: '🪄', tier: 1, base: { atk: 3, mp: 10 } },
  iron_dagger:   { id: 'iron_dagger',   name: '铁匕首',   slot: 'weapon',    icon: '🔪', tier: 1, base: { atk: 5, crit: 0.03 } },
  cloth_armor:   { id: 'cloth_armor',   name: '布甲',     slot: 'armor',     icon: '🥋', tier: 1, base: { def: 2, hp: 10 } },
  life_pendant:  { id: 'life_pendant',  name: '生命吊坠', slot: 'accessory', icon: '📿', tier: 1, base: { hp: 30 } },

  iron_sword:    { id: 'iron_sword',    name: '铁剑',     slot: 'weapon',    icon: '⚔️', tier: 2, base: { atk: 8 } },
  fire_wand:     { id: 'fire_wand',     name: '火焰法杖', slot: 'weapon',    icon: '🕯️', tier: 2, base: { atk: 7, mp: 20 } },
  steel_dagger:  { id: 'steel_dagger',  name: '精钢匕首', slot: 'weapon',    icon: '🔪', tier: 2, base: { atk: 9, crit: 0.05 } },
  leather_armor: { id: 'leather_armor', name: '皮甲',     slot: 'armor',     icon: '🧥', tier: 2, base: { def: 5, hp: 20 } },
  power_ring:    { id: 'power_ring',    name: '力量戒指', slot: 'accessory', icon: '💍', tier: 2, base: { atk: 6 } },

  steel_sword:   { id: 'steel_sword',   name: '精钢长剑', slot: 'weapon',    icon: '🗡️', tier: 3, base: { atk: 13, crit: 0.02 } },
  frost_staff:   { id: 'frost_staff',   name: '寒冰法杖', slot: 'weapon',    icon: '❄️', tier: 3, base: { atk: 11, mp: 30 } },
  chain_armor:   { id: 'chain_armor',   name: '锁子甲',   slot: 'armor',     icon: '🛡️', tier: 3, base: { def: 9, hp: 40 } },
  wind_boots:    { id: 'wind_boots',    name: '疾风之靴', slot: 'accessory', icon: '👢', tier: 3, base: { spd: 4 } },
  mana_ring:     { id: 'mana_ring',     name: '法力戒指', slot: 'accessory', icon: '💍', tier: 3, base: { mp: 40 } },

  dragon_sword:  { id: 'dragon_sword',  name: '龙牙剑',   slot: 'weapon',    icon: '⚔️', tier: 4, base: { atk: 20, crit: 0.05 } },
  arcane_staff:  { id: 'arcane_staff',  name: '奥术法杖', slot: 'weapon',    icon: '✨', tier: 4, base: { atk: 17, mp: 50, crit: 0.04 } },
  plate_armor:   { id: 'plate_armor',   name: '板甲',     slot: 'armor',     icon: '🛡️', tier: 4, base: { def: 14, hp: 70 } },
  sage_stone:    { id: 'sage_stone',    name: '贤者之石', slot: 'accessory', icon: '💎', tier: 4, base: { mp: 40, atk: 5 } },
  shadow_cloak:  { id: 'shadow_cloak',  name: '暗影披风', slot: 'armor',     icon: '🧣', tier: 4, base: { def: 8, spd: 6, crit: 0.05 } },

  flame_blade:   { id: 'flame_blade',   name: '烈焰之刃', slot: 'weapon',    icon: '🔥', tier: 5, base: { atk: 28, crit: 0.08 } },
  dragon_armor:  { id: 'dragon_armor',  name: '龙鳞甲',   slot: 'armor',     icon: '🐉', tier: 5, base: { def: 20, hp: 120 } },
  luck_charm:    { id: 'luck_charm',    name: '幸运护符', slot: 'accessory', icon: '🍀', tier: 5, base: { crit: 0.1, spd: 3 } },
};

/* 各 tier 掉落池 */
Data.EQUIP_POOL = {
  1: ['wooden_sword', 'wooden_staff', 'iron_dagger', 'cloth_armor', 'life_pendant'],
  2: ['iron_sword', 'fire_wand', 'steel_dagger', 'leather_armor', 'power_ring'],
  3: ['steel_sword', 'frost_staff', 'chain_armor', 'wind_boots', 'mana_ring'],
  4: ['dragon_sword', 'arcane_staff', 'plate_armor', 'sage_stone', 'shadow_cloak'],
  5: ['flame_blade', 'dragon_armor', 'luck_charm'],
};

/* ---------- 道具 ---------- */
Data.ITEMS = {
  small_potion:  { id: 'small_potion',  name: '小血瓶', icon: '🧪', type: 'consumable', healHp: 50,  desc: '恢复 50 点生命', price: 30 },
  big_potion:    { id: 'big_potion',    name: '大血瓶', icon: '🧴', type: 'consumable', healHp: 150, desc: '恢复 150 点生命', price: 90 },
  mana_potion:   { id: 'mana_potion',   name: '魔法药水', icon: '💧', type: 'consumable', healMp: 60, desc: '恢复 60 点法力', price: 70 },
};

/* ---------- 怪物 ---------- */
Data.MONSTERS = {
  slime:        { id: 'slime',        name: '史莱姆',   icon: '🟢', hp: 30, atk: 6,  def: 2,  spd: 3,  crit: 0.03, xp: 6,  gold: 5 },
  wolf:         { id: 'wolf',         name: '野狼',     icon: '🐺', hp: 40, atk: 9,  def: 3,  spd: 8,  crit: 0.06, xp: 9,  gold: 7 },
  goblin:       { id: 'goblin',       name: '哥布林',   icon: '👺', hp: 45, atk: 11, def: 4,  spd: 6,  crit: 0.05, xp: 11, gold: 9 },
  skeleton:     { id: 'skeleton',     name: '骷髅兵',   icon: '💀', hp: 55, atk: 13, def: 5,  spd: 6,  crit: 0.05, xp: 14, gold: 11 },
  bat:          { id: 'bat',          name: '巨蝙蝠',   icon: '🦇', hp: 40, atk: 12, def: 2,  spd: 14, crit: 0.08, xp: 13, gold: 10 },
  thief:        { id: 'thief',        name: '盗贼',     icon: '🥷', hp: 60, atk: 15, def: 6,  spd: 10, crit: 0.10, xp: 18, gold: 16 },
  ogre:         { id: 'ogre',         name: '食人魔',   icon: '👹', hp: 90, atk: 18, def: 8,  spd: 4,  crit: 0.04, xp: 22, gold: 18 },
  gargoyle:     { id: 'gargoyle',     name: '石像鬼',   icon: '🗿', hp: 85, atk: 16, def: 12, spd: 5,  crit: 0.04, xp: 24, gold: 20 },
  shadow_mage:  { id: 'shadow_mage',  name: '暗影法师', icon: '🧙', hp: 70, atk: 20, def: 7,  spd: 9,  crit: 0.10, xp: 26, gold: 22 },
  skele_king:   { id: 'skele_king',   name: '骷髅王',   icon: '👑', hp: 120, atk: 22, def: 10, spd: 8, crit: 0.08, xp: 40, gold: 40, boss: true },
  troll:        { id: 'troll',        name: '山岭巨魔', icon: '🧌', hp: 130, atk: 20, def: 14, spd: 3,  crit: 0.04, xp: 34, gold: 30 },
  two_head_dragon: { id: 'two_head_dragon', name: '双头龙', icon: '🐲', hp: 160, atk: 26, def: 12, spd: 10, crit: 0.07, xp: 42, gold: 38 },
  shadow_assassin: { id: 'shadow_assassin', name: '暗影刺客', icon: '🌪️', hp: 100, atk: 28, def: 10, spd: 16, crit: 0.15, xp: 40, gold: 35 },
  demon_lord:   { id: 'demon_lord',   name: '恶魔领主', icon: '😈', hp: 200, atk: 30, def: 15, spd: 12, crit: 0.10, xp: 80, gold: 100, boss: true },
};

/* ---------- 关卡 ---------- */
Data.DUNGEONS = [
  { id: 1,  name: '试炼之森',   icon: '🌲', minLevel: 1, tier: 1, goldReward: 20, xpReward: 15,
    desc: '新手冒险者最初的试炼场。', waves: [['slime'], ['slime', 'slime'], ['wolf']] },
  { id: 2,  name: '荒狼平原',   icon: '🏞️', minLevel: 3, tier: 1, goldReward: 30, xpReward: 22,
    desc: '野狼成群出没的草原。', waves: [['wolf', 'slime'], ['wolf', 'wolf'], ['goblin']] },
  { id: 3,  name: '哥布林洞穴', icon: '🕳️', minLevel: 5, tier: 2, goldReward: 45, xpReward: 30,
    desc: '狡猾的哥布林盘踞的巢穴。', waves: [['goblin', 'goblin'], ['goblin', 'wolf'], ['thief']] },
  { id: 4,  name: '亡者墓地',   icon: '⚰️', minLevel: 7, tier: 2, goldReward: 60, xpReward: 40,
    desc: '沉睡的亡灵苏醒之地。', waves: [['skeleton', 'bat'], ['skeleton', 'skeleton'], ['skeleton', 'shadow_mage']] },
  { id: 5,  name: '盗贼营地',   icon: '⛺', minLevel: 9, tier: 3, goldReward: 80, xpReward: 52,
    desc: '盘踞山林的盗贼团伙。', waves: [['thief', 'bat'], ['thief', 'thief'], ['gargoyle']] },
  { id: 6,  name: '巨人峡谷',   icon: '🏔️', minLevel: 11, tier: 3, goldReward: 100, xpReward: 65,
    desc: '食人魔与巨魔出没的深谷。', waves: [['ogre', 'goblin'], ['ogre', 'ogre'], ['troll']] },
  { id: 7,  name: '古堡废墟',   icon: '🏰', minLevel: 13, tier: 4, goldReward: 130, xpReward: 80,
    desc: '古老城堡的残垣断壁。', waves: [['gargoyle', 'skeleton'], ['gargoyle', 'shadow_mage'], ['skeleton', 'shadow_mage']] },
  { id: 8,  name: '暗影圣殿',   icon: '🌌', minLevel: 15, tier: 4, goldReward: 160, xpReward: 100,
    desc: '暗影力量笼罩的圣殿。', waves: [['shadow_mage', 'thief'], ['shadow_mage', 'shadow_mage'], ['shadow_assassin']] },
  { id: 9,  name: '骷髅王座',   icon: '💀', minLevel: 17, tier: 4, goldReward: 200, xpReward: 130,
    desc: '骷髅王的领地，亡灵的终点。', waves: [['skeleton', 'skeleton', 'bat'], ['shadow_mage', 'skeleton'], ['skele_king']] },
  { id: 10, name: '魔龙之巅',   icon: '🐲', minLevel: 19, tier: 5, goldReward: 260, xpReward: 170,
    desc: '巨龙盘旋的山巅，终焉战场。', waves: [['troll', 'shadow_assassin'], ['two_head_dragon', 'shadow_mage'], ['two_head_dragon', 'troll']] },
  { id: 11, name: '恶魔深渊',   icon: '😈', minLevel: 21, tier: 5, goldReward: 400, xpReward: 250,
    desc: '深渊之主坐镇的最终试炼！', waves: [['two_head_dragon', 'shadow_mage'], ['shadow_assassin', 'two_head_dragon'], ['demon_lord']] },
];

/* ---------- 工具函数 ---------- */

/* 随机品质 */
Data.rollQuality = function () {
  let total = 0;
  for (const q of Data.QUALITY_WEIGHTS) total += q.w;
  let roll = Math.random() * total;
  for (const q of Data.QUALITY_WEIGHTS) {
    roll -= q.w;
    if (roll <= 0) return q.key;
  }
  return 'common';
};

/* 生成装备实例（含品质与强化后的属性） */
Data.makeItem = function (templateId, quality) {
  const tpl = Data.EQUIPMENT[templateId];
  if (!tpl) return null;
  const q = quality || Data.rollQuality();
  const qDef = Data.QUALITIES[q];
  const stats = {};
  for (const key in tpl.base) {
    stats[key] = Math.round(tpl.base[key] * qDef.mult * 100) / 100;
  }
  return {
    uid: Math.random().toString(36).slice(2, 10),
    id: tpl.id,
    name: tpl.name,
    icon: tpl.icon,
    slot: tpl.slot,
    quality: q,
    stats: stats,
    sellPrice: Math.round(10 * tpl.tier * qDef.mult),
  };
};

/* 掉落装备：根据关卡 tier 与幸运值决定 */
Data.rollLoot = function (tier, luck) {
  const baseChance = 0.18 + (luck || 0) * 3;
  if (Math.random() > baseChance) return null;
  const pool = Data.EQUIP_POOL[tier] || Data.EQUIP_POOL[5];
  const tplId = pool[Math.floor(Math.random() * pool.length)];
  return Data.makeItem(tplId);
};

/* 金币与经验浮动 */
Data.rollRange = function (base) {
  return Math.round(base * (0.85 + Math.random() * 0.3));
};

/* 根据关卡 id 获取关卡 */
Data.getDungeon = function (id) {
  return Data.DUNGEONS.find(d => d.id === id);
};

/* 获取已解锁技能 */
Data.getUnlockedSkills = function (clsId, level) {
  const cls = Data.CLASSES[clsId];
  return cls.skills
    .map(sid => Data.SKILLS[sid])
    .filter(s => level >= s.unlockLevel);
};
