import { Position } from './position';

/**
 * 敵の移動経路を表現する値オブジェクト
 */
export class MovementPath {
  public readonly totalLength: number;
  public readonly spawnPoint: Position;
  public readonly basePoint: Position;

  constructor(public readonly pathPoints: Position[]) {
    if (pathPoints.length < 2) {
      throw new Error('Path must have at least 2 points');
    }

    this.spawnPoint = pathPoints[0];
    this.basePoint = pathPoints[pathPoints.length - 1];
    this.totalLength = this.calculateTotalLength();
  }

  /**
   * パス全長を計算する
   * @returns パス全長
   */
  private calculateTotalLength(): number {
    let totalLength = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      totalLength += this.pathPoints[i - 1].distanceTo(this.pathPoints[i]);
    }
    return totalLength;
  }

  /**
   * 進行度から位置を取得する
   * @param progress 進行度 (0.0-1.0)
   * @returns 進行度に対応する位置
   */
  getPositionAtProgress(progress: number): Position {
    // 進行度を0-1の範囲にクランプ
    progress = Math.max(0, Math.min(1, progress));

    if (progress === 0) {
      return this.spawnPoint;
    }
    if (progress === 1) {
      return this.basePoint;
    }

    // 目標距離を計算
    const targetDistance = this.totalLength * progress;
    
    // どのセグメントに位置するかを特定
    let currentDistance = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      const segmentStart = this.pathPoints[i - 1];
      const segmentEnd = this.pathPoints[i];
      const segmentLength = segmentStart.distanceTo(segmentEnd);

      if (currentDistance + segmentLength >= targetDistance) {
        // このセグメント内に目標位置がある
        const distanceInSegment = targetDistance - currentDistance;
        const segmentProgress = distanceInSegment / segmentLength;
        return segmentStart.interpolate(segmentEnd, segmentProgress);
      }

      currentDistance += segmentLength;
    }

    // フォールバック（通常は到達しない）
    return this.basePoint;
  }

  /**
   * 次の位置を計算する
   * @param currentProgress 現在の進行度
   * @param speed 移動速度（ピクセル/秒）
   * @param deltaTime 経過時間（ミリ秒）
   * @returns 次の位置
   */
  getNextPosition(currentProgress: number, speed: number, deltaTime: number): Position {
    // 移動距離を計算（ミリ秒を秒に変換）
    const moveDistance = speed * (deltaTime / 1000);
    
    // 現在の距離を計算
    const currentDistance = this.totalLength * currentProgress;
    
    // 新しい距離を計算
    const newDistance = currentDistance + moveDistance;
    
    // 新しい進行度を計算
    const newProgress = this.getProgressFromDistance(newDistance);
    
    return this.getPositionAtProgress(newProgress);
  }

  /**
   * 総移動時間を計算する
   * @param speed 移動速度（ピクセル/秒）
   * @returns 総移動時間（ミリ秒）
   */
  getTotalTravelTime(speed: number): number {
    if (speed <= 0) {
      throw new Error('Speed must be positive');
    }
    
    return (this.totalLength / speed) * 1000; // 秒をミリ秒に変換
  }

  /**
   * 距離から進行度を計算する
   * @param distance 距離
   * @returns 進行度 (0.0-1.0)
   */
  getProgressFromDistance(distance: number): number {
    if (distance <= 0) {
      return 0;
    }
    if (distance >= this.totalLength) {
      return 1;
    }
    return distance / this.totalLength;
  }
}