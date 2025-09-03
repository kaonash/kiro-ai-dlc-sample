import type { CardLibrary } from "./card-library.js";
import type { CardPool } from "./card-pool.js";
import type { Card } from "./card.js";
import { Hand } from "./hand.js";
import { GameTimer, type TimeProvider, SystemTimeProvider } from "./game-timer.js";
import { BaseHealth } from "./base-health.js";
import { GameScore } from "./game-score.js";
import { ManaPool } from "./mana-pool.js";
import { ManaTransaction } from "../value-objects/mana-transaction.js";
import { GameState } from "../value-objects/game-state.js";
import { GameEndReason } from "../value-objects/game-end-reason.js";
import type { EnemyType } from "../value-objects/enemy-type.js";
import { WaveScheduler } from "./wave-scheduler.js";
import { WaveConfiguration } from "../value-objects/wave-configuration.js";
import { MovementPath } from "../value-objects/movement-path.js";
import { Position } from "../value-objects/position.js";
import type { Enemy } from "./enemy.js";
import { Tower } from "./tower.js";
import { TowerPlacementService } from "../services/tower-placement-service.js";

/**
 * ゲームセッション統計
 */
export interface SessionStats {
  cardsPlayed: number;
  cardsInHand: number;
  isActive: boolean;
  // 新しい統計情報
  currentScore: number;
  currentHealth: number;
  healthPercentage: number;
  remainingTime: number;
  gameState: string;
  enemiesDefeated: number;
}

/**
 * ゲームセッションエンティティ（集約ルート）
 * カード管理とゲームセッション管理の中心的な集約
 */
export class GameSession {
  private readonly _id: string;
  private readonly _hand: Hand;
  private readonly _cardPool: CardPool;
  private readonly _cardLibrary: CardLibrary;
  private _isActive = false;
  private _cardsPlayed = 0;

  // 新しいゲームセッション管理機能
  private readonly _timer: GameTimer;
  private readonly _baseHealth: BaseHealth;
  private readonly _score: GameScore;
  private readonly _manaPool: ManaPool;
  private _state: GameState;
  private _startedAt: Date | null = null;
  private _endedAt: Date | null = null;

  // 敵生成システム
  private readonly _waveScheduler: WaveScheduler;
  private readonly _movementPath: MovementPath;

  // タワー管理システム
  private readonly _towers: Tower[] = [];
  private readonly _towerPlacementService: TowerPlacementService;

  // マナ回復システム
  private _lastManaRegenTime = 0;
  private readonly _manaRegenInterval = 1000; // 1秒 = 1000ms
  private readonly _manaRegenAmount = 1; // 1秒毎に1マナ回復

  constructor(
    id: string, 
    cardPool: CardPool, 
    cardLibrary: CardLibrary,
    gameDuration = 180,
    maxHealth = 100,
    timeProvider: TimeProvider = new SystemTimeProvider()
  ) {
    if (!id.trim()) {
      throw new Error("ゲームセッションIDは空であってはいけません");
    }

    this._id = id;
    this._hand = new Hand();
    this._cardPool = cardPool;
    this._cardLibrary = cardLibrary;

    // 新しいコンポーネントの初期化
    this._timer = new GameTimer(gameDuration, timeProvider);
    this._baseHealth = new BaseHealth(maxHealth);
    this._score = new GameScore();
    this._manaPool = new ManaPool(id, 10, 100); // 初期マナ10、最大マナ100
    this._state = GameState.notStarted();

    // 敵生成システムの初期化
    const waveConfig = WaveConfiguration.createDefault();
    this._waveScheduler = new WaveScheduler(waveConfig, new Date());
    
    // デフォルトの移動パスを作成（画面左から右へ）
    this._movementPath = new MovementPath([
      new Position(0, 300),     // 左端（スタート地点）
      new Position(200, 300),   // 中間点1
      new Position(400, 200),   // 中間点2（少し上に）
      new Position(600, 300),   // 中間点3
      new Position(800, 300)    // 右端（ゴール地点）
    ]);

    // タワー配置サービスの初期化
    this._towerPlacementService = new TowerPlacementService();
  }

  /**
   * ゲームを開始し、手札にカードを配布
   */
  startGame(): void {
    if (this._isActive || !this._state.isNotStarted()) {
      throw new Error("ゲームは既にアクティブです");
    }

    if (this._cardPool.size < Hand.maxSize) {
      throw new Error("カードプールに十分なカードがありません");
    }

    // 手札をクリアして新しいカードを配布
    this._hand.clear();
    const selectedCards = this._cardPool.selectRandomCards(Hand.maxSize);
    for (const card of selectedCards) {
      this._hand.addCard(card);
    }

    // ゲームセッション管理の開始
    this._timer.start();
    this._baseHealth.reset();
    this._score.reset();
    this._state = GameState.running();
    this._startedAt = new Date();
    this._endedAt = null;

    // マナ回復タイマーをリセット
    this._lastManaRegenTime = 0;

    // 敵生成システムの開始
    this._waveScheduler.startWaveScheduling();
    
    // 最初の波を即座に開始（テスト用）
    this._waveScheduler.startNextWave(this._movementPath);

    this._isActive = true;
    this._cardsPlayed = 0;
  }

