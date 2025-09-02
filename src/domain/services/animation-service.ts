import { AnimationState, EasingFunction } from "../value-objects/animation-state";

/**
 * アニメーション設定
 */
export interface AnimationConfig {
  startValue: number;
  endValue: number;
  duration: number;
  easing?: EasingFunction;
}

/**
 * アニメーション計算とトゥイーン処理を提供するサービス
 */
export class AnimationService {
  /**
   * トゥイーンアニメーションを作成
   */
  createTween(
    startTime: number,
    startValue: number,
    endValue: number,
    duration: number,
    easing: EasingFunction = this.linear
  ): AnimationState {
    return new AnimationState(startTime, duration, startValue, endValue, easing);
  }

  /**
   * アニメーションを更新して現在値を取得
   */
  updateAnimation(animation: AnimationState, currentTime: number): number {
    return animation.getCurrentValue(currentTime);
  }

  /**
   * 線形イージング
   */
  linear = (t: number): number => t;

  /**
   * イーズインアウト（滑らかな加速・減速）
   */
  easeInOut = (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  /**
   * イーズイン（徐々に加速）
   */
  easeIn = (t: number): number => {
    return t * t;
  };

  /**
   * イーズアウト（徐々に減速）
   */
  easeOut = (t: number): number => {
    return t * (2 - t);
  };

  /**
   * バウンスイージング
   */
  bounce = (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  };

  /**
   * エラスティックイージング
   */
  elastic = (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  };

  /**
   * アニメーションシーケンスを作成（順次実行）
   */
  createSequence(animations: AnimationState[]): AnimationState[] {
    return [...animations];
  }

  /**
   * 並列アニメーションを作成（同時実行）
   */
  createParallel(startTime: number, configs: AnimationConfig[]): AnimationState[] {
    return configs.map(config => 
      this.createTween(
        startTime,
        config.startValue,
        config.endValue,
        config.duration,
        config.easing || this.linear
      )
    );
  }

  /**
   * 値を補間
   */
  interpolate(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}