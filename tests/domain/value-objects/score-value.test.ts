import { describe, it, expect } from "bun:test";
import { ScoreValue } from "../../../src/domain/value-objects/score-value.js";

describe("ScoreValue", () => {
  describe("作成", () => {
    it("有効なスコア値で作成できる", () => {
      const score = new ScoreValue(100);
      expect(score.value).toBe(100);
    });

    it("0で作成できる", () => {
      const score = new ScoreValue(0);
      expect(score.value).toBe(0);
    });

    it("負の値では作成できない", () => {
      expect(() => new ScoreValue(-1)).toThrow("スコア値は0以上である必要があります");
    });

    it("小数点を含む値は整数に丸められる", () => {
      const score = new ScoreValue(100.7);
      expect(score.value).toBe(100);
    });

    it("非常に大きな値でも作成できる", () => {
      const score = new ScoreValue(999999);
      expect(score.value).toBe(999999);
    });
  });

  describe("スコア加算", () => {
    it("正の値を加算できる", () => {
      const score = new ScoreValue(100);
      const newScore = score.add(50);
      
      expect(newScore.value).toBe(150);
      expect(score.value).toBe(100); // 元のオブジェクトは変更されない
    });

    it("0を加算しても値は変わらない", () => {
      const score = new ScoreValue(100);
      const newScore = score.add(0);
      
      expect(newScore.value).toBe(100);
    });

    it("負の値を加算しようとするとエラー", () => {
      const score = new ScoreValue(100);
      expect(() => score.add(-10)).toThrow("加算するポイントは0以上である必要があります");
    });

    it("複数回加算できる", () => {
      const score = new ScoreValue(0);
      const score1 = score.add(10);
      const score2 = score1.add(20);
      const score3 = score2.add(30);
      
      expect(score3.value).toBe(60);
    });
  });

  describe("文字列表現", () => {
    it("数値を文字列として表現する", () => {
      const score = new ScoreValue(1234);
      expect(score.toString()).toBe("1234");
    });

    it("0を文字列として表現する", () => {
      const score = new ScoreValue(0);
      expect(score.toString()).toBe("0");
    });

    it("大きな数値を文字列として表現する", () => {
      const score = new ScoreValue(999999);
      expect(score.toString()).toBe("999999");
    });
  });

  describe("フォーマット済み文字列表現", () => {
    it("3桁区切りでフォーマットできる", () => {
      const score = new ScoreValue(1234567);
      expect(score.toFormattedString()).toBe("1,234,567");
    });

    it("1000未満はそのまま表示", () => {
      const score = new ScoreValue(999);
      expect(score.toFormattedString()).toBe("999");
    });

    it("0はそのまま表示", () => {
      const score = new ScoreValue(0);
      expect(score.toFormattedString()).toBe("0");
    });

    it("1000ちょうどは区切り文字付きで表示", () => {
      const score = new ScoreValue(1000);
      expect(score.toFormattedString()).toBe("1,000");
    });
  });

  describe("比較", () => {
    it("等価性の判定", () => {
      const score1 = new ScoreValue(100);
      const score2 = new ScoreValue(100);
      const score3 = new ScoreValue(200);
      
      expect(score1.equals(score2)).toBe(true);
      expect(score1.equals(score3)).toBe(false);
    });

    it("大小比較", () => {
      const score1 = new ScoreValue(100);
      const score2 = new ScoreValue(200);
      const score3 = new ScoreValue(100);
      
      expect(score1.isGreaterThan(score2)).toBe(false);
      expect(score2.isGreaterThan(score1)).toBe(true);
      expect(score1.isGreaterThan(score3)).toBe(false);
    });

    it("以上の比較", () => {
      const score1 = new ScoreValue(100);
      const score2 = new ScoreValue(200);
      const score3 = new ScoreValue(100);
      
      expect(score1.isGreaterThanOrEqual(score2)).toBe(false);
      expect(score2.isGreaterThanOrEqual(score1)).toBe(true);
      expect(score1.isGreaterThanOrEqual(score3)).toBe(true);
    });
  });

  describe("スコアランク判定", () => {
    it("低スコア（0-999）の判定", () => {
      const lowScore = new ScoreValue(500);
      expect(lowScore.getRank()).toBe("Bronze");
    });

    it("中スコア（1000-4999）の判定", () => {
      const midScore = new ScoreValue(2500);
      expect(midScore.getRank()).toBe("Silver");
    });

    it("高スコア（5000-9999）の判定", () => {
      const highScore = new ScoreValue(7500);
      expect(highScore.getRank()).toBe("Gold");
    });

    it("最高スコア（10000以上）の判定", () => {
      const topScore = new ScoreValue(15000);
      expect(topScore.getRank()).toBe("Platinum");
    });

    it("境界値のテスト", () => {
      expect(new ScoreValue(999).getRank()).toBe("Bronze");
      expect(new ScoreValue(1000).getRank()).toBe("Silver");
      expect(new ScoreValue(4999).getRank()).toBe("Silver");
      expect(new ScoreValue(5000).getRank()).toBe("Gold");
      expect(new ScoreValue(9999).getRank()).toBe("Gold");
      expect(new ScoreValue(10000).getRank()).toBe("Platinum");
    });
  });

  describe("パーセンテージ計算", () => {
    it("目標スコアに対する達成率を計算できる", () => {
      const score = new ScoreValue(750);
      expect(score.getPercentageOf(1000)).toBe(75);
    });

    it("目標スコアを超えた場合は100%以上になる", () => {
      const score = new ScoreValue(1200);
      expect(score.getPercentageOf(1000)).toBe(120);
    });

    it("目標スコアが0の場合は0%を返す", () => {
      const score = new ScoreValue(100);
      expect(score.getPercentageOf(0)).toBe(0);
    });

    it("現在スコアが0の場合は0%を返す", () => {
      const score = new ScoreValue(0);
      expect(score.getPercentageOf(1000)).toBe(0);
    });
  });
});