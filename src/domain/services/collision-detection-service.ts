import { Position } from "../value-objects/position";
import { Rectangle } from "../value-objects/rectangle";

/**
 * UI要素の基本インターフェース
 */
export interface UIElement {
  bounds: Rectangle;
  isVisible: boolean;
}

/**
 * UI要素の当たり判定処理を提供するサービス
 */
export class CollisionDetectionService {
  /**
   * 点が矩形内にあるかを判定
   */
  pointInRectangle(point: Position, rect: Rectangle): boolean {
    return rect.contains(point);
  }

  /**
   * 点が円内にあるかを判定
   */
  pointInCircle(point: Position, center: Position, radius: number): boolean {
    const distance = point.distance(center);
    return distance <= radius;
  }

  /**
   * 指定位置にあるUI要素を検索
   */
  findUIElementAt<T extends UIElement>(position: Position, elements: T[]): T | null {
    // 後ろから検索（上位レイヤーから）
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      if (!element.isVisible) {
        continue;
      }

      if (this.pointInRectangle(position, element.bounds)) {
        return element;
      }
    }

    return null;
  }

  /**
   * 二つの矩形の交差領域を取得
   */
  rectangleIntersection(rect1: Rectangle, rect2: Rectangle): Rectangle | null {
    const left = Math.max(rect1.x, rect2.x);
    const top = Math.max(rect1.y, rect2.y);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (left < right && top < bottom) {
      return new Rectangle(left, top, right - left, bottom - top);
    }

    return null;
  }

  /**
   * 円と矩形の交差判定
   */
  circleRectangleIntersection(center: Position, radius: number, rect: Rectangle): boolean {
    // 円の中心から矩形への最短距離を計算
    const closestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));

    const closestPoint = new Position(closestX, closestY);
    const distance = center.distance(closestPoint);

    return distance <= radius;
  }

  /**
   * 線分と矩形の交差判定
   */
  lineRectangleIntersection(start: Position, end: Position, rect: Rectangle): boolean {
    // 線分の両端が矩形内にある場合
    if (this.pointInRectangle(start, rect) || this.pointInRectangle(end, rect)) {
      return true;
    }

    // 線分が矩形の辺と交差するかチェック
    const rectCorners = [
      new Position(rect.x, rect.y), // top-left
      new Position(rect.x + rect.width, rect.y), // top-right
      new Position(rect.x + rect.width, rect.y + rect.height), // bottom-right
      new Position(rect.x, rect.y + rect.height), // bottom-left
    ];

    // 矩形の各辺と線分の交差判定
    for (let i = 0; i < 4; i++) {
      const corner1 = rectCorners[i];
      const corner2 = rectCorners[(i + 1) % 4];
      
      if (this.lineIntersection(start, end, corner1, corner2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 二つの線分の交差判定
   */
  private lineIntersection(p1: Position, p2: Position, p3: Position, p4: Position): boolean {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    
    if (Math.abs(denom) < 1e-10) {
      return false; // 平行線
    }

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }
}