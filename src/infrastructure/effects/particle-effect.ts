import { Effect } from "./effect";
import { Position } from "../../domain/value-objects/position";
import { Color } from "../../domain/value-objects/color";
import { RenderingService } from "../../domain/services/rendering-service";

/**
 * パーティクル情報
 */
interface Particle {
  position: Position;
  velocity: Position;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
}

/**
 * パーティクルエフェクト設定
 */
export interface ParticleConfig {
  particleCount: number;
  minVelocity: number;
  maxVelocity: number;
  minSize: number;
  maxSize: number;
  minLife: number;
  maxLife: number;
  colors: Color[];
  gravity?: number;
  spread?: number;
}

/**
 * パーティクルエフェクト実装
 * 爆発、ヒット、魔法などの視覚効果
 */
export class ParticleEffect extends Effect {
  private readonly renderingService: RenderingService;
  private readonly particles: Particle[] = [];
  private readonly config: ParticleConfig;

  constructor(
    position: Position,
    duration: number,
    renderingService: RenderingService,
    config: ParticleConfig
  ) {
    super(position, duration);
    this.renderingService = renderingService;
    this.config = config;
    this.initializeParticles();
    
    // パーティクル数が0の場合は即座に非アクティブに
    if (config.particleCount === 0) {
      this._isActive = false;
    }
  }

  /**
   * パーティクルを初期化
   */
  private initializeParticles(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / this.config.particleCount + 
                   (Math.random() - 0.5) * (this.config.spread || Math.PI / 4);
      
      const speed = this.config.minVelocity + 
                   Math.random() * (this.config.maxVelocity - this.config.minVelocity);
      
      const velocity = new Position(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      const life = this.config.minLife + 
                  Math.random() * (this.config.maxLife - this.config.minLife);
      
      const size = this.config.minSize + 
                  Math.random() * (this.config.maxSize - this.config.minSize);
      
      const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

      this.particles.push({
        position: new Position(this.position.x, this.position.y),
        velocity,
        life,
        maxLife: life,
        size,
        color,
      });
    }
  }

  /**
   * パーティクルを更新
   */
  update(deltaTime: number): void {
    super.update(deltaTime);

    // パーティクルが最初から0個の場合は即座に非アクティブに
    if (this.config.particleCount === 0) {
      this._isActive = false;
      return;
    }

    const dt = deltaTime / 1000; // ミリ秒を秒に変換

    for (const particle of this.particles) {
      // 位置を更新
      particle.position = new Position(
        particle.position.x + particle.velocity.x * dt,
        particle.position.y + particle.velocity.y * dt
      );

      // 重力を適用
      if (this.config.gravity) {
        particle.velocity = new Position(
          particle.velocity.x,
          particle.velocity.y + this.config.gravity * dt
        );
      }

      // 寿命を減らす
      particle.life -= dt;
    }

    // 寿命が尽きたパーティクルを削除
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 全パーティクルが消えたら非アクティブに
    if (this.particles.length === 0) {
      this._isActive = false;
    }
  }

  /**
   * パーティクルを描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    if (!this.isActive) return;

    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      const color = new Color(
        particle.color.r,
        particle.color.g,
        particle.color.b,
        particle.color.a * alpha
      );

      this.renderingService.renderCircle(
        context,
        particle.position,
        particle.size,
        color,
        color,
        0
      );
    }
  }

  /**
   * アクティブなパーティクル数を取得
   */
  get activeParticleCount(): number {
    return this.particles.length;
  }

  /**
   * パーティクル設定を取得
   */
  get particleConfig(): ParticleConfig {
    return { ...this.config };
  }
}