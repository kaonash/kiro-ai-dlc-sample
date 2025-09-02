import { describe, it, expect } from "bun:test";
import { GameScore } from "../../../src/domain/entities/game-score.js";
import { EnemyType } from "../../../src/domain/value-objects/enemy-type.js";
import { ScoreValue } from "../../../src/domain/value-objects/score-value.js";

describe("GameScore", () => {
  describe("初期化", () => {
    it("初期状態では全ての値が0", () => {
      const gameScore = new GameScore();
      
      expect(gameScore.totalScore.value).toBe(0);
      expect(gameScore.enemiesDefeated).toBe(0);
      expect(gameScore.normalEnemyCount).toBe(0);
      expect(gameScore.eliteEnemyCount).toBe(0);
      expect(gameScore.bossEnemyCount).toBe(0);
    });
  });

  describe("スコア加算", () => {
    it("通常敵撃破でスコアが加算される", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.normal());
      
      expect(gameScore.totalScore.value).toBe(10);
      expect(gameScore.normalEnemyCount).toBe(1);
      expect(gameScore.enemiesDefeated).toBe(1);
      expect(gameScore.eliteEnemyCount).toBe(0);
      expect(gameScore.bossEnemyCount).toBe(0);
    });

    it("強化敵撃破でスコアが加算される", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.elite());
      
      expect(gameScore.totalScore.value).toBe(30);
      expect(gameScore.eliteEnemyCount).toBe(1);
      expect(gameScore.enemiesDefeated).toBe(1);
      expect(gameScore.normalEnemyCount).toBe(0);
      expect(gameScore.bossEnemyCount).toBe(0);
    });

    it("ボス敵撃破でスコアが加算される", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.boss());
      
      expect(gameScore.totalScore.value).toBe(100);
      expect(gameScore.bossEnemyCount).toBe(1);
      expect(gameScore.enemiesDefeated).toBe(1);
      expect(gameScore.normalEnemyCount).toBe(0);
      expect(gameScore.eliteEnemyCount).toBe(0);
    });
  });

  describe("複数敵の撃破", () => {
    it("異なるタイプの敵を撃破してスコアが累積される", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.normal()); // +10
      gameScore.addScore(EnemyType.elite());  // +30
      gameScore.addScore(EnemyType.boss());   // +100
      
      expect(gameScore.totalScore.value).toBe(140);
      expect(gameScore.enemiesDefeated).toBe(3);
      expect(gameScore.normalEnemyCount).toBe(1);
      expect(gameScore.eliteEnemyCount).toBe(1);
      expect(gameScore.bossEnemyCount).toBe(1);
    });

    it("同じタイプの敵を複数撃破できる", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.normal());
      
      expect(gameScore.totalScore.value).toBe(30);
      expect(gameScore.enemiesDefeated).toBe(3);
      expect(gameScore.normalEnemyCount).toBe(3);
    });

    it("大量の敵を撃破してもスコアが正しく計算される", () => {
      const gameScore = new GameScore();
      
      // 通常敵10体、強化敵5体、ボス敵2体
      for (let i = 0; i < 10; i++) {
        gameScore.addScore(EnemyType.normal());
      }
      for (let i = 0; i < 5; i++) {
        gameScore.addScore(EnemyType.elite());
      }
      for (let i = 0; i < 2; i++) {
        gameScore.addScore(EnemyType.boss());
      }
      
      expect(gameScore.totalScore.value).toBe(450); // 100 + 150 + 200
      expect(gameScore.enemiesDefeated).toBe(17);
      expect(gameScore.normalEnemyCount).toBe(10);
      expect(gameScore.eliteEnemyCount).toBe(5);
      expect(gameScore.bossEnemyCount).toBe(2);
    });
  });

  describe("リセット機能", () => {
    it("スコアをリセットできる", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.elite());
      gameScore.addScore(EnemyType.boss());
      
      gameScore.reset();
      
      expect(gameScore.totalScore.value).toBe(0);
      expect(gameScore.enemiesDefeated).toBe(0);
      expect(gameScore.normalEnemyCount).toBe(0);
      expect(gameScore.eliteEnemyCount).toBe(0);
      expect(gameScore.bossEnemyCount).toBe(0);
    });

    it("リセット後に再度スコアを加算できる", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.boss());
      gameScore.reset();
      gameScore.addScore(EnemyType.normal());
      
      expect(gameScore.totalScore.value).toBe(10);
      expect(gameScore.enemiesDefeated).toBe(1);
      expect(gameScore.normalEnemyCount).toBe(1);
    });
  });

  describe("スコア取得", () => {
    it("総スコアを取得できる", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.elite());
      gameScore.addScore(EnemyType.normal());
      
      expect(gameScore.getTotalScore()).toBe(40);
    });

    it("撃破敵数を取得できる", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.elite());
      gameScore.addScore(EnemyType.boss());
      
      expect(gameScore.getEnemyDefeatedCount()).toBe(3);
    });
  });

  describe("ScoreValueオブジェクトとの連携", () => {
    it("totalScoreはScoreValueインスタンス", () => {
      const gameScore = new GameScore();
      
      expect(gameScore.totalScore).toBeInstanceOf(ScoreValue);
    });

    it("ScoreValueの機能を使用できる", () => {
      const gameScore = new GameScore();
      
      gameScore.addScore(EnemyType.boss());
      gameScore.addScore(EnemyType.elite());
      
      expect(gameScore.totalScore.toFormattedString()).toBe("130");
      expect(gameScore.totalScore.getRank()).toBe("Bronze");
    });
  });

  describe("統計情報", () => {
    it("敵タイプ別の撃破数を正しく管理する", () => {
      const gameScore = new GameScore();
      
      // 不規則な順序で敵を撃破
      gameScore.addScore(EnemyType.boss());
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.elite());
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.boss());
      gameScore.addScore(EnemyType.elite());
      gameScore.addScore(EnemyType.elite());
      
      expect(gameScore.normalEnemyCount).toBe(2);
      expect(gameScore.eliteEnemyCount).toBe(3);
      expect(gameScore.bossEnemyCount).toBe(2);
      expect(gameScore.enemiesDefeated).toBe(7);
    });

    it("各敵タイプの撃破数の合計が総撃破数と一致する", () => {
      const gameScore = new GameScore();
      
      for (let i = 0; i < 15; i++) {
        const enemyTypes = [EnemyType.normal(), EnemyType.elite(), EnemyType.boss()];
        const randomType = enemyTypes[i % 3];
        gameScore.addScore(randomType);
      }
      
      const totalByType = gameScore.normalEnemyCount + 
                         gameScore.eliteEnemyCount + 
                         gameScore.bossEnemyCount;
      
      expect(totalByType).toBe(gameScore.enemiesDefeated);
      expect(gameScore.enemiesDefeated).toBe(15);
    });
  });

  describe("スコア計算の正確性", () => {
    it("各敵タイプのスコアが正しく計算される", () => {
      const gameScore = new GameScore();
      
      // 通常敵3体 = 30点
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.normal());
      gameScore.addScore(EnemyType.normal());
      expect(gameScore.totalScore.value).toBe(30);
      
      // 強化敵2体 = 60点追加（合計90点）
      gameScore.addScore(EnemyType.elite());
      gameScore.addScore(EnemyType.elite());
      expect(gameScore.totalScore.value).toBe(90);
      
      // ボス敵1体 = 100点追加（合計190点）
      gameScore.addScore(EnemyType.boss());
      expect(gameScore.totalScore.value).toBe(190);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量のスコア加算でもパフォーマンスが維持される", () => {
      const gameScore = new GameScore();
      const startTime = Date.now();
      
      // 1000体の敵を撃破
      for (let i = 0; i < 1000; i++) {
        const enemyTypes = [EnemyType.normal(), EnemyType.elite(), EnemyType.boss()];
        gameScore.addScore(enemyTypes[i % 3]);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(gameScore.enemiesDefeated).toBe(1000);
      expect(duration).toBeLessThan(100); // 100ms以内で完了することを期待
    });
  });
});