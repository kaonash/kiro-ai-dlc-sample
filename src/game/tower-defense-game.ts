import { GameRenderer } from "../domain/entities/game-renderer";
import { UIManager } from "../domain/entities/ui-manager";
import { EffectManager } from "../domain/entities/effect-manager";
import { AudioManager } from "../domain/entities/audio-manager";
import { InputHandler } from "../domain/entities/input-handler";
import { UIEventBus } from "../infrastructure/events/ui-event-bus";
import { UIEventFactory } from "../domain/events/ui-events";
import { PlayAudioUseCase } from "../application/use-cases/play-audio-use-case";
import { StartGameUseCase } from "../application/use-cases/start-game-use-case";
import { PlayCardUseCase } from "../application/use-cases/play-card-use-case";
import { RenderingService } from "../domain/services/rendering-service";
import { AnimationService } from "../domain/services/animation-service";
import { CollisionDetectionService } from "../domain/services/collision-detection-service";
import { Rectangle } from "../domain/value-objects/rectangle";
import { Position } from "../domain/value-objects/position";
import { GameSession } from "../domain/entities/game-session";
import { JsonCardPoolRepository } from "../infrastructure/repositories/json-card-pool-repository";
import { LocalStorageCardLibraryRepository } from "../infrastructure/repositories/local-storage-card-library-repository";
import { HeaderUI } from "../infrastructure/ui/header-ui";
import { HandUI } from "../infrastructure/ui/hand-ui";
import { GameFieldUI } from "../infrastructure/ui/game-field-ui";
import { TooltipUI } from "../infrastructure/ui/tooltip-ui";

/**
 * タワーディフェンスゲームのメインアプリケーション
 * 全システムを統合してゲームを実行
 */
