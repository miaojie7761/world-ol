'use strict';

/* ================= 世界OL 状态管理 ================= */

const State = {
  SAVE_KEY: 'world-ol-save-v1',
  data: null,

  /* ---------- 存档 ---------- */
  hasSave() {
    try { return localStorage.getItem(this.SAVE_KEY) !== null; } catch (e) { return false; }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;
      this.data = JSON.parse(raw);
      return this.data;
    } catch (e) {
      this.data = null;
      return null;
    }
  },

  save() {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
    } catch (e) { /* 忽略存储失败 */ }
  },

  reset() {
    try { localStorage.removeItem(this.SAVE_KEY); } catch (e) { /* ignore */ }
    this.data = null;
  },

  /* ---------- 角色 ---------- */
  newGame(name, classId) {
    const cls = Data.CLASSES[classId];
    this.data = {
      name: name || '无名冒险者',
      classId: classId,
      level: 1,
      xp: 0,
      gold: 30,
      hp: cls.base.hp,
      mp: cls.base.mp,
      equip: {
        weapon: Data.makeItem(cls.defaultWeapon, 'common'),
        armor: Data.makeItem(cls.defaultArmor, 'common'),
        accessory: null,
      },
      bag: [
        { ...Data.ITEMS.small_potion, uid: 'bag-0' },
        { ...Data.ITEMS.small_potion, uid: 'bag-1' },
      ],
      dungeonProgress: 1,
      kills: 0,
      victory: 0,
      defeats: 0,
    };
    this.save();
    return this.data;
  },

  getClass() {
    return Data.CLASSES[this.data.classId];
  },

  /* ---------- 属性计算 ---------- */
  baseStats() {
    const cls = this.getClass();
    const lv = this.data.level;
    const stats = {};
    for (const key in cls.base) {
      stats[key] = cls.base[key] + cls.growth[key] * (lv - 1);
    }
    stats.hp = Math.round(stats.hp);
    stats.mp = Math.round(stats.mp);
    stats.atk = Math.round(stats.atk);
    stats.def = Math.round(stats.def);
    stats.spd = Math.round(stats.spd * 10) / 10;
    stats.crit = Math.round(stats.crit * 1000) / 1000;
    return stats;
  },

  gearStats() {
    const stats = { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, crit: 0 };
    for (const slot in this.data.equip) {
      const item = this.data.equip[slot];
      if (!item) continue;
      for (const key in item.stats) {
        stats[key] = (stats[key] || 0) + item.stats[key];
      }
    }
    return stats;
  },

  getStats() {
    const base = this.baseStats();
    const gear = this.gearStats();
    const stats = {};
    for (const key in base) stats[key] = base[key] + (gear[key] || 0);
    stats.crit = Math.min(0.9, stats.crit);
    return stats;
  },

  maxHp() { return Math.round(this.getStats().hp); },
  maxMp() { return Math.round(this.getStats().mp); },

  currentHp() { return Math.min(this.data.hp, this.maxHp()); },
  currentMp() { return Math.min(this.data.mp, this.maxMp()); },

  heal(amount) {
    this.data.hp = Math.min(this.maxHp(), this.data.hp + amount);
  },
  healFull() {
    this.data.hp = this.maxHp();
    this.data.mp = this.maxMp();
  },
  spendMp(amount) {
    this.data.mp = Math.max(0, this.data.mp - amount);
  },
  takeDamage(amount) {
    this.data.hp = Math.max(0, this.data.hp - amount);
    return this.data.hp <= 0;
  },

  /* ---------- 经验与金币 ---------- */
  xpNeeded(level) {
    return Math.round(Math.pow(level, 1.6) * 12 + level * 8);
  },

  addXp(amount) {
    const gained = Math.round(amount);
    this.data.xp += gained;
    let leveled = [];
    while (this.data.xp >= this.xpNeeded(this.data.level)) {
      this.data.xp -= this.xpNeeded(this.data.level);
      this.data.level += 1;
      leveled.push(this.data.level);
      this.data.hp = this.maxHp();
      this.data.mp = this.maxMp();
    }
    return { gained, leveled };
  },

  addGold(amount) {
    this.data.gold += Math.round(amount);
  },

  /* ---------- 背包 ---------- */
  addItem(item) {
    if (this.data.bag.length >= 40) return false;
    this.data.bag.push(item);
    return true;
  },

  removeItem(uid) {
    const idx = this.data.bag.findIndex(it => it.uid === uid);
    if (idx >= 0) this.data.bag.splice(idx, 1);
  },

  getItem(uid) {
    return this.data.bag.find(it => it.uid === uid);
  },

  usePotion(uid) {
    const item = this.getItem(uid);
    if (!item || item.type !== 'consumable') return null;
    if (item.healHp) {
      this.data.hp = Math.min(this.maxHp(), this.data.hp + item.healHp);
    }
    if (item.healMp) {
      this.data.mp = Math.min(this.maxMp(), this.data.mp + item.healMp);
    }
    this.removeItem(uid);
    return item;
  },

  sellItem(uid) {
    const item = this.getItem(uid);
    if (!item) return 0;
    this.data.gold += item.sellPrice || 1;
    this.removeItem(uid);
    return item.sellPrice || 1;
  },

  countPotions() {
    let n = 0;
    for (const it of this.data.bag) {
      if (it.type === 'consumable') n++;
    }
    return n;
  },

  /* ---------- 装备 ---------- */
  equipItem(uid) {
    const item = this.getItem(uid);
    if (!item || item.slot === undefined) return null;
    const slot = item.slot;
    const prev = this.data.equip[slot];
    this.data.equip[slot] = item;
    this.removeItem(uid);
    if (prev) this.data.bag.push(prev);
    return { slot, prev };
  },

  unequipSlot(slot) {
    const item = this.data.equip[slot];
    if (!item) return null;
    this.data.equip[slot] = null;
    this.data.bag.push(item);
    return item;
  },

  /* ---------- 技能 ---------- */
  getSkills() {
    return Data.getUnlockedSkills(this.data.classId, this.data.level);
  },

  /* ---------- 关卡 ---------- */
  unlockDungeon(id) {
    this.data.dungeonProgress = Math.max(this.data.dungeonProgress, id);
  },
};
