import { Effect } from "../../infrastructure/effects/effect";
import { ParticleEffect, ParticleConfig } from "../../infrastructure/effects/particle-effect";
import { DamageNumberEffect, DamageNumberConfig } from "../../infrastructure/effects/damage-number-effect";
import { Position } from "../value-objects/position";
import { Color } from "../value-objects/color";
import { RenderingService } from "../services/rendering-service";
import { AnimationService } from "../services/animation-service";

/**
 * エフェクト管理エンティティ
 * 全てのビジュアルエフェクトの生成・更新・描画を管理
 */
export class EffectManager {
  private readonly renderingService: RenderingService;
  private readonly animationService: AnimationService;
  private readonly effects: Effect[] = [];

  // プリセット設定
  private readonly presetConfigs = {
    explosion: {
      particleCount: 20,
      minVelocity: 80,
      maxVelocity: 150,
      minSize: 3,
      maxSize: 8,
      minLife: 0.5,
      maxLife: 1.2,
      colors: [
        new Color(255, 100, 50),
        new Color(255, 150, 50),
        new Color(255, 200, 100),
        new Color(200, 200, 200),
      ],
      gravity: 300,
      spread: Math.PI * 2,
    } as ParticleConfig,

    hit: {
      particleCount: 8,
      minVelocity: 40,
      maxVelocity: 80,
      minSize: 2,
      maxSize: 4,
      minLife: 0.3,
      maxLife: 0.8,
      colors: [
        new Color(255, 255, 255),
        new Color(255, 200, 200),
      ],
      gravity: 150,
      spread: Math.PI / 3,
    } as ParticleConfig,

    magic: {
      particleCount: 15,
      minVelocity: 20,
      maxVelocity: 60,
      minSize: 1,
      maxSize: 3,
      minLife: 0.8,
      maxLife: 1.5,
      colors: [
        new Color(100, 150, 255),
        new Color(150, 100, 255),
        new Color(200, 150, 255),
      ],
      gravity: -50, // 上向きの重力
      spread: Math.PI / 2,
    } as ParticleConfig,

    normalDamage: {
      fontSize: 16,
      color: new Color(255, 255, 255),
      outlineColor: new Color(0, 0, 0),
      moveDistance: 40,
      fadeInDuration: 150,
      fadeOutDuration: 400,
      isCritical: false,
    } as DamageNumberConfig,

    criticalDamage: {
      fontSize: 20,
      color: new Color(255, 255, 100),
      outlineColor: new Color(200, 0, 0),
      moveDistance: 60,
      fadeInDuration: 200,
      fadeOutDuration: 500,
      isCritical: true,
    } as DamageNumberConfig,

    healing: {
      fontSize: 16,
      color: new Color(100, 255, 100),
      outlineColor: new Color(0, 100, 0),
      moveDistance: 30,
      fadeInDuration: 150,
      fadeOutDuration: 400,
      isCritical: false,
    } as DamageNumberConfig,
  };

  constructor(renderingService: RenderingService, animationService: AnimationService) {
    this.renderingService = renderingService;
    this.animationService = animationService;
  }

  /**
   * アクティブなエフェクト数を取得
   */
  get activeEffectCount(): number {
    return this.effects.filter(effect => effect.isActive).length;
  }

  /**
   * 全エフェクト数を取得
   */
  get totalEffectCount(): number {
    return this.effects.length;
  }

  /**
   * 爆発エフェクトを作成
   */
  createExplosion(position: Position, customConfig?: Partial<ParticleConfig>): ParticleEffect {
    const config = { ...this.presetConfigs.explosion, ...customConfig };
    const effect = new ParticleEffect(position, 2000, this.renderingService, config);
    this.effects.push(effect);
    return effect;
  }

  /**
   * ヒットエフェクトを作成
   */
  createHitEffect(position: Position, customConfig?: Partial<ParticleConfig>): ParticleEffect {
    const config = { ...this.presetConfigs.hit, ...customConfig };
    const effect = new ParticleEffect(position, 1000, this.renderingService, config);
    this.effects.push(effect);
    return effect;
  }

