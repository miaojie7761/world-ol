'use strict';

/* ================= 世界OL UI 主逻辑 ================= */

const App = {
  currentTab: 'dungeon',
  selectedClass: 'warrior',
  inBattle: false,

  /* ---------- 屏幕切换 ---------- */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  },

  showTitle() {
    this.showScreen('screen-title');
  },

  newGame() {
    this.selectedClass = 'warrior';
    this.renderClassPicker();
    this.showScreen('screen-create');
  },

  continueGame() {
    if (!State.hasSave()) {
      this.toast('没有找到存档，请先创建新角色');
      this.showTitle();
      return;
    }
    State.load();
    this.enterMain();
  },

  /* ---------- 角色创建 ---------- */
  renderClassPicker() {
    const box = document.getElementById('class-picker');
    box.innerHTML = '';
    for (const id in Data.CLASSES) {
      const cls = Data.CLASSES[id];
      const div = document.createElement('div');
      div.className = 'class-card' + (id === this.selectedClass ? ' selected' : '');
      div.style.borderColor = cls.color;
      div.innerHTML = `
        <div class="class-icon" style="background:${cls.color}22">${cls.icon}</div>
        <div class="class-name">${cls.name}</div>
      `;
      div.onclick = () => {
        this.selectedClass = id;
        this.renderClassPicker();
        this.renderClassDetail();
      };
      box.appendChild(div);
    }
    this.renderClassDetail();
  },

  renderClassDetail() {
    const cls = Data.CLASSES[this.selectedClass];
    const box = document.getElementById('class-detail');
    box.innerHTML = `
      <div class="cd-name" style="color:${cls.color}">${cls.icon} ${cls.name}</div>
      <p class="cd-desc">${cls.desc}</p>
      <div class="cd-stats">
        <div class="cd-stat"><span>生命</span><b>${cls.base.hp}</b></div>
        <div class="cd-stat"><span>法力</span><b>${cls.base.mp}</b></div>
        <div class="cd-stat"><span>攻击</span><b>${cls.base.atk}</b></div>
        <div class="cd-stat"><span>防御</span><b>${cls.base.def}</b></div>
        <div class="cd-stat"><span>速度</span><b>${cls.base.spd}</b></div>
        <div class="cd-stat"><span>暴击</span><b>${Math.round(cls.base.crit * 100)}%</b></div>
      </div>
      <div class="cd-skills">
        ${cls.skills.map(sid => {
          const s = Data.SKILLS[sid];
          return `<div class="cd-skill"><span class="cd-skill-icon">${s.icon}</span><span>${s.name}</span><span class="cd-skill-lv">Lv.${s.unlockLevel}</span></div>`;
        }).join('')}
      </div>
    `;
  },

  createCharacter() {
    const name = document.getElementById('input-name').value.trim();
    if (!name) {
      this.toast('请为你的冒险者输入名字');
      return;
    }
    State.newGame(name, this.selectedClass);
    this.enterMain();
  },

  /* ---------- 主界面 ---------- */
  enterMain() {
    this.inBattle = false;
    this.showScreen('screen-main');
    this.renderPlayerBrief();
    this.switchTab('dungeon');
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    document.getElementById('panel-' + tab).classList.remove('hidden');
    if (tab === 'bag') this.renderBag();
    if (tab === 'skills') this.renderSkills();
    if (tab === 'profile') this.renderProfile();
    if (tab === 'dungeon') this.renderDungeons();
  },

  renderPlayerBrief() {
    const d = State.data;
    const stats = State.getStats();
    const maxHp = State.maxHp();
    const maxMp = State.maxMp();
    const xpNeed = State.xpNeeded(d.level);
    const cls = State.getClass();

    document.getElementById('player-name').textContent = d.name;
    document.getElementById('player-class').textContent = cls.icon + ' ' + cls.name;
    document.getElementById('player-class').style.color = cls.color;
    document.getElementById('player-level').textContent = d.level;
    document.getElementById('player-avatar').textContent = cls.icon;
    document.getElementById('player-avatar').style.background = cls.color;

    const hp = Math.min(d.hp, maxHp);
    const mp = Math.min(d.mp, maxMp);
    document.getElementById('bar-hp').style.width = Math.max(0, hp / maxHp * 100) + '%';
    document.getElementById('text-hp').textContent = `${hp} / ${maxHp}`;
    document.getElementById('bar-mp').style.width = Math.max(0, mp / maxMp * 100) + '%';
    document.getElementById('text-mp').textContent = `${mp} / ${maxMp}`;
    document.getElementById('bar-xp').style.width = Math.max(0, Math.min(1, d.xp / xpNeed) * 100) + '%';
    document.getElementById('text-xp').textContent = `${d.xp} / ${xpNeed}`;

    document.getElementById('stat-atk').textContent = Math.round(stats.atk);
    document.getElementById('stat-def').textContent = Math.round(stats.def);
    document.getElementById('stat-spd').textContent = stats.spd;
    document.getElementById('stat-crit').textContent = Math.round(stats.crit * 100) + '%';
    document.getElementById('stat-gold').textContent = d.gold;
    document.getElementById('bag-gold').textContent = d.gold;
  },

  /* ---------- 副本 ---------- */
  renderDungeons() {
    const list = document.getElementById('dungeon-list');
    list.innerHTML = '';
    for (const d of Data.DUNGEONS) {
      const unlocked = d.id <= State.data.dungeonProgress;
      const cleared = d.id < State.data.dungeonProgress;
      const card = document.createElement('div');
      card.className = 'dungeon-card' + (unlocked ? '' : ' locked');
      card.innerHTML = `
        <div class="dungeon-icon">${unlocked ? d.icon : '🔒'}</div>
        <div class="dungeon-info">
          <div class="dungeon-name">${d.name} ${cleared ? '<span class="tag-cleared">已通关</span>' : ''}</div>
          <div class="dungeon-desc">${d.desc}</div>
          <div class="dungeon-meta">
            <span>推荐等级 Lv.${d.minLevel}</span>
            <span>${d.waves.length} 波</span>
            <span>💰${d.goldReward}</span>
            <span>✨${d.xpReward}</span>
          </div>
        </div>
      `;
      if (unlocked) {
        card.onclick = () => this.enterDungeon(d.id);
      } else {
        card.classList.add('locked');
      }
      list.appendChild(card);
    }
  },

  enterDungeon(id) {
    if (State.data.hp <= 0) State.data.hp = State.maxHp();
    this.inBattle = true;
    this.showScreen('screen-battle');
    const log = document.getElementById('battle-log');
    log.innerHTML = '';
    this.hideMenus();
    Battle.start(id);
  },

  /* ---------- 战斗 ---------- */
  renderBattle() {
    const b = Battle.state;
    if (!b) return;

    const stats = State.getStats();
    const hp = b.player.hp;
    const mp = b.player.mp;
    const maxHp = State.maxHp();
    const maxMp = State.maxMp();

    /* 敌人 */
    const es = document.getElementById('enemy-side');
    es.innerHTML = b.enemies.map(e => `
      <div class="enemy-unit ${e.dead ? 'dead' : ''}">
        <div class="enemy-icon">${e.icon}</div>
        <div class="enemy-name">${e.name}${e.boss ? '👑' : ''}</div>
        <div class="bar enemy-bar"><div class="bar-fill bar-enemy-hp" style="width:${Math.max(0, e.hp / e.maxHp * 100)}%"></div></div>
        <div class="enemy-hp-text">${Math.max(0, e.hp)}/${e.maxHp}</div>
        ${e.dot ? '<div class="fx fx-dot">☠️中毒</div>' : ''}
        ${e.debuffs.spd ? '<div class="fx fx-debuff">❄️减速</div>' : ''}
      </div>
    `).join('');

    /* 玩家 */
    const ps = document.getElementById('player-side');
    const cls = State.getClass();
    const buffs = Object.values(b.player.buffs).map(x => x.name).join(' / ');
    ps.innerHTML = `
      <div class="player-unit">
        <div class="player-icon">${cls.icon}</div>
        <div class="enemy-name">${cls.name}</div>
        <div class="bar enemy-bar"><div class="bar-fill bar-hp" style="width:${Math.max(0, hp / maxHp * 100)}%"></div></div>
        <div class="enemy-hp-text">${Math.max(0, hp)}/${maxHp}</div>
        <div class="bar enemy-bar"><div class="bar-fill bar-mp" style="width:${Math.max(0, mp / maxMp * 100)}%"></div></div>
        <div class="enemy-hp-text">${Math.max(0, mp)}/${maxMp}</div>
        ${b.player.defending ? '<div class="fx fx-def">🛡️防御中</div>' : ''}
        ${buffs ? `<div class="fx fx-buff">✨${buffs}</div>` : ''}
      </div>
    `;

    this.updateActionMenus();
  },

  updateActionMenus() {
    const b = Battle.state;
    if (!b) return;
    const mp = b.player.mp;

    /* 技能菜单 */
    const sm = document.getElementById('skill-menu');
    const skills = State.getSkills();
    sm.innerHTML = skills.map(s => `
      <button class="menu-btn ${mp < s.mp ? 'disabled' : ''}" onclick="Battle.chooseSkill('${s.id}')" ${mp < s.mp ? 'disabled' : ''}>
        <span class="menu-icon">${s.icon}</span>
        <span class="menu-name">${s.name}</span>
        <span class="menu-cost">MP ${s.mp}</span>
      </button>
    `).join('');

    /* 道具菜单 */
    const im = document.getElementById('item-menu');
    const consumables = State.data.bag.filter(it => it.type === 'consumable');
    im.innerHTML = consumables.length
      ? consumables.map(it => `
        <button class="menu-btn" onclick="Battle.chooseItem('${it.uid}')">
          <span class="menu-icon">${it.icon}</span>
          <span class="menu-name">${it.name} x1</span>
        </button>
      `).join('')
      : '<div class="menu-empty">背包里没有可用道具</div>';
  },

  toggleSkillMenu() {
    const m = document.getElementById('skill-menu');
    document.getElementById('item-menu').classList.add('hidden');
    m.classList.toggle('hidden');
  },

  toggleItemMenu() {
    const m = document.getElementById('item-menu');
    document.getElementById('skill-menu').classList.add('hidden');
    m.classList.toggle('hidden');
  },

  hideMenus() {
    document.getElementById('skill-menu').classList.add('hidden');
    document.getElementById('item-menu').classList.add('hidden');
  },

  battleLog(text, type) {
    const log = document.getElementById('battle-log');
    const div = document.createElement('div');
    div.className = 'log-line log-' + type;
    div.textContent = text;
    log.appendChild(div);
    while (log.children.length > 40) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  },

  /* ---------- 结算 ---------- */
  showResult(result, payload) {
    const box = document.getElementById('result-box');
    let html = '';

    if (result === 'victory') {
      const cls = State.getClass();
      html = `
        <div class="result-title victory">🏆 战斗胜利！</div>
        <div class="result-reward">
          <div class="reward-row">💰 金币 <b>+${payload.gold}</b></div>
          <div class="reward-row">✨ 经验 <b>+${payload.xp}</b></div>
          ${payload.leveled.length ? `<div class="reward-row levelup">🎉 ${payload.leveled.map(l => `升级到 Lv.${l}`).join(' → ')}！属性提升！</div>` : ''}
        </div>
        ${payload.items.length ? `
          <div class="result-loot-title">拾取装备</div>
          <div class="result-loot">${payload.items.map(it => {
            const q = Data.QUALITIES[it.quality];
            return `<div class="loot-item" style="border-color:${q.color}"><span class="loot-icon">${it.icon}</span><div class="loot-info"><div class="loot-name" style="color:${q.color}">${it.name}（${q.name}）</div><div class="loot-stats">${this.formatStats(it.stats)}</div></div></div>`;
          }).join('')}</div>
        ` : ''}
        <div class="result-sub">当前等级：Lv.${State.data.level}　职业：${cls.icon} ${cls.name}</div>
      `;
    } else if (result === 'defeat') {
      html = `
        <div class="result-title defeat">💀 你被击败了……</div>
        <p class="result-text">冒险失败了。你拖着残躯回到了营地，恢复了一些体力。</p>
        <p class="result-sub">战败次数：${State.data.defeats}</p>
      `;
    } else {
      html = `
        <div class="result-title flee">🏃 逃出了战场</div>
        <p class="result-text">好汉不吃眼前亏，先回去休整再来挑战。</p>
      `;
    }

    html += `<button class="btn btn-primary btn-lg" onclick="App.afterBattle()">返回营地</button>`;
    box.innerHTML = html;
    this.showScreen('screen-result');
  },

  afterBattle() {
    this.inBattle = false;
    State.save();
    this.enterMain();
  },

  formatStats(stats) {
    const map = { hp: '生命', mp: '法力', atk: '攻击', def: '防御', spd: '速度', crit: '暴击' };
    return Object.entries(stats).map(([k, v]) => {
      const label = map[k] || k;
      const val = k === 'crit' ? Math.round(v * 100) + '%' : Math.round(v);
      return `<span>+${val} ${label}</span>`;
    }).join(' ');
  },

  /* ---------- 背包 ---------- */
  renderBag() {
    document.getElementById('bag-gold').textContent = State.data.gold;
    const list = document.getElementById('bag-list');
    list.innerHTML = '';
    const bag = [...State.data.bag];
    if (!bag.length) {
      list.innerHTML = '<div class="bag-empty">背包空空如也，去副本里战斗获取装备吧！</div>';
      return;
    }
    for (const it of bag) {
      if (it.slot !== undefined) {
        const q = Data.QUALITIES[it.quality];
        const div = document.createElement('div');
        div.className = 'bag-item';
        div.style.borderColor = q.color;
        div.innerHTML = `
          <span class="bag-icon">${it.icon}</span>
          <div class="bag-info">
            <div class="bag-name" style="color:${q.color}">${it.name} <span class="qname">${q.name}</span></div>
            <div class="bag-stats">${this.formatStats(it.stats)}</div>
          </div>
          <div class="bag-actions">
            <button class="btn btn-sm" onclick="App.wearItem('${it.uid}')">穿戴</button>
            <button class="btn btn-sm btn-danger" onclick="App.sellItem('${it.uid}')">卖💰${it.sellPrice}</button>
          </div>
        `;
        list.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'bag-item bag-consumable';
        div.innerHTML = `
          <span class="bag-icon">${it.icon}</span>
          <div class="bag-info">
            <div class="bag-name">${it.name}</div>
            <div class="bag-stats">${it.desc}</div>
          </div>
          <div class="bag-actions">
            <button class="btn btn-sm" onclick="App.usePotion('${it.uid}')">使用</button>
          </div>
        `;
        list.appendChild(div);
      }
    }
  },

  wearItem(uid) {
    const res = State.equipItem(uid);
    if (res) {
      this.toast('已穿戴装备');
      State.save();
      this.renderPlayerBrief();
      this.renderBag();
    }
  },

  sellItem(uid) {
    const gold = State.sellItem(uid);
    if (gold > 0) {
      this.toast(`已出售，获得 ${gold} 金币`);
      State.save();
      this.renderPlayerBrief();
      this.renderBag();
    }
  },

  usePotion(uid) {
    const item = State.usePotion(uid);
    if (item) {
      this.toast(`使用了 ${item.name}，${item.desc}`);
      State.save();
      this.renderPlayerBrief();
      this.renderBag();
    }
  },

  useAllPotions() {
    let used = 0;
    let heal = 0;
    const bag = [...State.data.bag];
    for (const it of bag) {
      if (it.type === 'consumable' && it.healHp && State.data.hp < State.maxHp()) {
        State.usePotion(it.uid);
        used++;
        heal += it.healHp;
      }
    }
    if (used) {
      this.toast(`使用了 ${used} 瓶血瓶，共恢复 ${heal} 点生命`);
      State.save();
      this.renderPlayerBrief();
      this.renderBag();
    } else {
      this.toast('没有可使用的血瓶，或生命已满');
    }
  },

  sortBag(mode) {
    State.data.bag.sort((a, b) => {
      if (mode === 'type') {
        const isConsA = a.slot === undefined ? 1 : 0;
        const isConsB = b.slot === undefined ? 1 : 0;
        return isConsA - isConsB || (a.slot || '').localeCompare(b.slot || '');
      }
      const va = (a.sellPrice || 0) + (a.stats ? Object.values(a.stats).reduce((s, v) => s + v, 0) : 0);
      const vb = (b.sellPrice || 0) + (b.stats ? Object.values(b.stats).reduce((s, v) => s + v, 0) : 0);
      return vb - va;
    });
    State.save();
    this.renderBag();
  },

  sellJunk() {
    let total = 0;
    const bag = [...State.data.bag];
    for (const it of bag) {
      if (it.slot !== undefined && it.quality === 'common') {
        State.sellItem(it.uid);
        total++;
      }
    }
    if (total) {
      this.toast(`已出售 ${total} 件普通装备`);
      State.save();
      this.renderPlayerBrief();
      this.renderBag();
    } else {
      this.toast('背包里没有普通品质的装备');
    }
  },

  /* ---------- 技能 ---------- */
  renderSkills() {
    const list = document.getElementById('skill-list');
    list.innerHTML = '';
    const cls = State.getClass();
    const skills = Data.getUnlockedSkills(cls.id, 99);
    for (const s of skills) {
      const unlocked = State.data.level >= s.unlockLevel;
      const div = document.createElement('div');
      div.className = 'skill-card' + (unlocked ? '' : ' locked');
      div.innerHTML = `
        <div class="skill-icon">${s.icon}</div>
        <div class="skill-info">
          <div class="skill-name">${s.name} ${unlocked ? '' : '<span class="tag-lock">未解锁</span>'}</div>
          <div class="skill-desc">${s.desc}</div>
        </div>
        <div class="skill-cost">MP ${s.mp}</div>
        <div class="skill-lv">Lv.${s.unlockLevel} 解锁</div>
      `;
      list.appendChild(div);
    }
  },

  /* ---------- 角色面板 ---------- */
  renderProfile() {
    const d = State.data;
    const base = State.baseStats();
    const gear = State.gearStats();
    const stats = State.getStats();
    const cls = State.getClass();

    const detail = document.getElementById('profile-detail');
    const statItems = [
      ['❤️ 生命', stats.hp, base.hp, gear.hp],
      ['💧 法力', stats.mp, base.mp, gear.mp],
      ['⚔️ 攻击', Math.round(stats.atk), Math.round(base.atk), gear.atk],
      ['🛡️ 防御', Math.round(stats.def), Math.round(base.def), gear.def],
      ['💨 速度', stats.spd, base.spd, gear.spd],
      ['💥 暴击', Math.round(stats.crit * 100) + '%', Math.round(base.crit * 100) + '%', null],
    ];
    detail.innerHTML = statItems.map(([label, total, baseV, gearV]) => `
      <div class="profile-stat">
        <span class="ps-label">${label}</span>
        <b class="ps-total">${total}</b>
        <span class="ps-base">基础 ${baseV}</span>
        ${gearV ? `<span class="ps-gear">装备 +${gearV}</span>` : ''}
      </div>
    `).join('');

    const eqList = document.getElementById('equip-list');
    const slots = [
      ['weapon', '武器'],
      ['armor', '防具'],
      ['accessory', '饰品'],
    ];
    eqList.innerHTML = slots.map(([slot, slotName]) => {
      const item = d.equip[slot];
      if (item) {
        const q = Data.QUALITIES[item.quality];
        return `
          <div class="equip-slot">
            <div class="equip-item" style="border-color:${q.color}">
              <div class="equip-top"><span class="equip-icon">${item.icon}</span><span class="equip-name" style="color:${q.color}">${item.name}</span></div>
              <div class="equip-stats">${this.formatStats(item.stats)}</div>
              <button class="btn btn-sm btn-ghost" onclick="App.unequip('${slot}')">卸下</button>
            </div>
          </div>`;
      }
      return `
        <div class="equip-slot">
          <div class="equip-item empty">
            <div class="equip-top"><span class="equip-icon">⬜</span><span class="equip-name">${slotName}：空</span></div>
          </div>
        </div>`;
    }).join('');
  },

  unequip(slot) {
    const item = State.unequipSlot(slot);
    if (item) {
      this.toast(`已卸下 ${item.icon} ${item.name}`);
      State.save();
      this.renderPlayerBrief();
      this.renderProfile();
    }
  },

  /* ---------- 重置 ---------- */
  resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将被清空。')) {
      State.reset();
      this.toast('游戏已重置');
      this.showTitle();
    }
  },

  /* ---------- Toast ---------- */
  toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      t.classList.remove('show');
      t.classList.add('hidden');
    }, 2200);
  },
};

window.App = App;

/* 初始化：绑定导航 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => App.switchTab(btn.dataset.tab);
  });
  /* 输入框回车创建 */
  document.getElementById('input-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') App.createCharacter();
  });
});
