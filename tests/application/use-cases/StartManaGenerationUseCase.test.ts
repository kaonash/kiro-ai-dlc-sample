import { describe, it, expect, beforeEach } from "bun:test";
import { StartManaGenerationUseCase } from "../../../src/application/use-cases/start-mana-generation-use-case";
import { ManaPool } from "../../../src/domain/entities/mana-pool";

// モックのゲームセッション管理インターフェース
interface MockGameSessionManager {
  getElapsedGameTime(): number;
  isPaused(): boolean;
}

describe("StartManaGenerationUseCase", () => {
  let useCase: StartManaGenerationUseCase;
  let manaPool: ManaPool;
  let mockGameSession: MockGameSessionManager;

  beforeEach(() => {
    manaPool = new ManaPool("test-pool", 10, 99);
    mockGameSession = {
      getElapsedGameTime: () => 5000, // 5秒経過
      isPaused: () => false
    };
    useCase = new StartManaGenerationUseCase();
  });

  describe("魔力生成開始", () => {
    it("正常に魔力生成を開始できる", async () => {
      const result = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(5); // 5秒経過で5ポイント生成
      expect(result.newLastGenerationTime).toBe(5000);
      expect(manaPool.getCurrentMana()).toBe(15);
    });

    it("1秒未満の場合は生成しない", async () => {
      mockGameSession.getElapsedGameTime = () => 500; // 0.5秒経過

      const result = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(0);
      expect(result.newLastGenerationTime).toBe(0);
      expect(manaPool.getCurrentMana()).toBe(10); // 変更なし
    });

    it("ゲームが一時停止中は生成しない", async () => {
      mockGameSession.isPaused = () => true;

      const result = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(0);
      expect(result.newLastGenerationTime).toBe(0);
      expect(manaPool.getCurrentMana()).toBe(10);
    });

    it("上限を超える生成は上限でキャップされる", async () => {
      // 魔力を95まで増やす
      const { ManaTransaction } = await import("../../../src/domain/value-objects/ManaTransaction");
      const transaction = new ManaTransaction(85, "generation", 1000);
      manaPool.generateMana(transaction);

      mockGameSession.getElapsedGameTime = () => 10000; // 10秒経過

      const result = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(true);
      expect(result.generatedAmount).toBe(4); // 実際に生成された量
      expect(manaPool.getCurrentMana()).toBe(99);
    });

    it("時間が逆行している場合はエラー", async () => {
      const result = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 10000 // 現在時刻より未来
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("時間が逆行");
    });
  });

  describe("一時停止バグ防止テスト", () => {
    it("一時停止直後の再開で不正な生成が発生しない", async () => {
      // 魔力生成直後のシミュレーション
      let currentTime = 1000;
      mockGameSession.getElapsedGameTime = () => currentTime;

      // 最初の生成
      const firstResult = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      expect(firstResult.generatedAmount).toBe(1);
      expect(manaPool.getCurrentMana()).toBe(11);

      // 一時停止（実時間で0.9秒経過、ゲーム時間で0.1秒経過）
      currentTime = 1100;
      const secondResult = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: firstResult.newLastGenerationTime
      });

      expect(secondResult.generatedAmount).toBe(0); // 生成されない
      expect(manaPool.getCurrentMana()).toBe(11); // 変更なし
    });

    it("長時間一時停止後の正常な生成", async () => {
      let currentTime = 1000;
      mockGameSession.getElapsedGameTime = () => currentTime;

      // 最初の生成
      const firstResult = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      // 長時間経過（ゲーム時間で3秒）
      currentTime = 4000;
      const secondResult = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: firstResult.newLastGenerationTime
      });

      expect(secondResult.generatedAmount).toBe(3); // 3秒分生成
      expect(manaPool.getCurrentMana()).toBe(14); // 10 + 1 + 3
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な魔力プールでエラー", async () => {
      const result = await useCase.execute({
        manaPool: null as any,
        gameSessionManager: mockGameSession,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("魔力プールが無効");
    });

    it("無効なゲームセッションマネージャーでエラー", async () => {
      const result = await useCase.execute({
        manaPool,
        gameSessionManager: null as any,
        lastGenerationTime: 0
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("ゲームセッションマネージャーが無効");
    });

    it("負の最終生成時間でエラー", async () => {
      const result = await useCase.execute({
        manaPool,
        gameSessionManager: mockGameSession,
        lastGenerationTime: -1000
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("最終生成時間は0以上");
    });
  });
});