  /**
   * 魔法エフェクトを作成
   */
  createMagicEffect(position: Position, customConfig?: Partial<ParticleConfig>): ParticleEffect {
    const config = { ...this.presetConfigs.magic, ...customConfig };
    const effect = new ParticleEffect(position, 2500, this.renderingService, config);
    this.effects.push(effect);
    return effect;
  }

  /**
   * ダメージ数値エフェクトを作成
   */
  createDamageNumber(
    position: Position,
    damage: number,
    isCritical = false,
    customConfig?: Partial<DamageNumberConfig>
  ): DamageNumberEffect {
    const baseConfig = isCritical ? this.presetConfigs.criticalDamage : this.presetConfigs.normalDamage;
    const config = { ...baseConfig, ...customConfig };
    
    const effect = new DamageNumberEffect(
      position,
      damage,
      this.renderingService,
      this.animationService,
      config
    );
    this.effects.push(effect);
    return effect;
  }

  /**
   * 回復数値エフェクトを作成
   */
  createHealingNumber(
    position: Position,
    healAmount: number,
    customConfig?: Partial<DamageNumberConfig>
  ): DamageNumberEffect {
    const config = { ...this.presetConfigs.healing, ...customConfig };
    
    const effect = new DamageNumberEffect(
      position,
      healAmount,
      this.renderingService,
      this.animationService,
      config
    );
    this.effects.push(effect);
    return effect;
  }

  /**
   * カスタムパーティクルエフェクトを作成
   */
  createCustomParticleEffect(
    position: Position,
    duration: number,
    config: ParticleConfig
  ): ParticleEffect {
    const effect = new ParticleEffect(position, duration, this.renderingService, config);
    this.effects.push(effect);
    return effect;
  }

  /**
   * カスタムダメージ数値エフェクトを作成
   */
  createCustomDamageNumber(
    position: Position,
    value: number,
    config: DamageNumberConfig
  ): DamageNumberEffect {
    const effect = new DamageNumberEffect(
      position,
      value,
      this.renderingService,
      this.animationService,
      config
    );
    this.effects.push(effect);
    return effect;
  }

  /**
   * 全エフェクトを更新
   */
  update(deltaTime: number): void {
    for (const effect of this.effects) {
      if (effect.isActive) {
        effect.update(deltaTime);
      }
    }

    // 非アクティブなエフェクトを削除
    this.cleanupInactiveEffects();
  }

  /**
   * 全エフェクトを描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    for (const effect of this.effects) {
      if (effect.isActive) {
        effect.render(context, deltaTime);
      }
    }
  }

  /**
   * 特定の位置周辺のエフェクトを取得
   */
  getEffectsNear(position: Position, radius: number): Effect[] {
    return this.effects.filter(effect => {
      if (!effect.isActive) return false;
      
      const distance = Math.sqrt(
        Math.pow(effect.effectPosition.x - position.x, 2) +
        Math.pow(effect.effectPosition.y - position.y, 2)
      );
      
      return distance <= radius;
    });
  }

  /**
   * 全エフェクトを停止
   */
  stopAllEffects(): void {
    for (const effect of this.effects) {
      effect.stop();
    }
  }

  /**
   * 特定タイプのエフェクトを停止
   */
  stopEffectsByType<T extends Effect>(effectType: new (...args: any[]) => T): void {
    for (const effect of this.effects) {
      if (effect instanceof effectType) {
        effect.stop();
      }
    }
  }

  /**
   * 全エフェクトをクリア
   */
  clearAllEffects(): void {
    this.stopAllEffects();
    this.effects.length = 0;
  }

  /**
   * プリセット設定を取得
   */
  getPresetConfig(presetName: keyof typeof this.presetConfigs): ParticleConfig | DamageNumberConfig {
    return { ...this.presetConfigs[presetName] };
  }

  /**
   * 非アクティブなエフェクトを削除
   */
  private cleanupInactiveEffects(): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      if (!this.effects[i].isActive) {
        this.effects.splice(i, 1);
      }
    }
  }
}