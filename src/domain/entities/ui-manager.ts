import { Position } from "../value-objects/position";

/**
 * ゲーム状態インターフェース
 */
export interface GameState {
  timeRemaining: number;
  score: number;
  health: number;
  maxHealth: number;
}

/**
 * 手札状態インターフェース
 */
export interface HandState {
  cards: Card[];
  currentMana: number;
  maxMana: number;
}

/**
 * カードインターフェース
 */
export interface Card {
  id: string;
  name: string;
  cost: number;
}

/**
 * 敵インターフェース
 */
export interface Enemy {
  id: string;
  position: Position;
  health: number;
}

/**
 * タワーインターフェース
 */
export interface Tower {
  id: string;
  position: Position;
  type: string;
}

/**
 * ヘッダーUIインターフェース
 */
export interface HeaderUI {
  updateTimer(timeRemaining: number): void;
  updateScore(score: number): void;
  updateHealth(current: number, max: number): void;
  render(context: CanvasRenderingContext2D, deltaTime: number): void;
}

/**
 * 手札UIインターフェース
 */
export interface HandUI {
  updateHand(cards: Card[]): void;
  updateMana(current: number, max: number): void;
  selectCard(index: number): void;
  render(context: CanvasRenderingContext2D, deltaTime: number): void;
}

/**
 * 戦場UIインターフェース
 */
export interface GameFieldUI {
  updateEnemies(enemies: Enemy[]): void;
  updateTowers(towers: Tower[]): void;
  render(context: CanvasRenderingContext2D, deltaTime: number): void;
}

/**
 * ツールチップUIインターフェース
 */
export interface TooltipUI {
  show(content: string, position: Position): void;
  hide(): void;
  render(context: CanvasRenderingContext2D, deltaTime: number): void;
}

/**
 * UI要素の管理と状態更新を行うエンティティ
 */
export class UIManager {
  public readonly headerUI: HeaderUI;
  public readonly handUI: HandUI;
  public readonly gameFieldUI: GameFieldUI;
  public readonly tooltipUI: TooltipUI;

  constructor(
    headerUI: HeaderUI,
    handUI: HandUI,
    gameFieldUI: GameFieldUI,
    tooltipUI: TooltipUI
  ) {
    this.headerUI = headerUI;
    this.handUI = handUI;
    this.gameFieldUI = gameFieldUI;
    this.tooltipUI = tooltipUI;
  }

  /**
   * ゲーム状態を更新
   */
  updateGameState(state: GameState): void {
    this.headerUI.updateTimer(state.timeRemaining);
    this.headerUI.updateScore(state.score);
    this.headerUI.updateHealth(state.health, state.maxHealth);
  }

  /**
   * 手札状態を更新
   */
  updateHandState(handState: HandState): void {
    this.handUI.updateHand(handState.cards);
    this.handUI.updateMana(handState.currentMana, handState.maxMana);
  }

  /**
   * ツールチップを表示
   */
  showTooltip(content: string, position: Position): void {
    this.tooltipUI.show(content, position);
  }

  /**
   * ツールチップを非表示
   */
  hideTooltip(): void {
    this.tooltipUI.hide();
  }

  /**
   * 敵情報を更新
   */
  updateEnemies(enemies: Enemy[]): void {
    this.gameFieldUI.updateEnemies(enemies);
  }

  /**
   * タワー情報を更新
   */
  updateTowers(towers: Tower[]): void {
    this.gameFieldUI.updateTowers(towers);
  }

  /**
   * 移動パス情報を更新
   */
  updateMovementPath(pathPoints: Position[]): void {
    this.gameFieldUI.updateMovementPath(pathPoints);
  }

  /**
   * 全UIコンポーネントを描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    this.headerUI.render(context, deltaTime);
    this.handUI.render(context, deltaTime);
    this.gameFieldUI.render(context, deltaTime);
    this.tooltipUI.render(context, deltaTime);
  }
}