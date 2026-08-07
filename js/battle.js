'use strict';

/* ================= 世界OL 回合制战斗引擎 ================= */

const Battle = {
  state: null,
  _actionResolve: null,
  _running: false,

  /* 怪物特殊攻击 */
  MONSTER_SPECIALS: {
    shadow_mage:     { name: '暗影箭',   icon: '🌑', mult: 1.4, chance: 0.35 },
    ogre:            { name: '重锤砸击', icon: '💢', mult: 1.5, chance: 0.30 },
    gargoyle:        { name: '石化凝视', icon: '🪨', mult: 1.3, chance: 0.25 },
    shadow_assassin: { name: '致命突袭', icon: '🗡️', mult: 1.6, chance: 0.40 },
    skele_king:      { name: '骨矛投掷', icon: '🦴', mult: 1.5, chance: 0.35 },
    troll:           { name: '山崩',     icon: '🗻', mult: 1.4, chance: 0.30 },
    two_head_dragon: { name: '烈焰吐息', icon: '🔥', mult: 1.4, chance: 0.35 },
    demon_lord:      { name: '深渊烈焰', icon: '🔥', mult: 1.6, chance: 0.40 },
  },

  /* ---------- 工具 ---------- */
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  log(text, type) {
    if (App && App.battleLog) App.battleLog(text, type || 'info');
  },

  render() {
    if (App && App.renderBattle) App.renderBattle();
  },

  /* ---------- 战斗开始 ---------- */
  start(dungeonId) {
    const dungeon = Data.getDungeon(dungeonId);
    const stats = State.getStats();
    this.state = {
      dungeon,
      waveIndex: 0,
      enemies: [],
      player: {
        buffs: {},
        defending: false,
        hp: State.currentHp(),
        mp: State.currentMp(),
      },
      turn: 0,
      ended: false,
      logs: [],
      killed: 0,
      goldEarned: 0,
      xpEarned: 0,
      items: [],
    };
    this.spawnWave();
    this.state.playerFirst = this.getPlayerSpd() >= this.getEnemyAvgSpd();
    this._running = true;
    this._actionResolve = null;
    this.run();
  },

  getPlayerSpd() {
    let spd = State.getStats().spd;
    const b = this.state.player.buffs;
    if (b.spd) spd = spd * b.spd.mult;
    return spd;
  },

  getEnemyAvgSpd() {
    const alive = this.state.enemies.filter(e => !e.dead);
    if (!alive.length) return 0;
    return alive.reduce((s, e) => s + e.spd, 0) / alive.length;
  },

  spawnWave() {
    const wave = this.state.dungeon.waves[this.state.waveIndex];
    const enemies = [];
    wave.forEach((monsterId, i) => {
      const m = Data.MONSTERS[monsterId];
      const scale = 1 + (this.state.dungeon.id - 1) * 0.025;
      enemies.push({
        instId: i,
        monsterId,
        name: m.name,
        icon: m.icon,
        hp: Math.round(m.hp * scale),
        maxHp: Math.round(m.hp * scale),
        atk: Math.round(m.atk * (0.9 + Math.random() * 0.2)),
        def: m.def,
        spd: m.spd,
        crit: m.crit,
        boss: !!m.boss,
        dead: false,
        dot: null,
        debuffs: {},
      });
    });
    this.state.enemies = enemies;
    this.log(`—— 第 ${this.state.waveIndex + 1} 波敌人出现了！ ——`, 'wave');
    for (const e of enemies) {
      this.log(`${e.icon} ${e.name} 登场${e.boss ? '（BOSS）' : ''}`, 'enemy');
    }
    this.render();
  },

  /* ---------- 主循环 ---------- */
  async run() {
    while (this._running && !this.state.ended) {
      await this.tickRoundStart();
      if (this.state.ended) break;

      if (this.state.playerFirst) {
        const action = await this.waitPlayerAction();
        if (this.state.ended) break;
        await this.doPlayerAction(action);
        if (this.state.ended) break;
        await this.doEnemiesTurn();
        if (this.state.ended) break;
      } else {
        await this.doEnemiesTurn();
        if (this.state.ended) break;
        const action = await this.waitPlayerAction();
        if (this.state.ended) break;
        await this.doPlayerAction(action);
        if (this.state.ended) break;
      }

      this.tickTurnEnd();
    }
  },

  /* 每回合开始：结算持续伤害 */
  async tickRoundStart() {
    this.state.turn++;
    this.log(`━━━━ 回合 ${this.state.turn} ━━━━`, 'turn');
    for (const e of this.state.enemies) {
      if (e.dead) continue;
      if (e.dot && e.dot.turns > 0) {
        const dmg = Math.max(1, Math.round(e.dot.dmg));
        e.hp -= dmg;
        e.dot.turns--;
        this.log(`${e.icon} ${e.name} 受到中毒伤害 ${dmg} 点！`, 'dot');
        if (e.dot.turns <= 0) e.dot = null;
        if (e.hp <= 0) {
          this.killEnemy(e);
          this.checkVictory();
        }
        await this.sleep(300);
      }
    }
    this.render();
  },

  tickTurnEnd() {
    const p = this.state.player;
    if (p.defending) p.defending = false;
    for (const key in p.buffs) {
      p.buffs[key].turns--;
      if (p.buffs[key].turns <= 0) {
        this.log(`增益效果【${p.buffs[key].name}】消失了`, 'info');
        delete p.buffs[key];
      }
    }
    for (const e of this.state.enemies) {
      if (e.dead) continue;
      for (const key in e.debuffs) {
        e.debuffs[key].turns--;
        if (e.debuffs[key].turns <= 0) delete e.debuffs[key];
      }
    }
    this.render();
  },

  waitPlayerAction() {
    return new Promise(resolve => { this._actionResolve = resolve; });
  },

  resolveAction(action) {
    if (!this._actionResolve) return;
    const r = this._actionResolve;
    this._actionResolve = null;
    r(action);
  },

  /* ---------- 玩家行动 ---------- */
  async doPlayerAction(action) {
    const p = this.state.player;
    p.defending = false;
    switch (action.type) {
      case 'attack': await this.playerAttack(); break;
      case 'skill': await this.playerSkill(action.skillId); break;
      case 'defend': p.defending = true; this.log('🛡️ 你摆出防御姿态，本回合受到的伤害减半！', 'player'); this.render(); break;
      case 'item': await this.playerUseItem(action.uid); break;
      case 'flee': await this.playerFlee(); break;
    }
  },

  computePlayerStats() {
    const base = State.getStats();
    const stats = { ...base };
    const b = this.state.player.buffs;
    if (b.atk) stats.atk = stats.atk * (1 + b.atk.mult);
    if (b.def) stats.def = stats.def * (1 + b.def.mult);
    return stats;
  },

  async playerAttack() {
    const stats = this.computePlayerStats();
    const target = this.pickTarget();
    if (!target) return;
    const { dmg, crit } = this.calcDamage(stats.atk, 1.0, target.def, stats.crit, 0);
    this.dealEnemyDamage(target, dmg, crit, `你攻击了 ${target.icon} ${target.name}`);
    await this.sleep(400);
    this.checkVictory();
  },

  async playerSkill(skillId) {
    const skill = Data.SKILLS[skillId];
    if (!skill) return;
    const stats = this.computePlayerStats();
    const p = this.state.player;

    if (p.mp < skill.mp) {
      this.log('⚠️ 法力值不足！', 'error');
      this.render();
      return;
    }
    State.spendMp(skill.mp);
    p.mp = State.currentMp();

    const eff = skill.effect;

    if (eff.type === 'heal') {
      const amt = Math.round(State.maxHp() * eff.healRatio);
      this.state.player.hp = Math.min(State.maxHp(), this.state.player.hp + amt);
      this.log(`${skill.icon} ${skill.name}！恢复 ${amt} 点生命！`, 'heal');
      this.render();
      await this.sleep(500);
      return;
    }

    if (eff.type === 'buff') {
      this.state.player.buffs[eff.stat] = { name: skill.name, mult: eff.amount, turns: eff.turns };
      this.log(`${skill.icon} ${skill.name}！${this.getStatName(eff.stat)}提升 ${Math.round(eff.amount * 100)}%，持续 ${eff.turns} 回合！`, 'buff');
      this.render();
      await this.sleep(500);
      return;
    }

    if (eff.type === 'damage') {
      const targets = skill.target === 'all' ? this.state.enemies.filter(e => !e.dead) : [this.pickTarget()];
      const hits = eff.hits || 1;
      for (let h = 0; h < hits; h++) {
        for (const target of targets) {
          if (!target || target.dead) continue;
          const { dmg, crit } = this.calcDamage(stats.atk, eff.multiplier, target.def, stats.crit + (eff.critBonus || 0), 0);
          this.dealEnemyDamage(target, dmg, crit, `${skill.icon} ${skill.name} 击中 ${target.icon} ${target.name}`);
          if (eff.recoil) {
            const recoil = Math.max(1, Math.round(dmg * eff.recoil));
            this.state.player.hp = Math.max(0, this.state.player.hp - recoil);
            this.log(`💥 反噬之力让你受到了 ${recoil} 点伤害！`, 'error');
          }
          if (eff.dot) {
            target.dot = { dmg: stats.atk * eff.dot.ratio, turns: eff.dot.turns };
            this.log(`☠️ ${target.name} 中毒了（${eff.dot.turns} 回合）！`, 'dot');
          }
          if (eff.debuff) {
            target.debuffs[eff.debuff.stat] = { mult: eff.debuff.amount, turns: eff.debuff.turns };
            this.log(`❄️ ${target.name} 的${this.getStatName(eff.debuff.stat)}降低了！`, 'debuff');
          }
          await this.sleep(250);
        }
      }
      this.render();
      this.checkVictory();
    }
  },

  async playerUseItem(uid) {
    const item = State.getItem(uid);
    if (!item) return;
    let used = null;
    if (item.healHp) {
      const amt = item.healHp;
      this.state.player.hp = Math.min(State.maxHp(), this.state.player.hp + amt);
      used = `恢复 ${amt} 点生命`;
    } else if (item.healMp) {
      const amt = item.healMp;
      this.state.player.mp = Math.min(State.maxMp(), this.state.player.mp + amt);
      used = `恢复 ${amt} 点法力`;
    }
    State.removeItem(uid);
    this.state.player.hp = State.currentHp();
    this.state.player.mp = State.currentMp();
    this.log(`${item.icon} 使用 ${item.name}，${used}！`, 'heal');
    this.render();
    await this.sleep(400);
  },

  async playerFlee() {
    const avgSpd = this.getEnemyAvgSpd();
    let chance = 0.5 + (this.getPlayerSpd() - avgSpd) * 0.05;
    chance = Math.max(0.3, Math.min(0.9, chance));
    if (Math.random() < chance) {
      this.log('🏃 你成功逃出了战场！', 'success');
      this.endBattle('flee');
    } else {
      this.log('😰 逃跑失败！', 'error');
      this.render();
    }
  },

  /* ---------- 敌人行动 ---------- */
  async doEnemiesTurn() {
    for (const e of this.state.enemies) {
      if (e.dead) continue;
      if (this.state.ended || this.state.player.hp <= 0) break;

      /* 速度 debuff 结算用有效 spd */
      let effAtk = e.atk;
      if (e.debuffs.spd) { /* 速度降低不影响攻击，仅影响先手 */ }

      const spec = this.MONSTER_SPECIALS[e.monsterId];
      const useSpec = spec && Math.random() < spec.chance;

      const pDef = this.state.player.defending;
      const baseDef = this.computePlayerStats().def;
      const { dmg, crit } = this.calcDamage(effAtk, useSpec ? spec.mult : 1.0, baseDef, e.crit, 0);

      const finalDmg = Math.max(1, Math.round(dmg * (pDef ? 0.5 : 1)));

      /* 幻影步闪避 */
      const evade = this.state.player.buffs.evade;
      const evadeChance = evade ? evade.mult : 0;
      if (Math.random() < evadeChance) {
        this.log(`👻 你以幻影步伐躲开了 ${e.name} 的攻击！`, 'evade');
        await this.sleep(350);
        continue;
      }

      this.state.player.hp = Math.max(0, this.state.player.hp - finalDmg);
      State.data.hp = this.state.player.hp;
      const hitText = useSpec
        ? `${e.icon} ${e.name} 发动 ${spec.icon}${spec.name}！对你造成 ${finalDmg} 点伤害${pDef ? '（防御减半）' : ''}${crit ? '【暴击】' : ''}！`
        : `${e.icon} ${e.name} 攻击你，造成 ${finalDmg} 点伤害${pDef ? '（防御减半）' : ''}${crit ? '【暴击】' : ''}！`;
      this.log(hitText, crit ? 'crit' : 'enemyhit');
      this.render();
      await this.sleep(450);

      if (this.state.player.hp <= 0) {
        this.log('💀 你被击倒了……', 'error');
        this.endBattle('defeat');
        return;
      }
    }
  },

  /* ---------- 伤害计算 ---------- */
  calcDamage(atk, multiplier, targetDef, critChance, flatBonus) {
    const raw = atk * multiplier + (flatBonus || 0);
    const mitigated = raw * (100 / (100 + Math.max(0, targetDef)));
    let dmg = mitigated * (0.85 + Math.random() * 0.3);
    const crit = Math.random() < Math.min(0.9, critChance);
    if (crit) dmg *= 1.6;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  },

  dealEnemyDamage(target, dmg, crit, prefix) {
    target.hp -= dmg;
    this.log(`${prefix}，造成 ${dmg} 点伤害${crit ? '【暴击】' : ''}！`, crit ? 'crit' : 'playerhit');
    this.render();
    if (target.hp <= 0) {
      target.hp = 0;
      this.killEnemy(target);
    }
  },

  killEnemy(enemy) {
    enemy.dead = true;
    this.state.killed++;
    const m = Data.MONSTERS[enemy.monsterId];
    const gold = Data.rollRange(m.gold);
    const xp = Data.rollRange(m.xp);
    this.state.goldEarned += gold;
    this.state.xpEarned += xp;
    this.log(`⚔️ 击杀了 ${enemy.icon} ${enemy.name}！获得 ${gold} 金币、${xp} 经验！`, 'kill');
    const loot = Data.rollLoot(this.state.dungeon.tier, 0);
    if (loot) {
      this.state.items.push(loot);
      const q = Data.QUALITIES[loot.quality];
      this.log(`📦 掉落装备：${loot.icon} ${loot.name}（${q.name}）！`, 'loot');
    }
    this.render();
  },

  checkVictory() {
    const alive = this.state.enemies.filter(e => !e.dead);
    if (alive.length === 0) {
      this.log(`—— 第 ${this.state.waveIndex + 1} 波敌人被全部消灭！ ——`, 'wave');
      this.state.waveIndex++;
      if (this.state.waveIndex >= this.state.dungeon.waves.length) {
        this.endBattle('victory');
      } else {
        this.spawnWave();
      }
    }
  },

  pickTarget() {
    const alive = this.state.enemies.filter(e => !e.dead);
    if (!alive.length) return null;
    /* 优先攻击 boss */
    const boss = alive.find(e => e.boss);
    if (boss) return boss;
    return alive[0];
  },

  /* ---------- 战斗结束 ---------- */
  async endBattle(result) {
    if (this.state.ended) return;
    this.state.ended = true;
    this._running = false;
    this._actionResolve = null;
    await this.sleep(400);

    if (result === 'victory') {
      const d = this.state.dungeon;
      const rewardGold = Data.rollRange(d.goldReward);
      const rewardXp = Data.rollRange(d.xpReward);
      const totalGold = this.state.goldEarned + rewardGold;
      const totalXp = this.state.xpEarned + rewardXp;
      State.addGold(totalGold);
      const { gained, leveled } = State.addXp(totalXp);
      State.unlockDungeon(d.id + 1);
      State.data.victory++;
      State.data.kills += this.state.killed;

      /* 拾取掉落 */
      const dropped = [];
      for (const it of this.state.items) {
        if (State.addItem(it)) dropped.push(it);
      }

      App.showResult('victory', {
        dungeon: d,
        gold: totalGold,
        xp: gained,
        leveled,
        items: dropped,
        extraLoot: dropped,
      });
    } else if (result === 'defeat') {
      State.data.defeats++;
      State.data.hp = Math.round(State.maxHp() * 0.3);
      App.showResult('defeat', {});
    } else if (result === 'flee') {
      State.data.hp = this.state.player.hp;
      App.showResult('flee', {});
    }
    State.save();
  },

  /* ---------- UI 触发 ---------- */
  getStatName(stat) {
    const map = { hp: '生命', mp: '法力', atk: '攻击力', def: '防御力', spd: '速度', crit: '暴击', evade: '闪避' };
    return map[stat] || stat;
  },

  isBusy() {
    return this._running;
  },
};

/* 全局入口：UI 按钮调用 */
Battle.chooseAction = function (type) {
  Battle.resolveAction({ type });
};

Battle.doAction = function (type) {
  Battle.resolveAction({ type });
};

Battle.chooseSkill = function (skillId) {
  Battle.resolveAction({ type: 'skill', skillId });
};

Battle.chooseItem = function (uid) {
  Battle.resolveAction({ type: 'item', uid });
};
