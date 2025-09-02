import { Rectangle } from "../value-objects/rectangle";

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
}