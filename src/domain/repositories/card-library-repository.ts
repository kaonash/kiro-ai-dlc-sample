import type { CardLibrary } from "../entities/card-library.js";

/**
 * カードライブラリリポジトリインターフェース
 */
export interface ICardLibraryRepository {
  /**
   * カードライブラリを保存
   */
  save(library: CardLibrary): Promise<void>;

  /**
   * カードライブラリを読み込み
   */
  load(): Promise<CardLibrary>;

  /**
   * カードライブラリが存在するかチェック
   */
  exists(): Promise<boolean>;

  /**
   * カードライブラリを削除
   */
  delete(): Promise<void>;
}
