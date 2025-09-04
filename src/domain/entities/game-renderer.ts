import { Rectangle } from "../value-objects/rectangle";
import type { Enemy } from "./enemy";
import type { Position } from "../value-objects/position";
import type { Tower } from "./tower";

/**
 * レンダリングレイヤーインターフェース
 */
export interface RenderLayer {
  name: string;
  zIndex: number;
  isVisible: boolean;
  render(context: CanvasRenderingContext2D, deltaTime: number): void;
}

/**
 * フレーム統計情報
 */
export interface FrameStats {
  frameCount: number;
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  currentFPS: number;
}

/**
 * 全体的な描画制御とレンダリングループ管理を行うエンティティ
 */
export class GameRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;
  
  private _layers: RenderLayer[] = [];
  private _isRunning = false;
  private _animationFrameId: number | null = null;
  private _lastFrameTime = 0;
  private _frameCount = 0;
  private _frameTimes: number[] = [];
  private readonly _maxFrameHistory = 60; // 1秒分のフレーム履歴

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    
    this.context = context;
  }

  /**
   * ビューポート情報を取得
   */
  get viewport(): Rectangle {
    return new Rectangle(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * レンダリングループ実行状態
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * レンダリングレイヤー配列（読み取り専用）
   */
  get layers(): readonly RenderLayer[] {
    return [...this._layers];
  }

  /**
   * 画面サイズを変更
   */
  resize(width: number, height: number): void {
    // 最小サイズを保証
    this.canvas.width = Math.max(100, width);
    this.canvas.height = Math.max(100, height);
  }

  /**
   * レンダリングレイヤーを追加
   */
  addLayer(layer: RenderLayer): void {
    this._layers.push(layer);
    this._sortLayers();
  }

  /**
   * レンダリングレイヤーを削除
   */
  removeLayer(name: string): void {
    this._layers = this._layers.filter(layer => layer.name !== name);
  }

  /**
   * レンダリングレイヤーを取得
   */
  getLayer(name: string): RenderLayer | null {
    return this._layers.find(layer => layer.name === name) || null;
  }

  /**
   * フレーム描画を実行
   */
  render(deltaTime: number): void {
    // キャンバスをクリア
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 可視レイヤーを順番に描画
    for (const layer of this._layers) {
      if (layer.isVisible) {
        this.context.save();
        layer.render(this.context, deltaTime);
        this.context.restore();
      }
    }

    // フレーム統計を更新
    this._updateFrameStats(deltaTime);
  }

  /**
   * レンダリングループを開始
   */
  startRenderLoop(): void {
    if (this._isRunning) {
      return; // 既に実行中
    }

    this._isRunning = true;
    this._lastFrameTime = performance.now();
    this._requestNextFrame();
  }

  /**
   * レンダリングループを停止
   */
  stopRenderLoop(): void {
    if (!this._isRunning) {
      return;
    }

    this._isRunning = false;
    
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * 現在のFPSを取得
   */
  getCurrentFPS(): number {
    if (this._frameTimes.length === 0) {
      return 0;
    }

    const averageFrameTime = this._frameTimes.reduce((sum, time) => sum + time, 0) / this._frameTimes.length;
    return averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
  }

  /**
   * フレーム統計情報を取得
   */
  getFrameStats(): FrameStats {
    const frameCount = this._frameCount;
    const frameTimes = this._frameTimes;
    
    if (frameTimes.length === 0) {
      return {
        frameCount,
        averageFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        currentFPS: 0,
      };
    }

    const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    const minFrameTime = Math.min(...frameTimes);
    const maxFrameTime = Math.max(...frameTimes);
    const currentFPS = this.getCurrentFPS();

    return {
      frameCount,
      averageFrameTime,
      minFrameTime,
      maxFrameTime,
      currentFPS,
    };
  }

  /**
   * レイヤーをzIndexでソート
   */
  private _sortLayers(): void {
    this._layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * 次のフレームをリクエスト
   */
  private _requestNextFrame(): void {
    if (!this._isRunning) {
      return;
    }

    this._animationFrameId = requestAnimationFrame((currentTime) => {
      const deltaTime = currentTime - this._lastFrameTime;
      this._lastFrameTime = currentTime;

      this.render(deltaTime);
      this._requestNextFrame();
    });
  }

  /**
   * フレーム統計を更新
   */
  private _updateFrameStats(deltaTime: number): void {
    this._frameCount++;
    this._frameTimes.push(deltaTime);

    // 履歴サイズを制限
    if (this._frameTimes.length > this._maxFrameHistory) {
      this._frameTimes.shift();
    }
  }

  /**
   * 敵を描画
   */
  renderEnemies(enemies: Enemy[]): void {
    this.context.save();
    
    console.log(`Rendering ${enemies.length} enemies`); // デバッグログ
    
    for (const enemy of enemies) {
      if (!enemy.isAlive) {
        console.log(`Skipping dead enemy: ${enemy.id}`);
        continue;
      }

      const position = enemy.currentPosition;
      const size = this.getEnemySizeByType(enemy.type);
      const color = this.getEnemyColorByType(enemy.type);

      console.log(`Drawing enemy ${enemy.id} at (${position.x}, ${position.y}) with size ${size} and color ${color}`);

      // 画面境界チェック
      if (position.x < -50 || position.x > this.canvas.width + 50 || 
          position.y < -50 || position.y > this.canvas.height + 50) {
        console.log(`Enemy ${enemy.id} is outside screen bounds`);
      }

      // 敵の本体を描画
      this.context.fillStyle = color;
      this.context.fillRect(
        position.x - size / 2,
        position.y - size / 2,
        size,
        size
      );

      // 敵の枠線を描画
      this.context.strokeStyle = '#000000';
      this.context.lineWidth = 2;
      this.context.strokeRect(
        position.x - size / 2,
        position.y - size / 2,
        size,
        size
      );

      // 体力バーを描画
      this.renderEnemyHealthBar(enemy, position, size);
    }
    
    this.context.restore();
  }

  /**
   * 敵の体力バーを描画
   */
  private renderEnemyHealthBar(enemy: Enemy, position: Position, size: number): void {
    const barWidth = size;
    const barHeight = 4;
    const barY = position.y - size / 2 - 8;

    // 背景バー
    this.context.fillStyle = '#333333';
    this.context.fillRect(
      position.x - barWidth / 2,
      barY,
      barWidth,
      barHeight
    );

    // 体力バー
    const healthPercentage = enemy.health.currentHealth.value / enemy.health.maxHealth;
    const healthBarWidth = barWidth * healthPercentage;
    
    // 体力に応じて色を変更
    if (healthPercentage > 0.6) {
      this.context.fillStyle = '#4CAF50'; // 緑
    } else if (healthPercentage > 0.3) {
      this.context.fillStyle = '#FF9800'; // オレンジ
    } else {
      this.context.fillStyle = '#F44336'; // 赤
    }

    this.context.fillRect(
      position.x - barWidth / 2,
      barY,
      healthBarWidth,
      barHeight
    );
  }

  /**
   * 移動パスを描画
   */
  renderMovementPath(pathPoints: Position[]): void {
    if (pathPoints.length < 2) return;

    this.context.save();
    this.context.strokeStyle = '#666666';
    this.context.lineWidth = 3;
    this.context.setLineDash([5, 5]);

    this.context.beginPath();
    this.context.moveTo(pathPoints[0].x, pathPoints[0].y);

    for (let i = 1; i < pathPoints.length; i++) {
      this.context.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

    this.context.stroke();
    this.context.restore();

    // START/GOAL表示はGameFieldUIで行うため、ここでは描画しない
  }



  /**
   * 敵タイプに応じたサイズを取得
   */
  private getEnemySizeByType(enemyType: any): number {
    // 敵タイプに応じてサイズを変更
    switch (enemyType.name) {
      case 'BASIC':
        return 20;
      case 'FAST':
        return 16;
      case 'RANGED':
        return 18;
      case 'ENHANCED':
        return 24;
      case 'BOSS':
        return 32;
      default:
        return 20;
    }
  }

  /**
   * 敵タイプに応じた色を取得
   */
  private getEnemyColorByType(enemyType: any): string {
    // 敵タイプに応じて色を変更
    switch (enemyType.name) {
      case 'BASIC':
        return '#FF6B6B';
      case 'FAST':
        return '#4ECDC4';
      case 'RANGED':
        return '#45B7D1';
      case 'ENHANCED':
        return '#96CEB4';
      case 'BOSS':
        return '#FFEAA7';
      default:
        return '#FF6B6B';
    }
  }

  /**
   * タワーを描画
   */
  renderTowers(towers: Tower[]): void {
    this.context.save();
    
    for (const tower of towers) {
      const position = tower.position;
      const size = this.getTowerSizeByType(tower.type);
      const color = this.getTowerColorByType(tower.type);

      // タワーの射程範囲を描画（薄く）
      this.context.strokeStyle = color;
      this.context.globalAlpha = 0.1;
      this.context.lineWidth = 1;
      this.context.beginPath();
      this.context.arc(position.x, position.y, tower.stats.range, 0, Math.PI * 2);
      this.context.stroke();
      this.context.globalAlpha = 1.0;

      // タワーの本体を描画
      this.context.fillStyle = color;
      this.context.fillRect(
        position.x - size / 2,
        position.y - size / 2,
        size,
        size
      );

      // タワーの枠線を描画
      this.context.strokeStyle = '#000000';
      this.context.lineWidth = 2;
      this.context.strokeRect(
        position.x - size / 2,
        position.y - size / 2,
        size,
        size
      );

      // ターゲットがいる場合は攻撃線を描画
      if (tower.currentTarget && tower.currentTarget.isAlive) {
        this.renderAttackLine(tower.position, tower.currentTarget.currentPosition);
      }
    }
    
    this.context.restore();
  }

  /**
   * 攻撃線を描画
   */
  private renderAttackLine(from: Position, to: Position): void {
    this.context.save();
    this.context.strokeStyle = '#FFD700';
    this.context.lineWidth = 2;
    this.context.globalAlpha = 0.7;
    
    this.context.beginPath();
    this.context.moveTo(from.x, from.y);
    this.context.lineTo(to.x, to.y);
    this.context.stroke();
    
    this.context.restore();
  }

  /**
   * タワータイプに応じたサイズを取得
   */
  private getTowerSizeByType(towerType: string): number {
    switch (towerType) {
      case 'ARCHER':
        return 24;
      case 'CANNON':
        return 32;
      case 'MAGIC':
        return 28;
      case 'ICE':
        return 26;
      case 'FIRE':
        return 30;
      case 'LIGHTNING':
        return 26;
      case 'POISON':
        return 22;
      case 'SUPPORT':
        return 20;
      default:
        return 24;
    }
  }

  /**
   * タワータイプに応じた色を取得
   */
  private getTowerColorByType(towerType: string): string {
    switch (towerType) {
      case 'ARCHER':
        return '#8B4513';
      case 'CANNON':
        return '#696969';
      case 'MAGIC':
        return '#9370DB';
      case 'ICE':
        return '#87CEEB';
      case 'FIRE':
        return '#FF4500';
      case 'LIGHTNING':
        return '#FFD700';
      case 'POISON':
        return '#9ACD32';
      case 'SUPPORT':
        return '#DDA0DD';
      default:
        return '#8B4513';
    }
  }

  /**
   * 配置可能位置を描画（デバッグ用）
   */
  renderValidPlacementPositions(positions: Position[]): void {
    this.context.save();
    this.context.fillStyle = '#00FF00';
    this.context.globalAlpha = 0.3;
    
    for (const position of positions) {
      this.context.beginPath();
      this.context.arc(position.x, position.y, 8, 0, Math.PI * 2);
      this.context.fill();
    }
    
    this.context.restore();
  }
}