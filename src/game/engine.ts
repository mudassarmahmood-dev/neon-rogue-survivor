import { audio } from './audio.ts';
import { calculateDamage, clamp } from './rules.ts';
import {
  Enemy,
  EnemyType,
  Bullet,
  Pickup,
  Particle,
  LevelConfig,
  PlayerStats,
  WaveConfig,
} from './types.ts';

export interface HudData {
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  comboTimer: number;
  coinsCollected: number;
  crystalsCollected: number;
  waveIndex: number;
  totalWaves: number;
  enemiesRemaining: number;
  dashCooldownProgress: number; // 0 to 1 (1 = ready)
  elapsedTime: number;
}

export interface GameOutcome {
  victory: boolean;
  clearTime: number;
  hpRemaining: number;
  maxHp: number;
  coinsEarned: number;
  crystalsEarned: number;
  score: number;
  enemiesDefeated: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning = false;
  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Level configuration
  private level: LevelConfig;
  private playerStats: PlayerStats;
  private onHudUpdate: (hud: HudData) => void;
  private onGameOver: (outcome: GameOutcome) => void;

  // Player state
  private player = {
    x: 600,
    y: 400,
    vx: 0,
    vy: 0,
    radius: 18,
    hp: 100,
    maxHp: 100,
    speed: 280,
    angle: 0,
    dashTimer: 0,
    dashDuration: 0.18,
    dashCooldown: 0.85,
    dashCooldownTimer: 0,
    isDashing: false,
    slashTimer: 0,
    slashDuration: 0.14,
    slashCooldown: 0.22,
    slashCooldownTimer: 0,
    slashRadius: 75,
    slashAngleStart: 0,
    slashAngleEnd: 0,
    invincibleTimer: 1.8,
    squashX: 1,
    squashY: 1,
  };

  // Combat & Run state
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private coinsEarned = 0;
  private crystalsEarned = 0;
  private enemiesDefeated = 0;
  private elapsedTime = 0;
  private currentWaveIdx = 0;
  private waveSpawnQueue: WaveConfig | null = null;
  private waveSpawnTimer = 0;
  private totalEnemiesInWave = 0;

  // Entities
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private pickups: Pickup[] = [];
  private nextId = 1;

  // Juice & FX
  private hitstopTimer = 0;
  private trauma = 0;
  private particles: Particle[] = [];
  private readonly MAX_PARTICLES = 300;

  // Camera
  private camera = { x: 0, y: 0 };