  /**
   * カードをプレイ
   */
  playCard(cardId: string): Card {
    if (!this._isActive) {
      throw new Error("ゲームがアクティブではありません");
    }

    if (!this._hand.hasCard(cardId)) {
      throw new Error("指定されたカードが手札にありません");
    }

    const card = this._hand.removeCard(cardId);
    this._cardLibrary.discoverCard(card);
    this._cardsPlayed++;

    return card;
  }

  /**
   * カードを使ってタワーを配置
   */
  playCardAndPlaceTower(cardId: string, position: Position): { success: boolean; tower?: Tower; error?: string } {
    if (!this._isActive) {
      return { success: false, error: "ゲームがアクティブではありません" };
    }

    if (!this._hand.hasCard(cardId)) {
      return { success: false, error: "指定されたカードが手札にありません" };
    }

    // マナコストをチェック
    const card = this._hand.getCard(cardId);
    if (!card) {
      return { success: false, error: "カードが見つかりません" };
    }

    if (this._manaPool.getCurrentMana() < card.cost.value) {
      return { success: false, error: "マナが不足しています" };
    }

    // タワー配置を試行
    const placementResult = this._towerPlacementService.placeTower(card, position, this._towers);
    
    if (!placementResult.success) {
      return placementResult;
    }

    // 成功した場合、カードを消費してタワーを追加
    this._hand.removeCard(cardId);
    this._manaPool.consumeMana(card.cost.value);
    this._cardLibrary.discoverCard(card);
    this._cardsPlayed++;

    if (placementResult.tower) {
      this._towers.push(placementResult.tower);
    }

    return placementResult;
  }

  /**
   * ゲームを終了
   */
  endGame(reason: GameEndReason = GameEndReason.userQuit()): void {
    if (!this._isActive) {
      throw new Error("ゲームがアクティブではありません");
    }

    // 手札の残りのカードをすべてライブラリに記録
    const remainingCards = this._hand.getCards();
    for (const card of remainingCards) {
      this._cardLibrary.discoverCard(card);
    }

    // ゲームセッション管理の終了
    this._timer.stop();
    this._endedAt = new Date();
    
    if (reason.isTimeUp()) {
      this._state = GameState.completed();
    } else if (reason.isPlayerDeath()) {
      this._state = GameState.gameOver();
    } else {
      this._state = GameState.gameOver(); // UserQuitもGameOverとして扱う
    }

    this._hand.clear();
    this._isActive = false;
  }

  /**
   * 新しいゲームを開始
   */
  startNewGame(): void {
    if (this._isActive) {
      this.endGame();
    }
    this.startGame();
  }

  /**
   * ゲームセッションの統計を取得
   */
  getSessionStats(): SessionStats {
    return {
      cardsPlayed: this._cardsPlayed,
      cardsInHand: this._hand.size,
      isActive: this._isActive,
      currentScore: this._score.getTotalScore(),
      currentHealth: this._baseHealth.currentHealth.value,
      healthPercentage: this._baseHealth.getHealthPercentage(),
      remainingTime: this._timer.getRemainingSeconds(),
      gameState: this._state.toString(),
      enemiesDefeated: this._score.getEnemyDefeatedCount(),
    };
  }

  /**
   * セッションID
   */
  get id(): string {
    return this._id;
  }

  /**
   * 手札
   */
  get hand(): Hand {
    return this._hand;
  }

  /**
   * 手札のカードを取得
   */
  getHand(): Card[] {
    return this._hand.getCards();
  }

  /**
   * ゲームがアクティブかどうか
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * プレイしたカード数
   */
  get cardsPlayed(): number {
    return this._cardsPlayed;
  }

  // 新しいゲームセッション管理メソッド

  /**
   * ゲームを一時停止する
   */
  pause(): void {
    if (!this._state.isRunning()) {
      throw new Error("実行中のゲームのみ一時停止できます");
    }

    this._timer.pause();
    this._state = GameState.paused();
    // 一時停止時はマナ回復タイマーもリセット
    this._lastManaRegenTime = 0;
  }

  /**
   * ゲームを再開する
   */
  resume(): void {
    if (!this._state.isPaused()) {
      throw new Error("一時停止中のゲームのみ再開できます");
    }

    this._timer.resume();
    this._state = GameState.running();
    // 再開時はマナ回復タイマーをリセット
    this._lastManaRegenTime = 0;
  }

  /**
   * 敵撃破を処理する
   */
  handleEnemyDefeated(enemyType: EnemyType): void {
    if (!this._state.isActive()) {
      return; // アクティブでない場合は何もしない
    }

    this._score.addScore(enemyType);
  }

