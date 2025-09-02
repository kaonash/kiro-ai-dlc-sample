import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { SystemTimeProvider } from "../../../src/infrastructure/time/system-time-provider.js";

describe("SystemTimeProvider", () => {
  let provider: SystemTimeProvider;
  let originalDateNow: () => number;

  beforeEach(() => {
    provider = new SystemTimeProvider();
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe("getCurrentTime", () => {
    it("現在時刻をミリ秒で取得できる", () => {
      const mockTime = 1640995200000; // 2022-01-01 00:00:00 UTC
      Date.now = () => mockTime;

      const currentTime = provider.getCurrentTime();
      
      expect(currentTime).toBe(mockTime);
    });

    it("Date.nowの値と一致する", () => {
      const currentTime = provider.getCurrentTime();
      const dateNow = Date.now();
      
      // 実行時間の差を考慮して1秒以内の差を許容
      expect(Math.abs(currentTime - dateNow)).toBeLessThan(1000);
    });

    it("連続して呼び出すと時間が進む", () => {
      const time1 = provider.getCurrentTime();
      
      // 少し待つ
      const start = Date.now();
      while (Date.now() - start < 10) {
        // 10ms待機
      }
      
      const time2 = provider.getCurrentTime();
      
      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe("時刻の精度", () => {
    it("ミリ秒単位の精度を持つ", () => {
      const mockTime = 1640995200123; // ミリ秒部分が123
      Date.now = () => mockTime;

      const currentTime = provider.getCurrentTime();
      
      expect(currentTime).toBe(mockTime);
      expect(currentTime % 1000).toBe(123);
    });

    it("異なる時刻を正確に返す", () => {
      const times = [
        1640995200000,
        1640995200001,
        1640995200999,
        1640995201000
      ];

      for (const mockTime of times) {
        Date.now = () => mockTime;
        const currentTime = provider.getCurrentTime();
        expect(currentTime).toBe(mockTime);
      }
    });
  });

  describe("パフォーマンス", () => {
    it("大量の呼び出しでもパフォーマンスが維持される", () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        provider.getCurrentTime();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms以内
    });

    it("連続呼び出しでメモリリークしない", () => {
      // メモリ使用量の大幅な増加がないことを確認
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100000; i++) {
        provider.getCurrentTime();
      }
      
      // ガベージコレクションを促す
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加が1MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe("エッジケース", () => {
    it("Date.nowが0を返す場合も正しく処理する", () => {
      Date.now = () => 0;

      const currentTime = provider.getCurrentTime();
      
      expect(currentTime).toBe(0);
    });

    it("Date.nowが負の値を返す場合も正しく処理する", () => {
      Date.now = () => -1000;

      const currentTime = provider.getCurrentTime();
      
      expect(currentTime).toBe(-1000);
    });

    it("Date.nowが非常に大きな値を返す場合も正しく処理する", () => {
      const largeTime = Number.MAX_SAFE_INTEGER;
      Date.now = () => largeTime;

      const currentTime = provider.getCurrentTime();
      
      expect(currentTime).toBe(largeTime);
    });
  });

  describe("型安全性", () => {
    it("戻り値は数値型である", () => {
      const currentTime = provider.getCurrentTime();
      
      expect(typeof currentTime).toBe("number");
    });

    it("戻り値は整数である", () => {
      const currentTime = provider.getCurrentTime();
      
      expect(Number.isInteger(currentTime)).toBe(true);
    });

    it("戻り値は有限数である", () => {
      const currentTime = provider.getCurrentTime();
      
      expect(Number.isFinite(currentTime)).toBe(true);
    });
  });

  describe("インターフェース準拠", () => {
    it("TimeProviderインターフェースを実装している", () => {
      // TypeScriptの型チェックで確認されるが、実行時にもメソッドが存在することを確認
      expect(typeof provider.getCurrentTime).toBe("function");
    });

    it("getCurrentTimeメソッドは引数を取らない", () => {
      expect(provider.getCurrentTime.length).toBe(0);
    });
  });

  describe("実際の時刻との整合性", () => {
    it("実際のDateオブジェクトと近い値を返す", () => {
      const providerTime = provider.getCurrentTime();
      const dateTime = new Date().getTime();
      
      // 実行時間の差を考慮して100ms以内の差を許容
      expect(Math.abs(providerTime - dateTime)).toBeLessThan(100);
    });

    it("Unix時刻として妥当な値を返す", () => {
      const currentTime = provider.getCurrentTime();
      
      // 2020年以降の時刻であることを確認（テスト実行時期に依存）
      const year2020 = new Date("2020-01-01").getTime();
      expect(currentTime).toBeGreaterThan(year2020);
      
      // 2100年以前の時刻であることを確認（合理的な上限）
      const year2100 = new Date("2100-01-01").getTime();
      expect(currentTime).toBeLessThan(year2100);
    });
  });
});