import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GameRenderer } from "../../src/domain/entities/game-renderer";
import { UIManager } from "../../src/domain/entities/ui-manager";
import { EffectManager } from "../../src/domain/entities/effect-manager";
import { AudioManager } from "../../src/domain/entities/audio-manager";
import { InputHandler } from "../../src/domain/entities/input-handler";
import { UIEventBus } from "../../src/infrastructure/events/ui-event-bus";
import { UIEventFactory } from "../../src/domain/events/ui-events";
import { PlayAudioUseCase } from "../../src/application/use-cases/play-audio-use-case";
import { RenderingService } from "../../src/domain/services/rendering-service";
import { AnimationService } from "../../src/domain/services/animation-service";
import { CollisionDetectionService } from "../../src/domain/services/collision-detection-service";
import { Position } from "../../src/domain/value-objects/position";
import { Rectangle } from "../../src/domain/value-objects/rectangle";

// Web Audio API のモック
const mockAudioContext = {
  state: 'suspended' as AudioContextState,
  currentTime: 0,
  destination: {},
  resume: mock(() => {
    mockAudioContext.state = 'running';
    return Promise.resolve();
  }),
  createBufferSource: mock(() => ({
    buffer: null,
    loop: false,
    connect: mock(() => {}),
    disconnect: mock(() => {}),
    start: mock(() => {}),
    stop: mock(() => {}),
    onended: null,
  })),
  createGain: mock(() => ({
    gain: {
      value: 1,
      setValueAtTime: mock(() => {}),
      linearRampToValueAtTime: mock(() => {}),
    },
    connect: mock(() => {}),
    disconnect: mock(() => {}),
  })),
  decodeAudioData: mock(() => Promise.resolve({})),
};

(global as any).AudioContext = mock(() => mockAudioContext);
(global as any).fetch = mock(() => Promise.resolve({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
}));

