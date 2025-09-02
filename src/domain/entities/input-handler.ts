import { Position } from "../value-objects/position";

/**
 * InputHandlerのオプション
 */
export interface InputHandlerOptions {
  setupEventListeners?: boolean;
}

/**
 * マウス・キーボード入力の処理と変換を行うエンティティ
 */
export class InputHandler {
  public readonly canvas: HTMLCanvasElement;

  private _mousePosition = new Position(0, 0);
  private _isDragging = false;
  private _dragStartPosition = new Position(0, 0);
  private _hoveredElement: any = null;
  private _isEnabled = true;

  // イベントハンドラー（外部から設定可能）
  public onMouseDown?: (position: Position, button: number) => void;
  public onMouseUp?: (position: Position, button: number) => void;
  public onMouseMove?: (position: Position) => void;
  public onDragStart?: (position: Position) => void;
  public onDragEnd?: (startPosition: Position, endPosition: Position) => void;
  public onKeyDown?: (key: string, code: string) => void;
  public onKeyUp?: (key: string, code: string) => void;

  constructor(canvas: HTMLCanvasElement, options: InputHandlerOptions = {}) {
    this.canvas = canvas;

    if (options.setupEventListeners !== false) {
      this._setupEventListeners();
    }
  }

  /**
   * 現在のマウス位置
   */
  get mousePosition(): Position {
    return this._mousePosition;
  }

  /**
   * ドラッグ状態
   */
  get isDragging(): boolean {
    return this._isDragging;
  }

  /**
   * ドラッグ開始位置
   */
  get dragStartPosition(): Position {
    return this._dragStartPosition;
  }

  /**
   * ホバー中の要素
   */
  get hoveredElement(): any {
    return this._hoveredElement;
  }

  /**
   * 入力有効状態
   */
  get isEnabled(): boolean {
    return this._isEnabled;
  }

  /**
   * 入力を有効化
   */
  enable(): void {
    this._isEnabled = true;
  }

  /**
   * 入力を無効化
   */
  disable(): void {
    this._isEnabled = false;
  }

  /**
   * マウス移動を処理
   */
  handleMouseMove(event: MouseEvent): void {
    if (!this._isEnabled) return;

    const worldPosition = this._getPositionFromEvent(event);
    this._mousePosition = worldPosition;

    if (this.onMouseMove) {
      this.onMouseMove(worldPosition);
    }
  }

  /**
   * マウス押下を処理
   */
  handleMouseDown(event: MouseEvent): void {
    if (!this._isEnabled) return;

    const worldPosition = this._getPositionFromEvent(event);

    if (this.onMouseDown) {
      this.onMouseDown(worldPosition, event.button);
    }
  }

  /**
   * マウス離上を処理
   */
  handleMouseUp(event: MouseEvent): void {
    if (!this._isEnabled) return;

    const worldPosition = this._getPositionFromEvent(event);

    if (this.onMouseUp) {
      this.onMouseUp(worldPosition, event.button);
    }
  }

  /**
   * ドラッグ開始を処理
   */
  handleDragStart(position: Position): void {
    if (!this._isEnabled) return;

    this._isDragging = true;
    this._dragStartPosition = position;

    if (this.onDragStart) {
      this.onDragStart(position);
    }
  }

  /**
   * ドラッグ終了を処理
   */
  handleDragEnd(position: Position): void {
    if (!this._isEnabled || !this._isDragging) return;

    this._isDragging = false;

    if (this.onDragEnd) {
      this.onDragEnd(this._dragStartPosition, position);
    }
  }

  /**
   * キーボード押下を処理
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this._isEnabled) return;

    if (this.onKeyDown) {
      this.onKeyDown(event.key, event.code);
    }
  }

  /**
   * キーボード離上を処理
   */
  handleKeyUp(event: KeyboardEvent): void {
    if (!this._isEnabled) return;

    if (this.onKeyUp) {
      this.onKeyUp(event.key, event.code);
    }
  }

  /**
   * スクリーン座標をワールド座標に変換
   */
  getWorldPosition(screenPosition: Position): Position {
    const rect = this.canvas.getBoundingClientRect();
    return new Position(screenPosition.x - rect.left, screenPosition.y - rect.top);
  }

  /**
   * ホバー中の要素を設定
   */
  setHoveredElement(element: any): void {
    this._hoveredElement = element;
  }

  /**
   * ホバー中の要素をクリア
   */
  clearHoveredElement(): void {
    this._hoveredElement = null;
  }

  /**
   * イベントリスナーを設定
   */
  private _setupEventListeners(): void {
    // マウスイベント
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    // キーボードイベント（グローバル）
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", (e) => this.handleKeyDown(e));
      document.addEventListener("keyup", (e) => this.handleKeyUp(e));
    }

    // コンテキストメニューを無効化
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /**
   * マウスイベントから位置を取得
   */
  private _getPositionFromEvent(event: MouseEvent): Position {
    const screenPosition = new Position(event.clientX, event.clientY);
    return this.getWorldPosition(screenPosition);
  }
}
