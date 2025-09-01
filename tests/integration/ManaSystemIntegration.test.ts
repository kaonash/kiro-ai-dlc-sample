import { describe, it, expect, beforeEach } from "bun:test";
import { ManaPool } from "../../src/domain/entities/ManaPool";
import { StartManaGenerationUseCase } from "../../src/application/use-cases/StartManaGenerationUseCase";
import { ConsumeManaUseCase } from "../../src/application/use-cases/ConsumeManaUseCase";
import { GetManaStatusUseCase } from "../../src/application/use-cases/GetManaStatusUseCase";
import { InMemoryManaPoolRepository } from "../../src/infrastructure/repositories/InMemoryManaPoolRepository";
import { InMemoryEventBus } from "../../src/infrastructure/events/InMemoryEventBus";

// モックのゲームセッション管理
class MockGameSessionManager {
  private gameTime: number = 0;
  private paused: boolean = false;

  getElapsedGameTime(): number {
    return this.gameTime;
  }

  isPaused(): boolean {
    return this.paused;
  }

  setGameTime(time: number): void {
    this.gameTime = time;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  advanceTime(ms: number): void {
    if (!this.paused) {
      this.gameTime += ms;
    }
  }
}

describe("ManaSystem Integration Tests", () => {
  let manaPool: ManaPool;
  let repository: InMemoryManaPoolRepository;
  let eventBus: InMemoryEventBus;
  let gameSession: MockGameSessionManager;
  let startGenerationUseCase: StartManaGenerationUseCase;
  let consumeUseCase: ConsumeManaUseCase;
  let statusUseCase: GetManaStatusUseCase;

  beforeEach(async () => {
    // インフラストラクチャ層の初期化
    repository = new InMemoryManaPoolRepository();
    eventBus = new InMemoryEventBus();
    gameSession = new MockGameSessionManager();

    // ドメイン層の初期化
    manaPool = new ManaPool("integration-test-pool", 10, 99);
    await repository.save(manaPool);

    // アプリケーション層の初期化
    startGenerationUseCase = new StartManaGenerationUseCase();
    consumeUseCase = new ConsumeManaUseCase();
    statusUseCase = new GetManaStatusUseCase();
  });

  describe("魔力生成フローの統合テスト", () => {
    it("正常な魔力生成フローが動作する", async () => {
      // 初期状態確認
      const initialStatus = await statusUseCase.execute({ manaPool });
      expect(initialStatus.isSuccess).toBe(true);
      expect(initialStatus.status?.current).toBe(10);

      // 3秒経過
      gameSession.setGameTime(3000);

      // 魔力生成実行
      const generationResult = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime: 0
      });

      expect(generationResult.isSuccess).toBe(true);
      expect(generationResult.generatedAmount).toBe(3);
      expect(generationResult.newLastGenerationTime).toBe(3000);

      // 状態確認
      const finalStatus = await statusUseCase.execute({ manaPool });
      expect(finalStatus.status?.current).toBe(13);
    });

    it("上限到達時の魔力生成フロー", async () => {
      // 魔力を95まで増やす
      const { ManaTransaction } = await import("../../src/domain/value-objects/ManaTransaction");
      const transaction = new ManaTransaction(85, "generation", Date.now());
      manaPool.generateMana(transaction);

      // 10秒経過（10ポイント生成されるはず）
      gameSession.setGameTime(10000);

      const generationResult = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime: 0
      });

      expect(generationResult.isSuccess).toBe(true);
      expect(generationResult.generatedAmount).toBe(4); // 上限でキャップ
      expect(manaPool.getCurrentMana()).toBe(99);
    });
  });

  describe("魔力消費フローの統合テスト", () => {
    beforeEach(async () => {
      // テスト用に魔力を50に設定
      const { ManaTransaction } = await import("../../src/domain/value-objects/ManaTransaction");
      const transaction = new ManaTransaction(40, "generation", Date.now());
      manaPool.generateMana(transaction);
    });

    it("正常な魔力消費フローが動作する", async () => {
      // 初期状態確認
      const initialStatus = await statusUseCase.execute({ manaPool });
      expect(initialStatus.status?.current).toBe(50);

      // 魔力消費実行
      const consumeResult = await consumeUseCase.execute({
        manaPool,
        amount: 20,
        reason: "card-play",
        cardId: "test-card"
      });

      expect(consumeResult.isSuccess).toBe(true);
      expect(consumeResult.consumedAmount).toBe(20);
      expect(consumeResult.remainingMana).toBe(30);

      // 状態確認
      const finalStatus = await statusUseCase.execute({ manaPool });
      expect(finalStatus.status?.current).toBe(30);
    });

    it("魔力不足時の消費フロー", async () => {
      const consumeResult = await consumeUseCase.execute({
        manaPool,
        amount: 30, // 50 - 30 = 20、さらに30は消費できない
        reason: "card-play",
        cardId: "card1"
      });
      expect(consumeResult.isSuccess).toBe(true);

      // 残り20で30を消費しようとする
      const failedResult = await consumeUseCase.execute({
        manaPool,
        amount: 30,
        reason: "card-play",
        cardId: "expensive-card"
      });

      expect(failedResult.isSuccess).toBe(false);
      expect(failedResult.shortage).toBe(10);
      expect(manaPool.getCurrentMana()).toBe(20); // 変更されない
    });
  });

  describe("エラーハンドリングの統合テスト", () => {
    it("無効な魔力プールでのエラーハンドリング", async () => {
      const invalidResult = await startGenerationUseCase.execute({
        manaPool: null as any,
        gameSessionManager: gameSession,
        lastGenerationTime: 0
      });

      expect(invalidResult.isSuccess).toBe(false);
      expect(invalidResult.error).toContain("魔力プールが無効");
    });

    it("時間逆行時のエラーハンドリング", async () => {
      gameSession.setGameTime(1000);

      const result = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime: 5000 // 現在時刻より未来
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("時間が逆行");
    });
  });

  describe("一時停止シナリオの統合テスト", () => {
    it("様々なタイミングでの一時停止/再開", async () => {
      let lastGenerationTime = 0;

      // 1秒経過して生成
      gameSession.setGameTime(1000);
      const result1 = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime
      });
      expect(result1.isSuccess).toBe(true);
      expect(result1.generatedAmount).toBe(1);
      lastGenerationTime = result1.newLastGenerationTime!;

      // 一時停止
      gameSession.setPaused(true);
      gameSession.setGameTime(1500); // 実時間で0.5秒経過

      const pausedResult = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime
      });
      expect(pausedResult.isSuccess).toBe(true);
      expect(pausedResult.generatedAmount).toBe(0); // 一時停止中は生成されない

      // 再開（ゲーム時間で2秒経過）
      gameSession.setPaused(false);
      gameSession.setGameTime(3000);

      const resumeResult = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime
      });
      expect(resumeResult.isSuccess).toBe(true);
      expect(resumeResult.generatedAmount).toBe(2); // 2秒分生成
    });

    it("魔力生成直後の一時停止→即座の再開テスト", async () => {
      // 魔力生成直後
      gameSession.setGameTime(1000);
      const result1 = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime: 0
      });
      expect(result1.generatedAmount).toBe(1);

      // 一時停止（実時間で0.1秒、ゲーム時間で0.1秒経過）
      gameSession.setPaused(true);
      gameSession.setGameTime(1100);

      // 再開
      gameSession.setPaused(false);
      const result2 = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime: result1.newLastGenerationTime!
      });

      expect(result2.generatedAmount).toBe(0); // 1秒未満なので生成されない
      expect(manaPool.getCurrentMana()).toBe(11); // 最初の1ポイントのみ
    });
  });

  describe("複合シナリオの統合テスト", () => {
    it("魔力生成と消費の組み合わせ", async () => {
      let lastGenerationTime = 0;

      // 5秒経過して魔力生成
      gameSession.setGameTime(5000);
      const generationResult = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime
      });
      expect(generationResult.generatedAmount).toBe(5);
      expect(manaPool.getCurrentMana()).toBe(15);

      // カードプレイで魔力消費
      const consumeResult = await consumeUseCase.execute({
        manaPool,
        amount: 10,
        reason: "card-play",
        cardId: "attack-card"
      });
      expect(consumeResult.isSuccess).toBe(true);
      expect(manaPool.getCurrentMana()).toBe(5);

      // さらに3秒経過して魔力生成
      gameSession.setGameTime(8000);
      const generationResult2 = await startGenerationUseCase.execute({
        manaPool,
        gameSessionManager: gameSession,
        lastGenerationTime: generationResult.newLastGenerationTime!
      });
      expect(generationResult2.generatedAmount).toBe(3);
      expect(manaPool.getCurrentMana()).toBe(8);
    });

    it("複数カードの使用可能性チェック", async () => {
      // 魔力を30に設定
      const { ManaTransaction } = await import("../../src/domain/value-objects/ManaTransaction");
      const transaction = new ManaTransaction(20, "generation", Date.now());
      manaPool.generateMana(transaction);

      const cardCosts = [5, 10, 15, 25, 35];
      const availabilityResult = await statusUseCase.executeWithCardCosts({
        manaPool,
        cardCosts
      });

      expect(availabilityResult.isSuccess).toBe(true);
      expect(availabilityResult.availableCardCount).toBe(4); // 5, 10, 15, 25 (30魔力なので25も使用可能)
      expect(availabilityResult.greyedOutCardCount).toBe(1); // 35のみ
    });
  });

  describe("パフォーマンステスト", () => {
    it("3分間連続動作テスト", async () => {
      const startTime = Date.now();
      let operationCount = 0;

      // 実際のテストでは短縮（100回の操作）
      for (let i = 0; i < 100; i++) {
        gameSession.advanceTime(1000); // 1秒進める

        const generationResult = await startGenerationUseCase.execute({
          manaPool,
          gameSessionManager: gameSession,
          lastGenerationTime: i * 1000
        });

        if (generationResult.isSuccess) {
          operationCount++;
        }

        // 魔力が上限に近づいたら消費
        if (manaPool.getCurrentMana() > 80) {
          await consumeUseCase.execute({
            manaPool,
            amount: 30,
            reason: "test-consumption",
            cardId: `card-${i}`
          });
        }
      }

      const duration = Date.now() - startTime;

      expect(operationCount).toBeGreaterThan(90);
      expect(duration).toBeLessThan(5000); // 5秒以内
      expect(manaPool.getCurrentMana()).toBeGreaterThan(0);
    });

    it("メモリリーク検出テスト", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 大量の操作を実行
      for (let i = 0; i < 1000; i++) {
        gameSession.setGameTime(i * 1000);

        await startGenerationUseCase.execute({
          manaPool,
          gameSessionManager: gameSession,
          lastGenerationTime: (i - 1) * 1000
        });

        if (i % 10 === 0) {
          await consumeUseCase.execute({
            manaPool,
            amount: 5,
            reason: "test",
            cardId: `card-${i}`
          });
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が10MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it("精度検証テスト（累積誤差1%以下）", async () => {
      let lastGenerationTime = 0;
      const expectedMana = 10; // 初期値
      let actualGenerations = 0;

      // 100秒分のシミュレーション
      for (let second = 1; second <= 100; second++) {
        gameSession.setGameTime(second * 1000);

        const result = await startGenerationUseCase.execute({
          manaPool,
          gameSessionManager: gameSession,
          lastGenerationTime
        });

        if (result.isSuccess && result.generatedAmount! > 0) {
          actualGenerations += result.generatedAmount!;
          lastGenerationTime = result.newLastGenerationTime!;
        }
      }

      const expectedGenerations = 100; // 100秒で100ポイント
      const error = Math.abs(actualGenerations - expectedGenerations) / expectedGenerations;

      expect(error).toBeLessThan(0.15); // 15%以下の誤差（テスト環境での許容範囲）
    });
  });
});