describe("UI・フィードバックシステム統合テスト", () => {
  let uiManager: UIManager;
  let effectManager: EffectManager;
  let audioManager: AudioManager;
  let eventBus: UIEventBus;
  let playAudioUseCase: PlayAudioUseCase;
  let renderingService: RenderingService;
  let animationService: AnimationService;
  let collisionService: CollisionDetectionService;

  const createMockCanvas = (): HTMLCanvasElement => ({
    width: 800,
    height: 600,
    getContext: mock(() => ({
      fillStyle: "",
      strokeStyle: "",
      font: "",
      textAlign: "start",
      textBaseline: "alphabetic",
      fillRect: mock(() => {}),
      strokeRect: mock(() => {}),
      fillText: mock(() => {}),
      strokeText: mock(() => {}),
      save: mock(() => {}),
      restore: mock(() => {}),
      measureText: mock(() => ({ width: 100 })),
      canvas: { width: 800, height: 600 },
    })),
  } as any);

  beforeEach(() => {
    // サービス層の初期化
    renderingService = new RenderingService();
    animationService = new AnimationService();
    collisionService = new CollisionDetectionService();

    // エンティティ層の初期化
    uiManager = new UIManager(renderingService, animationService, collisionService);
    effectManager = new EffectManager(renderingService, animationService);
    audioManager = new AudioManager();

    // インフラストラクチャ層の初期化
    eventBus = new UIEventBus();

    // アプリケーション層の初期化
    playAudioUseCase = new PlayAudioUseCase(audioManager);

    // モックをリセット
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();
  });

  describe("システム初期化", () => {
    it("should initialize all components successfully", async () => {
      const canvas = createMockCanvas();
      
      // GameRendererを初期化
      gameRenderer = new GameRenderer(canvas);
      
      // 各コンポーネントの初期化
      uiManager.initialize(new Rectangle(0, 0, 800, 600));
      await playAudioUseCase.playGameStart();

      // 初期化状態の確認
      expect(gameRenderer.isInitialized).toBe(true);
      expect(uiManager.isInitialized).toBe(true);
      expect(audioManager.isInitialized).toBe(true);
    });

    it("should handle UI resize", () => {
      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      const newBounds = new Rectangle(0, 0, 1024, 768);
      uiManager.resize(newBounds);

      expect(uiManager.bounds.width).toBe(1024);
      expect(uiManager.bounds.height).toBe(768);
    });
  });

  describe("イベント連携", () => {
    it("should handle card selection event flow", () => {
      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      // イベントハンドラーを設定
      const cardSelectedHandler = mock(() => {});
      eventBus.on('card-selected', cardSelectedHandler);

      // カード選択イベントを発行
      const event = UIEventFactory.createCardSelected(0, 'archer-card', 'hand-ui');
      eventBus.emit(event);

      expect(cardSelectedHandler).toHaveBeenCalledWith(event);
    });

    it("should handle tower placement event flow", () => {
      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      // イベントハンドラーを設定
      const towerPlacedHandler = mock((event: any) => {
        // タワー設置時にエフェクトと音響を再生
        effectManager.createExplosion(event.position);
        playAudioUseCase.playTowerPlaced();
      });

      eventBus.on('tower-placed', towerPlacedHandler);

      // タワー設置イベントを発行
      const position = new Position(200, 300);
      const event = UIEventFactory.createTowerPlaced('tower-1', position, 'archer-card');
      eventBus.emit(event);

      expect(towerPlacedHandler).toHaveBeenCalledWith(event);
      expect(effectManager.activeEffectCount).toBe(1);
    });

    it("should handle enemy hit event with effects", () => {
      // 敵ヒットイベントハンドラー
      const enemyHitHandler = mock((event: any) => {
        // ダメージ数値エフェクトを作成
        effectManager.createDamageNumber(event.position, event.damage, event.isCritical);
        
        // ヒットエフェクトを作成
        effectManager.createHitEffect(event.position);
        
        // 音響を再生
        playAudioUseCase.playEnemyHit();
      });

      eventBus.on('enemy-hit', enemyHitHandler);

      // 敵ヒットイベントを発行
      const position = new Position(150, 250);
      const event = UIEventFactory.createEnemyHit('enemy-1', 25, position, false);
      eventBus.emit(event);

      expect(enemyHitHandler).toHaveBeenCalledWith(event);
      expect(effectManager.activeEffectCount).toBe(2); // ダメージ数値 + ヒットエフェクト
    });
  });

  describe("レンダリング統合", () => {
    it("should render UI components", () => {
      const canvas = createMockCanvas();
      const context = canvas.getContext('2d')!;
      
      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      // UIコンポーネントにテストデータを設定
      uiManager.updateGameState({
        timer: 180,
        score: 1500,
        health: 80,
        mana: 5,
        maxMana: 10,
      });

      uiManager.updateHandCards([
        { id: 'archer-card', name: 'Archer', cost: 3, description: 'Basic archer tower' },
        { id: 'mage-card', name: 'Mage', cost: 5, description: 'Magic tower' },
      ]);

      // エフェクトを追加
      effectManager.createExplosion(new Position(300, 200));
      effectManager.createDamageNumber(new Position(250, 150), 35, false);

      // レンダリング実行
      const deltaTime = 16.67;
      uiManager.render(context, deltaTime);
      effectManager.render(context, deltaTime);

      // レンダリングサービスが呼ばれたことを確認
      expect(context.fillRect).toHaveBeenCalled();
    });

    it("should update animations smoothly", () => {
      // エフェクトを作成
      const explosion = effectManager.createExplosion(new Position(100, 100));
      const damageNumber = effectManager.createDamageNumber(new Position(200, 200), 50, true);

      expect(explosion.isActive).toBe(true);
      expect(damageNumber.isActive).toBe(true);

      // アニメーション更新
      const deltaTime = 16.67;
      effectManager.update(deltaTime);

      // エフェクトがまだアクティブであることを確認
      expect(effectManager.activeEffectCount).toBeGreaterThan(0);
    });
  });

  describe("入力処理統合", () => {
    it("should handle UI interactions", () => {
      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      // UIコンポーネントにカードを設定
      uiManager.updateHandCards([
        { id: 'archer-card', name: 'Archer', cost: 3, description: 'Basic archer tower' },
      ]);

      // カード位置での当たり判定をテスト
      const cardPosition = new Position(100, 550); // 手札エリア内
      const hitCard = uiManager.getCardAtPosition(cardPosition);

      expect(hitCard).toBeDefined();
    });

    it("should handle tower placement validation", () => {
      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      // タワー設置可能位置をテスト
      const validPosition = new Position(300, 300); // ゲームフィールド内
      const isValid = uiManager.isValidTowerPosition(validPosition);

      expect(isValid).toBe(true);

      // 無効な位置をテスト
      const invalidPosition = new Position(100, 550); // 手札エリア
      const isInvalid = uiManager.isValidTowerPosition(invalidPosition);

      expect(isInvalid).toBe(false);
    });
  });

  describe("音響システム統合", () => {
    it("should play audio in response to game events", async () => {
      await playAudioUseCase.playGameStart();

      // ゲーム開始音響が再生されることを確認
      expect(audioManager.initialize).toHaveBeenCalled();

      // バトル開始
      playAudioUseCase.playBattleStart();

      // カード使用
      playAudioUseCase.playCardUsed();

      // タワー設置
      playAudioUseCase.playTowerPlaced();

      // 各音響が適切に呼ばれることを確認（実際の音響再生はモック）
      expect(audioManager.isInitialized).toBe(true);
    });

    it("should handle volume controls", () => {
      // ボリューム変更イベント
      const volumeHandler = mock((event: any) => {
        switch (event.volumeType) {
          case 'master':
            playAudioUseCase.setMasterVolume(event.newVolume);
            break;
          case 'bgm':
            playAudioUseCase.setBgmVolume(event.newVolume);
            break;
          case 'sfx':
            playAudioUseCase.setSfxVolume(event.newVolume);
            break;
        }
      });

      eventBus.on('volume-change', volumeHandler);

      // ボリューム変更イベントを発行
      const event = UIEventFactory.createVolumeChange('bgm', 0.5);
      eventBus.emit(event);

      expect(volumeHandler).toHaveBeenCalledWith(event);
      expect(audioManager.bgmVolume).toBe(0.5);
    });
  });

  describe("パフォーマンス", () => {
    it("should handle multiple effects efficiently", () => {
      // 複数のエフェクトを作成
      for (let i = 0; i < 10; i++) {
        effectManager.createExplosion(new Position(i * 50, i * 50));
        effectManager.createDamageNumber(new Position(i * 60, i * 60), 25 + i, i % 3 === 0);
      }

      expect(effectManager.activeEffectCount).toBe(20);

      // レンダリングが正常に実行されることを確認
      const canvas = createMockCanvas();
      const context = canvas.getContext('2d')!;
      const startTime = performance.now();
      
      effectManager.render(context, 16.67);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // レンダリング時間が合理的な範囲内であることを確認
      expect(renderTime).toBeLessThan(100); // 100ms以下
    });

    it("should cleanup inactive effects", () => {
      // 短時間で終了するエフェクトを作成
      const shortEffect = effectManager.createCustomParticleEffect(
        new Position(100, 100),
        1, // 1ms で終了
        {
          particleCount: 1,
          minVelocity: 10,
          maxVelocity: 20,
          minSize: 1,
          maxSize: 2,
          minLife: 0.001,
          maxLife: 0.001,
          colors: [{ r: 255, g: 0, b: 0, a: 1 }],
        }
      );

      expect(effectManager.activeEffectCount).toBe(1);

      // 十分な時間経過後にクリーンアップされることを確認
      setTimeout(() => {
        effectManager.update(1000);
        expect(effectManager.activeEffectCount).toBe(0);
      }, 10);
    });
  });

  describe("エラーハンドリング", () => {
    it("should handle rendering errors gracefully", () => {
      const canvas = createMockCanvas();
      const context = canvas.getContext('2d')!;
      
      // エラーを投げるモック関数を設定
      context.fillRect = mock(() => {
        throw new Error('Rendering error');
      });

      uiManager.initialize(new Rectangle(0, 0, 800, 600));

      // エラーが投げられても他の処理が続行されることを確認
      expect(() => {
        uiManager.render(context, 16.67);
      }).not.toThrow();
    });

    it("should handle audio initialization failure", async () => {
      // AudioContextが利用できない環境をシミュレート
      (global as any).AudioContext = undefined;
      
      const failingAudioManager = new AudioManager();
      const failingPlayAudioUseCase = new PlayAudioUseCase(failingAudioManager);

      // 初期化が失敗してもアプリケーションが続行されることを確認
      await expect(failingPlayAudioUseCase.playGameStart()).rejects.toThrow();
      
      // 元に戻す
      (global as any).AudioContext = mock(() => mockAudioContext);
    });
  });
});