  /**
   * 基地ダメージを処理する
   */
  handleBaseDamaged(damage: number): void {
    if (!this._state.isActive()) {
      return; // アクティブでない場合は何もしない
    }

    this._baseHealth.takeDamage(damage);
  }

  /**
   * ゲーム終了判定を行う
   */
  isGameOver(): boolean {
    if (!this._state.isActive()) {
      return false;
    }

    return this._timer.isTimeUp() || this._baseHealth.isDestroyed();
  }

  /**
   * ゲーム終了理由を取得する
   */
  getEndReason(): GameEndReason | null {
    if (!this.isGameOver()) {
      return null;
    }

    // 時間切れを優先
    if (this._timer.isTimeUp()) {
      return GameEndReason.timeUp();
    }

    if (this._baseHealth.isDestroyed()) {
      return GameEndReason.playerDeath();
    }

    return null;
  }

  // ゲッター

  /**
   * ゲーム状態
   */
  get state(): GameState {
    return this._state;
  }

  /**
   * ゲームタイマー
   */
  get timer(): GameTimer {
    return this._timer;
  }

  /**
   * 基地体力
   */
  get baseHealth(): BaseHealth {
    return this._baseHealth;
  }

  /**
   * ゲームスコア
   */
  get score(): GameScore {
    return this._score;
  }

  /**
   * ゲーム開始時刻
   */
  get startedAt(): Date | null {
    return this._startedAt;
  }

  /**
   * ゲーム終了時刻
   */
  get endedAt(): Date | null {
    return this._endedAt;
  }

  /**
   * マナプール
   */
  get manaPool(): ManaPool {
    return this._manaPool;
  }

  /**
   * ゲーム状態を更新
   */
  update(deltaTime: number): { gameEnded: boolean } {
    if (!this._state.isActive()) {
      return { gameEnded: false };
    }

    // タイマー更新
    this._timer.update(deltaTime);

    // マナ回復処理
    this._updateManaRegeneration(deltaTime);

    // 敵生成システム更新
    this._waveScheduler.update(new Date(), this._movementPath);

    // 敵の移動更新
    const activeEnemies = this._waveScheduler.getAllActiveEnemies();
    for (const enemy of activeEnemies) {
      enemy.update(deltaTime);
    }

    // タワーの攻撃処理
    const currentTimeMs = Date.now();
    for (const tower of this._towers) {
      const attackResult = tower.update(activeEnemies, currentTimeMs);
      if (attackResult.attacked && attackResult.target) {
        // 敵撃破チェック
        if (!attackResult.target.isAlive) {
          this.handleEnemyDefeated(attackResult.target.type);
        }
      }
    }

    // 基地攻撃処理
    const baseDamage = this._waveScheduler.processBaseAttacks();
    if (baseDamage > 0) {
      this.handleBaseDamaged(baseDamage);
    }

    // ゲーム終了チェック
    if (this.isGameOver()) {
      const endReason = this.getEndReason();
      if (endReason) {
        this.endGame(endReason);
        return { gameEnded: true };
      }
    }

    return { gameEnded: false };
  }

  /**
   * ゲームの一時停止/再開を切り替え
   */
  togglePause(): void {
    if (this._state.isRunning()) {
      this.pause();
    } else if (this._state.isPaused()) {
      this.resume();
    }
  }

  /**
   * 現在アクティブな敵を取得
   */
  getActiveEnemies(): Enemy[] {
    return this._waveScheduler.getAllActiveEnemies();
  }

  /**
   * 波スケジューラーを取得
   */
  get waveScheduler(): WaveScheduler {
    return this._waveScheduler;
  }

  /**
   * 移動パスを取得
   */
  get movementPath(): MovementPath {
    return this._movementPath;
  }

  /**
   * 配置されたタワーを取得
   */
  getTowers(): Tower[] {
    return [...this._towers];
  }

  /**
   * タワー配置サービスを取得
   */
  get towerPlacementService(): TowerPlacementService {
    return this._towerPlacementService;
  }

  /**
   * マナ回復処理
   */
  private _updateManaRegeneration(deltaTime: number): void {
    // ゲームが実行中でない場合は回復しない
    if (!this._state.isRunning()) {
      return;
    }

    this._lastManaRegenTime += deltaTime;

    // 1秒経過毎にマナを回復
    if (this._lastManaRegenTime >= this._manaRegenInterval) {
      const regenCount = Math.floor(this._lastManaRegenTime / this._manaRegenInterval);
      this._lastManaRegenTime = this._lastManaRegenTime % this._manaRegenInterval;

      // マナが最大値未満の場合のみ回復
      if (!this._manaPool.isAtMaxCapacity()) {
        const manaTransaction = new ManaTransaction(
          this._manaRegenAmount * regenCount,
          "generation",
          Date.now()
        );
        this._manaPool.generateMana(manaTransaction);
      }
    }
  }
}