  // Inputs
  private keys: Record<string, boolean> = {};
  private mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false };
  private touchJoystick = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, dx: 0, dy: 0 };

  // Modifier for daily challenge if active
  private modifier: string | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    stats: PlayerStats,
    onHudUpdate: (hud: HudData) => void,
    onGameOver: (outcome: GameOutcome) => void,
    modifier: string | null = null
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.level = level;
    this.playerStats = stats;
    this.onHudUpdate = onHudUpdate;
    this.onGameOver = onGameOver;
    this.modifier = modifier;

    this.initPlayerStats();
    this.initParticlePool();
    this.setupListeners();
    this.startWave(0);
  }

  private initPlayerStats() {
    const baseHp = 100 + this.playerStats.maxHp - 100;
    this.player.maxHp = baseHp;
    this.player.hp = baseHp;
    this.player.speed = 280 + this.playerStats.speedTier * 22;
    this.player.dashCooldown = Math.max(0.35, 0.85 - this.playerStats.dashCooldownTier * 0.09);

    if (this.modifier === 'hyper_speed') {
      this.player.speed *= 1.4;
      this.player.dashCooldown *= 0.5;
    } else if (this.modifier === 'glass_cannon') {
      this.player.hp = Math.round(this.player.hp * 0.6);
      this.player.maxHp = this.player.hp;
    }

    this.player.x = this.level.arenaWidth / 2;
    this.player.y = this.level.arenaHeight / 2;
  }

  private initParticlePool() {
    this.particles = [];
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#00ffff',
        size: 3,
        life: 0,
        maxLife: 0.5,
        decay: 1,
        shape: 'spark',
      });
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    maxLife: number,
    shape: 'circle' | 'spark' | 'ring' | 'text' = 'spark',
    text?: string
  ) {
    const p = this.particles.find((item) => !item.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.shape = shape;
    p.text = text;
  }

  public emitBurst(x: number, y: number, color: string, count = 12, speed = 180) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = speed * (0.6 + Math.random() * 0.8);
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        2 + Math.random() * 3,
        0.3 + Math.random() * 0.3,
        'spark'
      );
    }
  }

  public emitFloatingText(x: number, y: number, text: string, color: string) {
    this.spawnParticle(
      x,
      y,
      (Math.random() - 0.5) * 30,
      -70 - Math.random() * 30,
      color,
      14,
      0.8,
      'text',
      text
    );
  }

  private addTrauma(amount: number) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!e || !e.key) return;
    this.keys[e.key.toLowerCase()] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.triggerSlash();
    }
    if (e.key === 'Shift' || e.code === 'KeyK') {
      e.preventDefault();
      this.triggerDash();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (!e || !e.key) return;
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleBlur = () => {
    this.keys = {};
    this.mouse.isDown = false;
    this.touchJoystick.active = false;
  };

  private updateMouseWorld(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;
    this.mouse.x = cssX;
    this.mouse.y = cssY;
    this.mouse.worldX = cssX + this.camera.x;
    this.mouse.worldY = cssY + this.camera.y;
    this.player.angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.updateMouseWorld(e.clientX, e.clientY);
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = true;
      this.triggerSlash();
    } else if (e.button === 2) {
      this.triggerDash();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      if (tx < rect.width * 0.45) {
        // Left half = joystick
        this.touchJoystick.active = true;
        this.touchJoystick.startX = tx;
        this.touchJoystick.startY = ty;
        this.touchJoystick.curX = tx;
        this.touchJoystick.curY = ty;
        this.touchJoystick.dx = 0;
        this.touchJoystick.dy = 0;
      } else {
        // Right half = action: slash or dash
        if (ty > rect.height * 0.7) {
          this.triggerDash();
        } else {
          this.triggerSlash();
        }
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      if (this.touchJoystick.active && tx < rect.width * 0.5) {
        this.touchJoystick.curX = tx;
        this.touchJoystick.curY = ty;
        const rawDx = tx - this.touchJoystick.startX;
        const rawDy = ty - this.touchJoystick.startY;
        const dist = Math.hypot(rawDx, rawDy);
        const maxDist = 55;
        if (dist > maxDist) {
          this.touchJoystick.dx = (rawDx / dist) * maxDist;
          this.touchJoystick.dy = (rawDy / dist) * maxDist;
        } else {
          this.touchJoystick.dx = rawDx;
          this.touchJoystick.dy = rawDy;
        }
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      this.touchJoystick.active = false;
      this.touchJoystick.dx = 0;
      this.touchJoystick.dy = 0;
    }
  };

  public triggerSlash() {
    if (this.player.slashCooldownTimer > 0 || this.player.isDashing) return;

    this.player.slashTimer = this.player.slashDuration;
    this.player.slashCooldownTimer = this.player.slashCooldown;
    this.player.slashAngleStart = this.player.angle - Math.PI * 0.55;
    this.player.slashAngleEnd = this.player.angle + Math.PI * 0.55;

    // Squash & stretch
    this.player.squashX = 1.25;
    this.player.squashY = 0.8;

    audio.playSlash();

    // Perform slash hitbox check
    this.performSlashHit();
  }

  public triggerDash() {
    if (this.player.dashCooldownTimer > 0 || this.player.isDashing) return;

    this.player.isDashing = true;
    this.player.dashTimer = this.player.dashDuration;
    this.player.dashCooldownTimer = this.player.dashCooldown;
    this.player.invincibleTimer = this.player.dashDuration + 0.05;

    // Move in facing direction
    const dashSpeed = 820;
    this.player.vx = Math.cos(this.player.angle) * dashSpeed;
    this.player.vy = Math.sin(this.player.angle) * dashSpeed;

    this.player.squashX = 1.45;
    this.player.squashY = 0.65;

    audio.playDash();

    // Dash trail burst
    this.emitBurst(this.player.x, this.player.y, '#00ffff', 10, 100);
  }

  private performSlashHit() {
    const baseDamage = 45;
    const critChance = 0.15 + this.playerStats.critTier * 0.08;
    const { damage: rawDamage, isCrit } = calculateDamage(
      baseDamage,
      this.playerStats.damageTier,
      critChance
    );

    const comboMult = 1 + Math.min(this.combo * 0.1, 1.5);
    let finalDmg = Math.round(rawDamage * comboMult);

    if (this.modifier === 'glass_cannon') {
      finalDmg = Math.round(finalDmg * 1.8);
    }

    let hitAny = false;
    const slashReach = this.player.slashRadius + this.playerStats.damageTier * 5;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= slashReach + enemy.radius) {
        // Angle check
        const enemyAngle = Math.atan2(dy, dx);
        let diff = enemyAngle - this.player.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) < Math.PI * 0.65) {
          hitAny = true;
          enemy.hp -= finalDmg;
          enemy.hitFlashTimer = 0.08;

          // Knockback
          const kbForce = enemy.type === 'brute' || enemy.type === 'boss' ? 140 : 360;
          enemy.kbX = Math.cos(enemyAngle) * kbForce;
          enemy.kbY = Math.sin(enemyAngle) * kbForce;

          // Juice: audio, hitstop, trauma, floating damage
          audio.playHit(isCrit);
          this.hitstopTimer = isCrit ? 0.07 : 0.04;
          this.addTrauma(isCrit ? 0.25 : 0.12);

          const dmgColor = isCrit ? '#ff0077' : '#ffd700';
          this.emitFloatingText(
            enemy.x,
            enemy.y - 12,
            isCrit ? `CRIT ${finalDmg}!` : `${finalDmg}`,
            dmgColor
          );
          this.emitBurst(enemy.x, enemy.y, dmgColor, isCrit ? 16 : 8, 220);

          // Check kill
          if (enemy.hp <= 0) {
            this.handleEnemyKilled(enemy);
          }
        }
      }
    }

    if (hitAny) {
      this.combo++;
      this.comboTimer = 2.5;
    }
  }

  private handleEnemyKilled(enemy: Enemy) {
    this.enemiesDefeated++;
    this.score += enemy.type === 'boss' ? 2500 : enemy.type === 'brute' ? 300 : 100;
    audio.playExplosion();
    this.addTrauma(enemy.type === 'boss' ? 0.5 : 0.2);
    this.emitBurst(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 40 : 18, 300);

    // Drop loot
    const coinCount = enemy.type === 'boss' ? 15 : enemy.type === 'brute' ? 5 : 2;
    for (let i = 0; i < coinCount; i++) {
      this.spawnPickup(enemy.x, enemy.y, 'coin', 10);
    }

    if (Math.random() < (enemy.type === 'boss' ? 1 : 0.25)) {
      this.spawnPickup(enemy.x, enemy.y, 'crystal', 1);
    }

    // Health drop chance if low hp
    if (this.player.hp < this.player.maxHp * 0.7 && Math.random() < 0.2) {
      this.spawnPickup(enemy.x, enemy.y, 'health', 25);
    }

    if (this.modifier === 'vampiric') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8);
      this.emitFloatingText(this.player.x, this.player.y - 15, '+8 HP', '#00ff88');
    }
  }

  private spawnPickup(x: number, y: number, type: 'coin' | 'crystal' | 'health', value: number) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    this.pickups.push({
      id: this.nextId++,
      type,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      amount: 1,
      value,
      life: 25,
    });
  }

  private startWave(waveIdx: number) {
    if (waveIdx >= this.level.waves.length) {
      // Victory!
      this.finishRun(true);
      return;
    }

    this.currentWaveIdx = waveIdx;
    this.waveSpawnQueue = { ...this.level.waves[waveIdx] };
    this.waveSpawnTimer = 0;

    const w = this.waveSpawnQueue;
    this.totalEnemiesInWave = w.swarmers + w.snipers + w.brutes + w.spinners + w.bosses;
  }

  private spawnEnemy(type: EnemyType) {
    const arenaW = this.level.arenaWidth;
    const arenaH = this.level.arenaHeight;

    // Spawn at perimeter edge
    let x = 0;
    let y = 0;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      x = Math.random() * arenaW;
      y = 40;
    } else if (edge === 1) {
      x = arenaW - 40;
      y = Math.random() * arenaH;
    } else if (edge === 2) {
      x = Math.random() * arenaW;
      y = arenaH - 40;
    } else {
      x = 40;
      y = Math.random() * arenaH;
    }

    let hp = 40;
    let radius = 14;
    let speed = 160;
    let color = '#ff3366';

    if (type === 'sniper') {
      hp = 55;
      radius = 16;
      speed = 110;
      color = '#aa44ff';
    } else if (type === 'brute') {
      hp = 180;
      radius = 26;
      speed = 85;
      color = '#ff9900';
    } else if (type === 'spinner') {
      hp = 90;
      radius = 18;
      speed = 175;
      color = '#00e5ff';
    } else if (type === 'boss') {
      hp = 950;
      radius = 42;
      speed = 95;
      color = '#ff0055';
    }

    if (this.modifier === 'hyper_speed') {
      speed *= 1.35;
    }

    this.enemies.push({
      id: this.nextId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      hp,
      maxHp: hp,
      speed,
      color,
      telegraphTimer: 0,
      telegraphMax: type === 'sniper' ? 0.65 : type === 'brute' ? 0.75 : 0.8,
      attackCooldown: 1 + Math.random(),
      hitFlashTimer: 0,
      angle: 0,
      kbX: 0,
      kbY: 0,
    });
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.removeListeners();
  }

  private removeListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning || this.isPaused) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.min(rawDt, 0.05);

    // Hitstop freeze simulation motion while camera shake/particles continue
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.render();
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsedTime += dt;

    // Decay trauma for screen shake
    this.trauma = Math.max(0, this.trauma - dt * 1.5);

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Update Player cooldowns & squash recovery
    this.player.dashCooldownTimer = Math.max(0, this.player.dashCooldownTimer - dt);
    this.player.slashCooldownTimer = Math.max(0, this.player.slashCooldownTimer - dt);
    this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - dt);
    this.player.slashTimer = Math.max(0, this.player.slashTimer - dt);
    this.player.squashX += (1 - this.player.squashX) * Math.min(1, dt * 12);
    this.player.squashY += (1 - this.player.squashY) * Math.min(1, dt * 12);

    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    }

    // Player Movement
    let moveX = 0;
    let moveY = 0;

    if (this.touchJoystick.active) {
      const mag = Math.hypot(this.touchJoystick.dx, this.touchJoystick.dy);
      if (mag > 5) {
        moveX = this.touchJoystick.dx / 55;
        moveY = this.touchJoystick.dy / 55;
      }
    } else {
      if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
      if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
      if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
    }

    const moveMag = Math.hypot(moveX, moveY);
    if (!this.player.isDashing) {
      if (moveMag > 0) {
        const normX = moveX / moveMag;
        const normY = moveY / moveMag;
        this.player.vx = normX * this.player.speed;
        this.player.vy = normY * this.player.speed;
        if (this.touchJoystick.active) {
          this.player.angle = Math.atan2(normY, normX);
        }
      } else {
        this.player.vx *= 0.8;
        this.player.vy *= 0.8;
      }
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Bounds clamp
    this.player.x = clamp(this.player.x, 30, this.level.arenaWidth - 30);
    this.player.y = clamp(this.player.y, 30, this.level.arenaHeight - 30);

    // Spawn wave enemies
    this.updateWaveSpawning(dt);

    // Update Enemies
    this.updateEnemies(dt);

    // Update Bullets
    this.updateBullets(dt);

    // Update Pickups
    this.updatePickups(dt);

    // Update Particles
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
    }

    // Camera follow player
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    const maxCamX = Math.max(0, this.level.arenaWidth - this.canvas.width);
    const maxCamY = Math.max(0, this.level.arenaHeight - this.canvas.height);

    this.camera.x += (clamp(targetCamX, 0, maxCamX) - this.camera.x) * Math.min(1, dt * 8);
    this.camera.y += (clamp(targetCamY, 0, maxCamY) - this.camera.y) * Math.min(1, dt * 8);

    // Send throttled HUD data
    this.onHudUpdate({
      hp: Math.max(0, Math.round(this.player.hp)),
      maxHp: this.player.maxHp,
      score: this.score,
      combo: this.combo,
      comboTimer: this.comboTimer,
      coinsCollected: this.coinsEarned,
      crystalsCollected: this.crystalsEarned,
      waveIndex: this.currentWaveIdx + 1,
      totalWaves: this.level.waves.length,
      enemiesRemaining: this.enemies.length + this.getRemainingEnemiesToSpawn(),
      dashCooldownProgress:
        this.player.dashCooldownTimer <= 0
          ? 1
          : 1 - this.player.dashCooldownTimer / this.player.dashCooldown,
      elapsedTime: this.elapsedTime,
    });

    // Check Player Death
    if (this.player.hp <= 0) {
      this.finishRun(false);
    }

    // Check Wave Cleared
    if (this.enemies.length === 0 && this.getRemainingEnemiesToSpawn() === 0) {
      this.startWave(this.currentWaveIdx + 1);
    }
  }

  private getRemainingEnemiesToSpawn(): number {
    if (!this.waveSpawnQueue) return 0;
    const q = this.waveSpawnQueue;
    return q.swarmers + q.snipers + q.brutes + q.spinners + q.bosses;
  }

  private updateWaveSpawning(dt: number) {
    if (!this.waveSpawnQueue) return;
    this.waveSpawnTimer -= dt;
    if (this.waveSpawnTimer > 0) return;

    const q = this.waveSpawnQueue;
    if (q.swarmers > 0) {
      this.spawnEnemy('swarmer');
      q.swarmers--;
      this.waveSpawnTimer = q.spawnDelay;
    } else if (q.snipers > 0) {
      this.spawnEnemy('sniper');
      q.snipers--;
      this.waveSpawnTimer = q.spawnDelay;
    } else if (q.brutes > 0) {
      this.spawnEnemy('brute');
      q.brutes--;
      this.waveSpawnTimer = q.spawnDelay;
    } else if (q.spinners > 0) {
      this.spawnEnemy('spinner');
      q.spinners--;
      this.waveSpawnTimer = q.spawnDelay;
    } else if (q.bosses > 0) {
      this.spawnEnemy('boss');
      q.bosses--;
      this.waveSpawnTimer = q.spawnDelay * 2;
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) {
        this.enemies.splice(i, 1);
        continue;
      }

      e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);

      // Knockback decay
      e.x += e.kbX * dt;
      e.y += e.kbY * dt;
      e.kbX *= 0.88;
      e.kbY *= 0.88;

      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);
      e.angle = Math.atan2(dy, dx);

      // Distinct enemy behavior policies
      if (e.type === 'swarmer') {
        // Direct relentless seeker
        e.attackCooldown = Math.max(0, e.attackCooldown - dt);
        const spd = e.speed;
        e.x += Math.cos(e.angle) * spd * dt;
        e.y += Math.sin(e.angle) * spd * dt;

        if (dist < e.radius + this.player.radius && e.attackCooldown <= 0) {
          this.damagePlayer(12);
          e.attackCooldown = 0.9;
          // Slight recoil bounce
          e.kbX = -Math.cos(e.angle) * 120;
          e.kbY = -Math.sin(e.angle) * 120;
        }
      } else if (e.type === 'sniper') {
        // Standoff kiter with laser telegraph
        if (dist < 260) {
          // Back away
          e.x -= Math.cos(e.angle) * e.speed * dt;
          e.y -= Math.sin(e.angle) * e.speed * dt;
        } else if (dist > 400) {
          // Approach
          e.x += Math.cos(e.angle) * e.speed * dt;
          e.y += Math.sin(e.angle) * e.speed * dt;
        }

        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0 && e.telegraphTimer <= 0) {
          e.telegraphTimer = e.telegraphMax;
          audio.playTelegraph();
        }

        if (e.telegraphTimer > 0) {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // Fire high speed plasma bullet
            this.fireBullet(e.x, e.y, e.angle, 520, 22, '#aa44ff', true);
            e.attackCooldown = 2.4 + Math.random() * 0.8;
          }
        }
      } else if (e.type === 'brute') {
        // Slow advance, windup seismic slam when close
        if (e.telegraphTimer > 0) {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // SLAM shockwave
            audio.playExplosion();
            this.addTrauma(0.35);
            this.emitBurst(e.x, e.y, '#ff9900', 24, 250);

            // Ring attack
            const ringCount = 12;
            for (let r = 0; r < ringCount; r++) {
              const ang = (Math.PI * 2 * r) / ringCount;
              this.fireBullet(e.x, e.y, ang, 260, 28, '#ff9900', true);
            }
            e.attackCooldown = 3.0;
          }
        } else {
          e.x += Math.cos(e.angle) * e.speed * dt;
          e.y += Math.sin(e.angle) * e.speed * dt;

          e.attackCooldown -= dt;
          if (dist < 180 && e.attackCooldown <= 0) {
            e.telegraphTimer = e.telegraphMax;
            audio.playTelegraph();
          }

          if (dist < e.radius + this.player.radius) {
            this.damagePlayer(25);
          }
        }
      } else if (e.type === 'spinner') {
        // High speed rotating blades with periodic dashes
        e.attackCooldown -= dt;
        const isTurbo = e.attackCooldown < 0.6 && e.attackCooldown > 0;
        const spd = isTurbo ? e.speed * 2.2 : e.speed;

        e.x += Math.cos(e.angle) * spd * dt;
        e.y += Math.sin(e.angle) * spd * dt;

        if (e.attackCooldown <= 0) {
          e.attackCooldown = 3.5;
        }

        if (dist < e.radius + this.player.radius && e.attackCooldown <= 0) {
          this.damagePlayer(18);
          e.attackCooldown = 0.8;
          e.kbX = -Math.cos(e.angle) * 100;
          e.kbY = -Math.sin(e.angle) * 100;
        }
      } else if (e.type === 'boss') {
        // Boss: rotates attacks (slam, ring bullet, laser)
        e.attackCooldown -= dt;
        e.x += Math.cos(e.angle) * e.speed * 0.7 * dt;
        e.y += Math.sin(e.angle) * e.speed * 0.7 * dt;

        if (e.telegraphTimer > 0) {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // Boss mega burst
            audio.playExplosion();
            this.addTrauma(0.4);
            const bulletCount = 18;
            for (let b = 0; b < bulletCount; b++) {
              const ang = (Math.PI * 2 * b) / bulletCount;
              this.fireBullet(e.x, e.y, ang, 290, 24, '#ff0055', true);
            }
            e.attackCooldown = 3.2;
          }
        } else if (e.attackCooldown <= 0) {
          e.telegraphTimer = e.telegraphMax;
          audio.playTelegraph();
        }

        if (dist < e.radius + this.player.radius) {
          this.damagePlayer(35);
        }
      }

      // Keep within arena
      e.x = clamp(e.x, 30, this.level.arenaWidth - 30);
      e.y = clamp(e.y, 30, this.level.arenaHeight - 30);
    }
  }

  private fireBullet(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    color: string,
    isEnemy: boolean
  ) {
    this.bullets.push({
      id: this.nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      damage,
      color,
      isEnemy,
      life: 4.5,
    });
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Arena walls
      if (
        b.x < 10 ||
        b.x > this.level.arenaWidth - 10 ||
        b.y < 10 ||
        b.y > this.level.arenaHeight - 10
      ) {
        this.emitBurst(b.x, b.y, b.color, 4, 80);
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (b.isEnemy) {
        const dx = this.player.x - b.x;
        const dy = this.player.y - b.y;
        if (Math.hypot(dx, dy) < this.player.radius + b.radius) {
          this.damagePlayer(b.damage);
          this.emitBurst(b.x, b.y, b.color, 6, 120);
          this.bullets.splice(i, 1);
          continue;
        }
      }
    }
  }

  private damagePlayer(amount: number) {
    if (this.player.invincibleTimer > 0 || this.player.isDashing) return;

    let dmg = amount;
    if (this.modifier === 'glass_cannon') dmg *= 2;

    this.player.hp -= dmg;
    this.player.invincibleTimer = 0.55; // i-frames
    audio.playHurt();
    this.addTrauma(0.35);

    this.emitFloatingText(this.player.x, this.player.y - 20, `-${Math.round(dmg)}`, '#ff0055');
    this.emitBurst(this.player.x, this.player.y, '#ff0055', 14, 200);

    // Reset combo on hit
    this.combo = 0;
  }

  private updatePickups(dt: number) {
    const magnetRange = 100 + this.playerStats.magnetTier * 50;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);

      // Magnet pull
      if (dist < magnetRange) {
        const pullSpeed = (1 - dist / magnetRange) * 550 + 120;
        p.vx = (dx / dist) * pullSpeed;
        p.vy = (dy / dist) * pullSpeed;
      } else {
        p.vx *= 0.92;
        p.vy *= 0.92;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Pickup trigger
      if (dist < this.player.radius + 12) {
        audio.playCoin();
        if (p.type === 'coin') {
          this.coinsEarned += p.value;
          this.score += p.value * 5;
          this.emitFloatingText(p.x, p.y - 8, `+${p.value}c`, '#ffd700');
        } else if (p.type === 'crystal') {
          this.crystalsEarned += p.value;
          this.score += p.value * 50;
          this.emitFloatingText(p.x, p.y - 8, `+${p.value}💎`, '#00ffff');
        } else if (p.type === 'health') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + p.value);
          this.emitFloatingText(p.x, p.y - 8, `+${p.value} HP`, '#00ff88');
        }
        this.emitBurst(p.x, p.y, p.type === 'coin' ? '#ffd700' : '#00ffff', 6, 90);
        this.pickups.splice(i, 1);
      }
    }
  }

  private finishRun(victory: boolean) {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.removeListeners();

    if (victory) {
      audio.playVictory();
    } else {
      audio.playDefeat();
    }

    // Pass outcome stats
    this.onGameOver({
      victory,
      clearTime: this.elapsedTime,
      hpRemaining: Math.max(0, this.player.hp),
      maxHp: this.player.maxHp,
      coinsEarned: this.coinsEarned + (victory ? this.level.rewardCoins : 0),
      crystalsEarned: this.crystalsEarned + (victory ? this.level.rewardCrystals : 0),
      score: this.score,
      enemiesDefeated: this.enemiesDefeated,
    });
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Apply trauma camera shake
    const shakeIntensity = this.trauma * this.trauma * 16;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Deep dark sci-fi background
    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, w, h);

    // Camera transform
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // Draw Cyber Arena Grid
    this.renderArenaGrid();

    // Draw Pickups
    this.renderPickups();

    // Draw Enemy Attack Telegraphs
    this.renderTelegraphs();

    // Draw Enemies
    this.renderEnemies();

    // Draw Bullets
    this.renderBullets();

    // Draw Player
    this.renderPlayer();

    // Draw Particles & Floating Text
    this.renderParticles();

    ctx.restore();

    // Render Virtual Mobile Joystick if active
    if (this.touchJoystick.active) {
      this.renderJoystick();
    }
  }

  private renderArenaGrid() {
    const ctx = this.ctx;
    const arenaW = this.level.arenaWidth;
    const arenaH = this.level.arenaHeight;

    // Arena Floor
    ctx.fillStyle = '#0f1422';
    ctx.fillRect(0, 0, arenaW, arenaH);

    // Grid lines
    ctx.strokeStyle = '#1a233a';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x <= arenaW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, arenaH);
      ctx.stroke();
    }
    for (let y = 0; y <= arenaH; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(arenaW, y);
      ctx.stroke();
    }

    // Outer Neon Border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, arenaW, arenaH);

    // Corner Accents
    ctx.fillStyle = '#00ffff';
    const cSize = 24;
    ctx.fillRect(0, 0, cSize, 4);
    ctx.fillRect(0, 0, 4, cSize);
    ctx.fillRect(arenaW - cSize, 0, cSize, 4);
    ctx.fillRect(arenaW - 4, 0, 4, cSize);
    ctx.fillRect(0, arenaH - 4, cSize, 4);
    ctx.fillRect(0, arenaH - cSize, 4, cSize);
    ctx.fillRect(arenaW - cSize, arenaH - 4, cSize, 4);
    ctx.fillRect(arenaW - 4, arenaH - cSize, 4, cSize);
  }

  private renderPickups() {
    const ctx = this.ctx;
    for (const p of this.pickups) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === 'coin') {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.type === 'crystal') {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 9);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(-6, -6, 12, 12);
      }
      ctx.restore();
    }
  }

  private renderTelegraphs() {
    const ctx = this.ctx;
    for (const e of this.enemies) {
      if (e.telegraphTimer <= 0) continue;
      const progress = 1 - e.telegraphTimer / e.telegraphMax;

      if (e.type === 'sniper') {
        // Red laser sight line
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 85, ${0.4 + progress * 0.6})`;
        ctx.lineWidth = 1.5 + progress * 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.angle) * 700, e.y + Math.sin(e.angle) * 700);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'brute') {
        // Expanding danger slam ring
        ctx.save();
        ctx.strokeStyle = `rgba(255, 153, 0, ${0.4 + progress * 0.6})`;
        ctx.fillStyle = `rgba(255, 153, 0, ${progress * 0.18})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, progress * 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'boss') {
        // Boss charging warning ring
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 85, ${0.5 + progress * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, progress * 200, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private renderEnemies() {
    const ctx = this.ctx;
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        if (e.type === 'swarmer') {
          // Sharp triangular drone
          ctx.rotate(e.angle);
          ctx.moveTo(e.radius * 1.2, 0);
          ctx.lineTo(-e.radius * 0.8, -e.radius * 0.8);
          ctx.lineTo(-e.radius * 0.4, 0);
          ctx.lineTo(-e.radius * 0.8, e.radius * 0.8);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === 'spinner') {
          // Rotating blade star
          ctx.rotate(performance.now() * 0.008);
          for (let b = 0; b < 4; b++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillRect(-3, -e.radius * 1.3, 6, e.radius * 2.6);
          }
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'brute') {
          // Armored octagon
          ctx.beginPath();
          const sides = 8;
          for (let s = 0; s < sides; s++) {
            const a = (Math.PI * 2 * s) / sides;
            const px = Math.cos(a) * e.radius;
            const py = Math.sin(a) * e.radius;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (e.type === 'boss') {
          // Massive cyber titan
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();
          // Core pulsing glow
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sniper turret
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.rotate(e.angle);
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, -3, e.radius * 1.4, 6);
        }
      }

      // Health bar above enemy if damaged
      if (e.hp < e.maxHp) {
        const barW = e.radius * 2;
        const barH = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, -e.radius - 10, barW, barH);
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(-barW / 2, -e.radius - 10, barW * hpPct, barH);
      }

      ctx.restore();
    }
  }

  private renderBullets() {
    const ctx = this.ctx;
    for (const b of this.bullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderPlayer() {
    const ctx = this.ctx;
    const p = this.player;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Squash & Stretch rotation
    ctx.rotate(p.angle);
    ctx.scale(p.squashX, p.squashY);

    // Invulnerability blink
    if (p.invincibleTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Player body
    const skinColor =
      this.playerStats.bladeSkin === 'crimson'
        ? '#ff3344'
        : this.playerStats.bladeSkin === 'violet'
        ? '#bf00ff'
        : this.playerStats.bladeSkin === 'gold'
        ? '#ffd700'
        : '#00ffff';

    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cyber visor / facing direction
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.radius * 0.4, -4, 8, 8);

    // Dash trail effect
    if (p.isDashing) {
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Render Slash Arc
    if (p.slashTimer > 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      const slashProgress = 1 - p.slashTimer / p.slashDuration;
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const currentEnd = p.slashAngleStart + (p.slashAngleEnd - p.slashAngleStart) * slashProgress;
      ctx.arc(0, 0, p.slashRadius, p.slashAngleStart, currentEnd);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;

      ctx.save();
      if (p.shape === 'text' && p.text) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderJoystick() {
    const ctx = this.ctx;
    const js = this.touchJoystick;
    ctx.save();
    // Base ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(js.startX, js.startY, 55, 0, Math.PI * 2);
    ctx.stroke();

    // Nub
    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(js.startX + js.dx, js.startY + js.dy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
