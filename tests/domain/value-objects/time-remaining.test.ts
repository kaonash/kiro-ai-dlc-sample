import { describe, it, expect } from "bun:test";
import { TimeRemaining } from "../../../src/domain/value-objects/time-remaining.js";

describe("TimeRemaining", () => {
  describe("作成", () => {
    it("有効な秒数で作成できる", () => {
      const time = new TimeRemaining(180);
      expect(time.seconds).toBe(180);
    });

    it("0秒で作成できる", () => {
      const time = new TimeRemaining(0);
      expect(time.seconds).toBe(0);
    });

    it("負の秒数では作成できない", () => {
      expect(() => new TimeRemaining(-1)).toThrow("残り時間は0以上である必要があります");
    });

    it("小数点を含む秒数は整数に丸められる", () => {
      const time = new TimeRemaining(180.7);
      expect(time.seconds).toBe(180);
    });
  });

  describe("文字列表現", () => {
    it("3分0秒を正しく表示する", () => {
      const time = new TimeRemaining(180);
      expect(time.toString()).toBe("03:00");
    });

    it("2分30秒を正しく表示する", () => {
      const time = new TimeRemaining(150);
      expect(time.toString()).toBe("02:30");
    });

    it("1分5秒を正しく表示する", () => {
      const time = new TimeRemaining(65);
      expect(time.toString()).toBe("01:05");
    });

    it("30秒を正しく表示する", () => {
      const time = new TimeRemaining(30);
      expect(time.toString()).toBe("00:30");
    });

    it("0秒を正しく表示する", () => {
      const time = new TimeRemaining(0);
      expect(time.toString()).toBe("00:00");
    });

    it("10分以上でも正しく表示する", () => {
      const time = new TimeRemaining(665); // 11分5秒
      expect(time.toString()).toBe("11:05");
    });
  });

  describe("進捗率計算", () => {
    it("開始時（180秒）の進捗率は0%", () => {
      const time = new TimeRemaining(180);
      expect(time.toProgressPercentage(180)).toBe(0);
    });

    it("半分経過時（90秒）の進捗率は50%", () => {
      const time = new TimeRemaining(90);
      expect(time.toProgressPercentage(180)).toBe(50);
    });

    it("終了時（0秒）の進捗率は100%", () => {
      const time = new TimeRemaining(0);
      expect(time.toProgressPercentage(180)).toBe(100);
    });

    it("1/4経過時（135秒）の進捗率は25%", () => {
      const time = new TimeRemaining(135);
      expect(time.toProgressPercentage(180)).toBe(25);
    });

    it("3/4経過時（45秒）の進捗率は75%", () => {
      const time = new TimeRemaining(45);
      expect(time.toProgressPercentage(180)).toBe(75);
    });

    it("総時間が0の場合は100%を返す", () => {
      const time = new TimeRemaining(0);
      expect(time.toProgressPercentage(0)).toBe(100);
    });

    it("残り時間が総時間より大きい場合は0%を返す", () => {
      const time = new TimeRemaining(200);
      expect(time.toProgressPercentage(180)).toBe(0);
    });
  });

  describe("時間判定", () => {
    it("時間切れの判定", () => {
      const zeroTime = new TimeRemaining(0);
      const nonZeroTime = new TimeRemaining(30);
      
      expect(zeroTime.isTimeUp()).toBe(true);
      expect(nonZeroTime.isTimeUp()).toBe(false);
    });

    it("警告時間の判定（30秒以下）", () => {
      const warningTime = new TimeRemaining(30);
      const normalTime = new TimeRemaining(31);
      const criticalTime = new TimeRemaining(10);
      
      expect(warningTime.isWarningTime()).toBe(true);
      expect(normalTime.isWarningTime()).toBe(false);
      expect(criticalTime.isWarningTime()).toBe(true);
    });

    it("クリティカル時間の判定（10秒以下）", () => {
      const criticalTime = new TimeRemaining(10);
      const warningTime = new TimeRemaining(11);
      const zeroTime = new TimeRemaining(0);
      
      expect(criticalTime.isCriticalTime()).toBe(true);
      expect(warningTime.isCriticalTime()).toBe(false);
      expect(zeroTime.isCriticalTime()).toBe(true);
    });
  });

  describe("時間操作", () => {
    it("秒数を減算できる", () => {
      const time = new TimeRemaining(180);
      const newTime = time.subtract(30);
      
      expect(newTime.seconds).toBe(150);
      expect(time.seconds).toBe(180); // 元のオブジェクトは変更されない
    });

    it("減算結果が負になる場合は0になる", () => {
      const time = new TimeRemaining(30);
      const newTime = time.subtract(50);
      
      expect(newTime.seconds).toBe(0);
    });

    it("秒数を加算できる", () => {
      const time = new TimeRemaining(120);
      const newTime = time.add(30);
      
      expect(newTime.seconds).toBe(150);
      expect(time.seconds).toBe(120); // 元のオブジェクトは変更されない
    });
  });

  describe("等価性", () => {
    it("同じ秒数のTimeRemainingは等価", () => {
      const time1 = new TimeRemaining(180);
      const time2 = new TimeRemaining(180);
      
      expect(time1.equals(time2)).toBe(true);
    });

    it("異なる秒数のTimeRemainingは非等価", () => {
      const time1 = new TimeRemaining(180);
      const time2 = new TimeRemaining(150);
      
      expect(time1.equals(time2)).toBe(false);
    });
  });

  describe("分と秒の取得", () => {
    it("分数を正しく取得できる", () => {
      const time = new TimeRemaining(185); // 3分5秒
      expect(time.getMinutes()).toBe(3);
    });

    it("秒数（分を除く）を正しく取得できる", () => {
      const time = new TimeRemaining(185); // 3分5秒
      expect(time.getSecondsInMinute()).toBe(5);
    });

    it("0秒の場合の分と秒", () => {
      const time = new TimeRemaining(0);
      expect(time.getMinutes()).toBe(0);
      expect(time.getSecondsInMinute()).toBe(0);
    });

    it("60秒ちょうどの場合の分と秒", () => {
      const time = new TimeRemaining(60);
      expect(time.getMinutes()).toBe(1);
      expect(time.getSecondsInMinute()).toBe(0);
    });
  });
});