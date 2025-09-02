import { describe, it, expect } from "bun:test";
import { ScoreCalculationService } from "../../../src/domain/services/score-calculation-service.js";
import { EnemyType } from "../../../src/domain/value-objects/enemy-type.js";

describe("ScoreCalculationService", () => {
  let service: ScoreCalculationService;

  beforeEach(() => {
    service = new ScoreCalculationService();
  });

  describe("基本スコア計算", () => {
    it("通常敵のスコアを計算する", () => {
      const score = service.calculateScore(EnemyType.normal());
      expect(score).toBe(10);
    });

    it("強化敵のスコアを計算する", () => {
      const score = service.calculateScore(EnemyType.elite());
      expect(score).toBe(30);
    });

    it("ボス敵のスコアを計算する", () => {
      const score = service.calculateScore(EnemyType.boss());
      expect(score).toBe(100);
    });
  });

  describe("スコア倍率の取得", () => {
    it("通常敵の倍率を取得する", () => {
      const multiplier = service.getScoreMultiplier(EnemyType.normal());
      expect(multiplier).toBe(1.0);
    });

    it("強化敵の倍率を取得する", () => {
      const multiplier = service.getScoreMultiplier(EnemyType.elite());
      expect(multiplier).toBe(3.0);
    });

    it("ボス敵の倍率を取得する", () => {
      const multiplier = service.getScoreMultiplier(EnemyType.boss());
      expect(multiplier).toBe(10.0);
    });
  });

  describe("カスタム設定でのスコア計算", () => {
    it("カスタム基本スコアでサービスを作成できる", () => {
      const customService = new ScoreCalculationService(20);
      
      expect(customService.calculateScore(EnemyType.normal())).toBe(20);
      expect(customService.calculateScore(EnemyType.elite())).toBe(60);
      expect(customService.calculateScore(EnemyType.boss())).toBe(200);
    });

    it("カスタム倍率でサービスを作成できる", () => {
      const customMultipliers = {
        normal: 1.5,
        elite: 4.0,
        boss: 15.0
      };
      const customService = new ScoreCalculationService(10, customMultipliers);
      
      expect(customService.calculateScore(EnemyType.normal())).toBe(15);
      expect(customService.calculateScore(EnemyType.elite())).toBe(40);
      expect(customService.calculateScore(EnemyType.boss())).toBe(150);
    });

    it("基本スコアとカスタム倍率の組み合わせ", () => {
      const customMultipliers = {
        normal: 2.0,
        elite: 5.0,
        boss: 20.0
      };
      const customService = new ScoreCalculationService(5, customMultipliers);
      
      expect(customService.calculateScore(EnemyType.normal())).toBe(10);
      expect(customService.calculateScore(EnemyType.elite())).toBe(25);
      expect(customService.calculateScore(EnemyType.boss())).toBe(100);
    });
  });

  describe("エラーハンドリング", () => {
    it("負の基本スコアではサービスを作成できない", () => {
      expect(() => new ScoreCalculationService(-1))
        .toThrow("基本スコアは0以上である必要があります");
    });

    it("0の基本スコアでサービスを作成できる", () => {
      const zeroService = new ScoreCalculationService(0);
      expect(zeroService.calculateScore(EnemyType.normal())).toBe(0);
      expect(zeroService.calculateScore(EnemyType.elite())).toBe(0);
      expect(zeroService.calculateScore(EnemyType.boss())).toBe(0);
    });

    it("負の倍率ではサービスを作成できない", () => {
      const invalidMultipliers = {
        normal: -1.0,
        elite: 3.0,
        boss: 10.0
      };
      
      expect(() => new ScoreCalculationService(10, invalidMultipliers))
        .toThrow("スコア倍率は0以上である必要があります");
    });

    it("0の倍率でサービスを作成できる", () => {
      const zeroMultipliers = {
        normal: 0.0,
        elite: 0.0,
        boss: 0.0
      };
      const zeroService = new ScoreCalculationService(10, zeroMultipliers);
      
      expect(zeroService.calculateScore(EnemyType.normal())).toBe(0);
      expect(zeroService.calculateScore(EnemyType.elite())).toBe(0);
      expect(zeroService.calculateScore(EnemyType.boss())).toBe(0);
    });
  });

  describe("スコア計算の一貫性", () => {
    it("同じ敵タイプは常に同じスコアを返す", () => {
      const score1 = service.calculateScore(EnemyType.normal());
      const score2 = service.calculateScore(EnemyType.normal());
      const score3 = service.calculateScore(EnemyType.normal());
      
      expect(score1).toBe(score2);
      expect(score2).toBe(score3);
    });

    it("倍率とスコアの関係が正しい", () => {
      const normalScore = service.calculateScore(EnemyType.normal());
      const eliteScore = service.calculateScore(EnemyType.elite());
      const bossScore = service.calculateScore(EnemyType.boss());
      
      const normalMultiplier = service.getScoreMultiplier(EnemyType.normal());
      const eliteMultiplier = service.getScoreMultiplier(EnemyType.elite());
      const bossMultiplier = service.getScoreMultiplier(EnemyType.boss());
      
      expect(eliteScore / normalScore).toBe(eliteMultiplier / normalMultiplier);
      expect(bossScore / normalScore).toBe(bossMultiplier / normalMultiplier);
    });
  });

  describe("バッチスコア計算", () => {
    it("複数の敵タイプのスコアを一括計算できる", () => {
      const enemyTypes = [
        EnemyType.normal(),
        EnemyType.elite(),
        EnemyType.boss(),
        EnemyType.normal(),
        EnemyType.elite()
      ];
      
      const scores = service.calculateBatchScore(enemyTypes);
      
      expect(scores).toEqual([10, 30, 100, 10, 30]);
    });

    it("空の配列でバッチ計算できる", () => {
      const scores = service.calculateBatchScore([]);
      expect(scores).toEqual([]);
    });

    it("バッチ計算の合計スコアを取得できる", () => {
      const enemyTypes = [
        EnemyType.normal(),  // 10
        EnemyType.elite(),   // 30
        EnemyType.boss(),    // 100
        EnemyType.normal()   // 10
      ];
      
      const totalScore = service.calculateTotalScore(enemyTypes);
      expect(totalScore).toBe(150);
    });
  });

  describe("スコア統計", () => {
    it("敵タイプ別の統計を計算できる", () => {
      const enemyTypes = [
        EnemyType.normal(),
        EnemyType.normal(),
        EnemyType.elite(),
        EnemyType.boss(),
        EnemyType.normal(),
        EnemyType.elite(),
        EnemyType.elite()
      ];
      
      const stats = service.calculateScoreStatistics(enemyTypes);
      
      expect(stats.normalCount).toBe(3);
      expect(stats.eliteCount).toBe(3);
      expect(stats.bossCount).toBe(1);
      expect(stats.normalScore).toBe(30);
      expect(stats.eliteScore).toBe(90);
      expect(stats.bossScore).toBe(100);
      expect(stats.totalScore).toBe(220);
    });

    it("空の配列で統計を計算できる", () => {
      const stats = service.calculateScoreStatistics([]);
      
      expect(stats.normalCount).toBe(0);
      expect(stats.eliteCount).toBe(0);
      expect(stats.bossCount).toBe(0);
      expect(stats.totalScore).toBe(0);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量のスコア計算でもパフォーマンスが維持される", () => {
      const enemyTypes = [];
      for (let i = 0; i < 10000; i++) {
        enemyTypes.push(EnemyType.normal());
      }
      
      const startTime = Date.now();
      const totalScore = service.calculateTotalScore(enemyTypes);
      const endTime = Date.now();
      
      expect(totalScore).toBe(100000);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
  });

  describe("設定の取得", () => {
    it("現在の基本スコアを取得できる", () => {
      expect(service.getBaseScore()).toBe(10);
      
      const customService = new ScoreCalculationService(25);
      expect(customService.getBaseScore()).toBe(25);
    });

    it("現在の倍率設定を取得できる", () => {
      const multipliers = service.getMultipliers();
      
      expect(multipliers.normal).toBe(1.0);
      expect(multipliers.elite).toBe(3.0);
      expect(multipliers.boss).toBe(10.0);
    });
  });
});