import { describe, it, expect, beforeEach } from "bun:test";
import { WaveScheduler } from "../../src/domain/entities/wave-scheduler";
import { WaveConfiguration } from "../../src/domain/value-objects/wave-configuration";
import { Position } from "../../src/domain/value-objects/position";
import { MovementPath } from "../../src/domain/value-objects/movement-path";
import { EnemySpawningService } from "../../src/domain/services/enemy-spawning-service";
import { EnemyMovementService } from "../../src/domain/services/enemy-movement-service";
import { BaseAttackService } from "../../src/domain/services/base-attack-service";
import { EnemyDamageService } from "../../src/domain/services/enemy-damage-service";
import { StartWaveUseCase } from "../../src/application/use-cases/start-wave-use-case";
import { UpdateEnemiesUseCase } from "../../src/application/use-cases/update-enemies-use-case";
import { ProcessEnemyDamageUseCase } from "../../src/application/use-cases/process-enemy-damage-use-case";
import { JsonEnemyConfigRepository } from "../../src/infrastructure/repositories/json-enemy-config-repository";
import { JsonPathConfigRepository } from "../../src/infrastructure/repositories/json-path-config-repository";

describe("Enemy Challenge System Integration", () => {
  let waveScheduler: WaveScheduler;
  let movementPath: MovementPath;
  let enemySpawningService: EnemySpawningService;
  let enemyMovementService: EnemyMovementService;
  let baseAttackService: BaseAttackService;
  let enemyDamageService: EnemyDamageService;
  let startWaveUseCase: StartWaveUseCase;
  let updateEnemiesUseCase: UpdateEnemiesUseCase;
  let processEnemyDamageUseCase: ProcessEnemyDamageUseCase;
  let enemyConfigRepository: JsonEnemyConfigRepository;
  let pathConfigRepository: JsonPathConfigRepository;

  // モックサービス
  let mockGameSessionService: any;
  let mockUIFeedbackService: any;
  let mockTowerCombatService: any;

  beforeEach(async () => {
    // リポジトリの初期化
    enemyConfigRepository = new JsonEnemyConfigRepository();
    pathConfigRepository = new JsonPathConfigRepository();

    // 移動パスの設定
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300),
    ];
    movementPath = new MovementPath(pathPoints);

    // 波設定とスケジューラーの初期化
    const waveConfiguration = new WaveConfiguration(5, 3, 500); // 小さい値でテスト高速化
    const gameStartTime = new Date();
    waveScheduler = new WaveScheduler(waveConfiguration, gameStartTime);

    // ドメインサービスの初期化
    enemySpawningService = new EnemySpawningService();
    enemyMovementService = new EnemyMovementService();
    baseAttackService = new BaseAttackService();
    enemyDamageService = new EnemyDamageService();

    // モックサービスの設定
    let playerHealth = 1000;
    mockGameSessionService = {
      isGameActive: () => true,
      getGameTime: () => Date.now(),
      getPlayerHealth: () => playerHealth,
      reducePlayerHealth: (damage: number) => {
        playerHealth -= damage;
      },
    };

    mockUIFeedbackService = {
      showWaveStartNotification: (waveNumber: number) => {},
      displayEnemy: (enemy: any) => {},
      updateEnemyPosition: (enemyId: string, position: Position) => {},
      updateEnemyHealth: (enemyId: string, healthPercentage: number) => {},
      removeEnemyDisplay: (enemyId: string) => {},
    };

    mockTowerCombatService = {
      getEnemiesInRange: (position: Position, range: number) => [],
      notifyEnemyDestroyed: (enemyId: string) => {},
      getTargetableEnemies: () => [],
    };

    // ユースケースの初期化
    startWaveUseCase = new StartWaveUseCase(mockGameSessionService, mockUIFeedbackService);
    updateEnemiesUseCase = new UpdateEnemiesUseCase(
      enemyMovementService,
      baseAttackService,
      mockGameSessionService,
      mockUIFeedbackService
    );
    processEnemyDamageUseCase = new ProcessEnemyDamageUseCase(
      enemyDamageService,
      mockTowerCombatService,
      mockUIFeedbackService
    );
  });

  describe("Complete Wave Lifecycle", () => {
    it("should handle complete wave lifecycle from start to completion", async () => {
      // 1. 波スケジューラーを開始
      waveScheduler.startWaveScheduling();
      expect(waveScheduler.isActive).toBe(true);

      // 時間を進めて波を開始可能にする
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));

      // 2. 最初の波を開始
      const startResult = await startWaveUseCase.execute(waveScheduler, movementPath);
      expect(startResult.success).toBe(true);
      expect(startResult.waveNumber).toBe(1);
      expect(waveScheduler.currentWave).not.toBeNull();

      // 3. 敵を生成して移動させる
      const wave = waveScheduler.currentWave!;
      let totalEnemiesSpawned = 0;

      // 複数回の更新サイクルをシミュレート
      for (let cycle = 0; cycle < 10; cycle++) {
        const updateResult = await updateEnemiesUseCase.execute(waveScheduler, 100, movementPath);
        expect(updateResult.success).toBe(true);
        totalEnemiesSpawned += updateResult.newEnemiesSpawned;

        // 敵が生成されていることを確認
        if (totalEnemiesSpawned > 0) {
          const activeEnemies = waveScheduler.getAllActiveEnemies();
          expect(activeEnemies.length).toBeGreaterThan(0);
          break;
        }
      }

      expect(totalEnemiesSpawned).toBeGreaterThan(0);
    });

    it("should handle enemy damage and destruction correctly", async () => {
      // 波を開始して敵を生成
      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      // 敵を生成
      const wave = waveScheduler.currentWave!;
      const enemy = wave.spawnNextEnemy(movementPath);
      expect(enemy).not.toBeNull();

      // 敵にダメージを与える
      const damageResult = await processEnemyDamageUseCase.execute(enemy!.id, 50, waveScheduler);
      expect(damageResult.success).toBe(true);
      expect(damageResult.damageApplied).toBe(50);
      expect(damageResult.enemyDestroyed).toBe(false);
      expect(enemy!.currentHealth).toBe(50); // 100 - 50

      // 敵を撃破
      const killResult = await processEnemyDamageUseCase.execute(enemy!.id, 50, waveScheduler);
      expect(killResult.success).toBe(true);
      expect(killResult.enemyDestroyed).toBe(true);
      expect(enemy!.isAlive).toBe(false);
    });

    it("should handle base attacks and player health reduction", async () => {
      const initialPlayerHealth = mockGameSessionService.getPlayerHealth();

      // 波を開始
      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      // 敵を生成して基地まで移動させる
      const wave = waveScheduler.currentWave!;
      const enemy = wave.spawnNextEnemy(movementPath);
      expect(enemy).not.toBeNull();

      // 敵を基地まで移動
      enemy!.move(100000); // 十分な時間で基地到達
      expect(enemy!.isAtBase()).toBe(true);

      // 更新処理で基地攻撃を処理
      const updateResult = await updateEnemiesUseCase.execute(waveScheduler, 100, movementPath);
      expect(updateResult.success).toBe(true);
      expect(updateResult.baseDamage).toBeGreaterThan(0);

      // プレイヤーの体力が減少していることを確認
      const currentPlayerHealth = mockGameSessionService.getPlayerHealth();
      expect(currentPlayerHealth).toBeLessThan(initialPlayerHealth);
    });

    it("should handle area damage correctly", async () => {
      // 波を開始して複数の敵を生成
      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      const wave = waveScheduler.currentWave!;
      const enemy1 = wave.spawnNextEnemy(movementPath);
      const enemy2 = wave.spawnNextEnemy(movementPath);

      expect(enemy1).not.toBeNull();
      expect(enemy2).not.toBeNull();

      // 範囲ダメージを適用
      const centerPosition = new Position(0, 100); // 生成地点
      const areaResult = await processEnemyDamageUseCase.executeAreaDamage(
        centerPosition,
        200, // 範囲
        60, // ダメージ
        waveScheduler
      );

      expect(areaResult.success).toBe(true);
      expect(areaResult.affectedEnemies).toBeGreaterThan(0);
      expect(areaResult.totalDamageDealt).toBeGreaterThan(0);
    });
  });

  describe("Configuration Integration", () => {
    it("should load enemy configurations correctly", async () => {
      const allConfigs = await enemyConfigRepository.getAllEnemyTypeConfigs();

      expect(allConfigs.size).toBe(5);
      expect(
        allConfigs.has(require("../../src/domain/value-objects/enemy-type").EnemyType.BASIC)
      ).toBe(true);
      expect(
        allConfigs.has(require("../../src/domain/value-objects/enemy-type").EnemyType.BOSS)
      ).toBe(true);
    });

    it("should load path configurations correctly", async () => {
      const allPaths = await pathConfigRepository.getAllPaths();

      expect(allPaths.length).toBe(3);

      for (const path of allPaths) {
        expect(path.pathPoints.length).toBeGreaterThanOrEqual(2);
        expect(path.totalLength).toBeGreaterThan(0);
      }
    });

    it("should validate wave configuration", async () => {
      const waveConfig = await enemyConfigRepository.getWaveConfiguration();

      expect(waveConfig.baseEnemyCount).toBeGreaterThan(0);
      expect(waveConfig.enemyCountIncrement).toBeGreaterThanOrEqual(0);
      expect(waveConfig.spawnInterval).toBeGreaterThan(0);
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle multiple waves efficiently", async () => {
      waveScheduler.startWaveScheduling();

      // 複数の波を順次開始
      for (let waveNum = 1; waveNum <= 3; waveNum++) {
        const startTime = Date.now();

        waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
        const result = await startWaveUseCase.execute(waveScheduler, movementPath);
        if (result.success) {
          const endTime = Date.now();
          const executionTime = endTime - startTime;

          // 波開始は100ms以内で完了すべき
          expect(executionTime).toBeLessThan(100);

          // 現在の波を強制完了して次の波に進む
          waveScheduler.forceCompleteCurrentWave();
        }
      }
    });

    it("should handle many enemies without performance degradation", async () => {
      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      const wave = waveScheduler.currentWave!;

      // 多数の敵を生成
      const enemies = [];
      for (let i = 0; i < 20; i++) {
        const enemy = wave.spawnNextEnemy(movementPath);
        if (enemy) enemies.push(enemy);
      }

      // 更新処理のパフォーマンステスト
      const startTime = Date.now();
      const result = await updateEnemiesUseCase.execute(waveScheduler, 16, movementPath); // 60FPS相当
      const endTime = Date.now();

      expect(result.success).toBe(true);

      // 更新処理は16ms以内で完了すべき（60FPS維持）
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(50); // 余裕を持って50ms
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle UI service failures gracefully", async () => {
      // UIサービスを故障させる
      mockUIFeedbackService.updateEnemyPosition = () => {
        throw new Error("UI Service Error");
      };

      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      // エラーが発生してもシステムは動作し続ける
      const result = await updateEnemiesUseCase.execute(waveScheduler, 100, movementPath);
      expect(result.success).toBe(true);
    });

    it("should handle invalid enemy IDs in damage processing", async () => {
      const result = await processEnemyDamageUseCase.execute("invalid-id", 50, waveScheduler);

      expect(result.success).toBe(false);
      expect(result.error).toContain("敵が見つかりません");
    });

    it("should recover from game session interruption", async () => {
      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      // ゲームセッションを無効化
      mockGameSessionService.isGameActive = () => false;

      const result = await updateEnemiesUseCase.execute(waveScheduler, 100, movementPath);
      expect(result.success).toBe(false);
      expect(result.error).toContain("ゲームがアクティブではありません");

      // ゲームセッションを復旧
      mockGameSessionService.isGameActive = () => true;

      const recoveryResult = await updateEnemiesUseCase.execute(waveScheduler, 100, movementPath);
      expect(recoveryResult.success).toBe(true);
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should track comprehensive statistics", async () => {
      waveScheduler.startWaveScheduling();
      waveScheduler.setNextWaveTime(new Date(Date.now() - 1000));
      await startWaveUseCase.execute(waveScheduler, movementPath);

      // 複数の操作を実行
      const wave = waveScheduler.currentWave!;
      const enemy = wave.spawnNextEnemy(movementPath);

      await updateEnemiesUseCase.execute(waveScheduler, 100, movementPath);
      await processEnemyDamageUseCase.execute(enemy!.id, 30, waveScheduler);

      // 統計情報を取得
      const updateStats = await updateEnemiesUseCase.getUpdateStatistics();
      const damageStats = await processEnemyDamageUseCase.getDamageStatistics();

      expect(updateStats.totalUpdates).toBeGreaterThan(0);
      expect(damageStats.totalDamageDealt).toBeGreaterThan(0);
    });
  });
});