export class TowerDefenseGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  
  // コアシステム
  private gameRenderer: GameRenderer;
  private uiManager: UIManager;
  private effectManager: EffectManager;
  private audioManager: AudioManager;
  private inputHandler: InputHandler;
  private eventBus: UIEventBus;
  
  // サービス
  private renderingService: RenderingService;
  private animationService: AnimationService;
  private collisionService: CollisionDetectionService;
  
  // ユースケース
  private playAudioUseCase: PlayAudioUseCase;
  private startGameUseCase: StartGameUseCase;
  private playCardUseCase: PlayCardUseCase;
  
  // ゲーム状態
  private gameSession: GameSession | null = null;
  private isRunning = false;
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;

  constructor(canvasId: string) {
    // Canvas初期化
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.context = context;

    // サービス初期化
    this.renderingService = new RenderingService();
    this.animationService = new AnimationService();
    this.collisionService = new CollisionDetectionService();

    // UI コンポーネント初期化
    const canvasBounds = new Rectangle(0, 0, this.canvas.width, this.canvas.height);
    const headerBounds = new Rectangle(0, 0, this.canvas.width, 60);
    const handBounds = new Rectangle(0, this.canvas.height - 120, this.canvas.width, 120);
    const gameFieldBounds = new Rectangle(0, 60, this.canvas.width, this.canvas.height - 180);
    
    const headerUI = new HeaderUI(headerBounds, this.renderingService);
    const handUI = new HandUI(handBounds, this.renderingService);
    const gameFieldUI = new GameFieldUI(gameFieldBounds, this.renderingService);
    const tooltipUI = new TooltipUI(this.renderingService, this.animationService);

    // システム初期化
    this.gameRenderer = new GameRenderer(this.canvas);
    this.uiManager = new UIManager(headerUI, handUI, gameFieldUI, tooltipUI);
    this.effectManager = new EffectManager(this.renderingService, this.animationService);
    this.audioManager = new AudioManager();
    this.inputHandler = new InputHandler(this.canvas);
    this.eventBus = new UIEventBus();

    // ユースケース初期化
    this.playAudioUseCase = new PlayAudioUseCase(this.audioManager);
    
    const cardPoolRepo = new JsonCardPoolRepository();
    const cardLibraryRepo = new LocalStorageCardLibraryRepository();
    this.startGameUseCase = new StartGameUseCase(cardPoolRepo, cardLibraryRepo);
    this.playCardUseCase = new PlayCardUseCase(cardLibraryRepo);

    this.setupEventHandlers();
  }

  /**
   * ゲームを初期化
   */
  async initialize(): Promise<void> {
    try {
      // 音響システム初期化
      await this.playAudioUseCase.playGameStart();

      console.log('🎮 Tower Defense Game initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      throw error;
    }
  }

  /**
   * 新しいゲームを開始
   */
  async startNewGame(): Promise<void> {
    try {
      const result = await this.startGameUseCase.execute(`game-${Date.now()}`);

      if (result.success && result.gameSession) {
        this.gameSession = result.gameSession;
        
        // UI更新
        this.uiManager.updateGameState({
          timeRemaining: this.gameSession.timer.getRemainingSeconds(),
          score: this.gameSession.score.getTotalScore(),
          health: this.gameSession.baseHealth.currentHealth.value,
          maxHealth: this.gameSession.baseHealth.maxHealth,
        });

        // 手札の取得と表示
        const hand = this.gameSession.getHand();
        this.uiManager.updateHandState({
          cards: hand.map(card => ({
            id: card.id,
            name: card.name,
            cost: card.cost.value,
          })),
          currentMana: this.gameSession.manaPool.getCurrentMana(),
          maxMana: this.gameSession.manaPool.getMaxMana(),
        });

        // ゲームループ開始
        this.start();
        
        console.log('🚀 New game started!');
      } else {
        throw new Error(result.error || 'Failed to start game');
      }
    } catch (error) {
      console.error('❌ Failed to start new game:', error);
      throw error;
    }
  }

  /**
   * ゲームループを開始
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    console.log('▶️ Game loop started');
  }

  /**
   * ゲームループを停止
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('⏹️ Game loop stopped');
  }

  /**
   * ゲームループ
   */
  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // 更新
    this.update(deltaTime);
    
    // 描画
    this.render(deltaTime);

    // 次のフレーム
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * ゲーム状態更新
   */
  private update(deltaTime: number): void {
    if (!this.gameSession) return;

    // ゲームセッション更新
    const updateResult = this.gameSession.update(deltaTime);
    
    // UI状態更新
    this.uiManager.updateGameState({
      timeRemaining: this.gameSession.timer.getRemainingSeconds(),
      score: this.gameSession.score.getTotalScore(),
      health: this.gameSession.baseHealth.currentHealth.value,
      maxHealth: this.gameSession.baseHealth.maxHealth,
    });

    // エフェクト更新
    this.effectManager.update(deltaTime);

    // ゲーム終了チェック
    if (updateResult.gameEnded) {
      this.handleGameEnd();
    }
  }

  /**
   * 描画
   */
  private render(deltaTime: number): void {
    // 画面クリア
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 背景描画
    this.renderBackground();

    // UI描画
    this.uiManager.render(this.context, deltaTime);

    // エフェクト描画
    this.effectManager.render(this.context, deltaTime);

    // FPS表示（デバッグ用）
    this.renderDebugInfo(deltaTime);
  }

  /**
   * 背景描画
   */
  private renderBackground(): void {
    // グラデーション背景
    const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * デバッグ情報描画
   */
  private renderDebugInfo(deltaTime: number): void {
    const fps = Math.round(1000 / deltaTime);
    
    this.context.fillStyle = '#ffffff';
    this.context.font = '12px Arial';
    this.context.fillText(`FPS: ${fps}`, 10, 20);
    this.context.fillText(`Effects: ${this.effectManager.activeEffectCount}`, 10, 35);
  }

  /**
   * イベントハンドラー設定
   */
  private setupEventHandlers(): void {
    // カード選択イベント
    this.eventBus.on('card-selected', (event) => {
      if (event.type === 'card-selected') {
        console.log(`Card selected: ${event.cardId}`);
        this.playAudioUseCase.playUISound('card-select');
      }
    });

    // カード使用イベント
    this.eventBus.on('card-played', async (event) => {
      if (!this.gameSession || event.type !== 'card-played') return;

      try {
        const result = await this.playCardUseCase.execute(this.gameSession, event.cardId);

        if (result.success) {
          // エフェクト生成
          this.effectManager.createExplosion(event.position);
          this.effectManager.createDamageNumber(event.position, 25, false);
          
          // 音響再生
          this.playAudioUseCase.playCardUsed();
          this.playAudioUseCase.playTowerPlaced();
          
          console.log(`Card played: ${event.cardId} at (${event.position.x}, ${event.position.y})`);
        }
      } catch (error) {
        console.error('Failed to play card:', error);
      }
    });

    // 敵ヒットイベント
    this.eventBus.on('enemy-hit', (event) => {
      if (event.type === 'enemy-hit') {
        this.effectManager.createDamageNumber(event.position, event.damage, event.isCritical);
        this.effectManager.createHitEffect(event.position);
        this.playAudioUseCase.playEnemyHit();
      }
    });

    // 敵撃破イベント
    this.eventBus.on('enemy-destroyed', (event) => {
      if (event.type === 'enemy-destroyed') {
        this.effectManager.createExplosion(event.position);
        this.playAudioUseCase.playEnemyDestroyed();
      }
    });

    // ツールチップイベント
    this.eventBus.on('tooltip-show', (event) => {
      if (event.type === 'tooltip-show') {
        this.uiManager.showTooltip(event.content, event.position);
      }
    });

    this.eventBus.on('tooltip-hide', () => {
      this.uiManager.hideTooltip();
    });

    // 入力イベント
    this.inputHandler.onMouseUp = (position: Position, button: number) => {
      if (button !== 0) return; // 左クリックのみ
      
      // カード選択チェック（簡略化）
      const cardIndex = 0; // 仮の実装
      const cardEvent = UIEventFactory.createCardSelected(cardIndex, `card-${cardIndex}`);
      this.eventBus.emit(cardEvent);

      // ゲームフィールドクリック（簡略化）
      const playEvent = UIEventFactory.createCardPlayed('selected-card', position, 3);
      this.eventBus.emit(playEvent);
    };

    // キーボードイベント
    this.inputHandler.onKeyDown = (key: string, code: string) => {
      switch (key) {
        case ' ': // スペースキー
          if (this.gameSession) {
            this.gameSession.togglePause();
          }
          break;
        case 'Escape':
          this.stop();
          break;
      }
    };
  }

  /**
   * ゲーム終了処理
   */
  private handleGameEnd(): void {
    this.stop();
    
    if (this.gameSession?.state.isCompleted()) {
      this.playAudioUseCase.playVictory();
      console.log('🎉 Game completed!');
    } else {
      this.playAudioUseCase.playGameOver();
      console.log('💀 Game over!');
    }
  }

  /**
   * リソースクリーンアップ
   */
  dispose(): void {
    this.stop();
    this.eventBus.removeAllListeners();
    this.effectManager.clearAllEffects();
    console.log('🧹 Game resources cleaned up');
  }
}