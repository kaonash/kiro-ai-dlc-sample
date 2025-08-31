import { CardLibrary } from "../../domain/entities/card-library.js";
import { Card } from "../../domain/entities/card.js";
import type { ICardLibraryRepository } from "../../domain/repositories/card-library-repository.js";
import { CardCost } from "../../domain/value-objects/card-cost.js";
import type { SpecialAbility } from "../../domain/value-objects/special-ability.js";
import type { TowerType } from "../../domain/value-objects/tower-type.js";

/**
 * カードライブラリの永続化データ形式
 */
interface CardLibraryData {
  discoveredCards: Array<{
    id: string;
    name: string;
    description: string;
    cost: number;
    towerType: TowerType;
    specialAbility: SpecialAbility;
  }>;
  discoveryDates: Array<{
    cardId: string;
    date: string;
  }>;
}

/**
 * LocalStorageを使用したカードライブラリリポジトリ実装
 */
export class LocalStorageCardLibraryRepository implements ICardLibraryRepository {
  private static readonly STORAGE_KEY = "card-library";

  /**
   * カードライブラリを保存
   */
  async save(library: CardLibrary): Promise<void> {
    try {
      const data = this.serializeLibrary(library);
      localStorage.setItem(LocalStorageCardLibraryRepository.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      throw new Error(`カードライブラリの保存に失敗しました: ${error}`);
    }
  }

  /**
   * カードライブラリを読み込み
   */
  async load(): Promise<CardLibrary> {
    try {
      const dataString = localStorage.getItem(LocalStorageCardLibraryRepository.STORAGE_KEY);
      if (!dataString) {
        return new CardLibrary();
      }

      const data: CardLibraryData = JSON.parse(dataString);
      return this.deserializeLibrary(data);
    } catch (error) {
      // データが破損している場合は空のライブラリを返す
      console.warn("カードライブラリの読み込みに失敗しました。空のライブラリを作成します:", error);
      return new CardLibrary();
    }
  }

  /**
   * カードライブラリが存在するかチェック
   */
  async exists(): Promise<boolean> {
    return localStorage.getItem(LocalStorageCardLibraryRepository.STORAGE_KEY) !== null;
  }

  /**
   * カードライブラリを削除
   */
  async delete(): Promise<void> {
    localStorage.removeItem(LocalStorageCardLibraryRepository.STORAGE_KEY);
  }

  /**
   * カードライブラリをシリアライズ
   */
  private serializeLibrary(library: CardLibrary): CardLibraryData {
    const discoveredCards = library.getAllDiscoveredCards().map((card) => ({
      id: card.id,
      name: card.name,
      description: card.description,
      cost: card.cost.value,
      towerType: card.towerType,
      specialAbility: card.specialAbility,
    }));

    const discoveryDates = discoveredCards.map((card) => ({
      cardId: card.id,
      date: library.getDiscoveryDate(card.id)?.toISOString() || new Date().toISOString(),
    }));

    return {
      discoveredCards,
      discoveryDates,
    };
  }

  /**
   * カードライブラリをデシリアライズ
   */
  private deserializeLibrary(data: CardLibraryData): CardLibrary {
    const library = new CardLibrary();

    // 発見日時のマップを作成
    const discoveryDateMap = new Map<string, Date>();
    data.discoveryDates.forEach((item) => {
      discoveryDateMap.set(item.cardId, new Date(item.date));
    });

    // カードを復元してライブラリに追加
    data.discoveredCards.forEach((cardData) => {
      try {
        const card = new Card(
          cardData.id,
          cardData.name,
          cardData.description,
          new CardCost(cardData.cost),
          cardData.towerType,
          cardData.specialAbility
        );

        library.discoverCard(card);

        // 発見日時を復元（内部的にアクセスするため、リフレクションを使用）
        const discoveryDate = discoveryDateMap.get(cardData.id);
        if (discoveryDate) {
          // プライベートフィールドにアクセスするためのハック
          // 実際のプロダクションコードでは、CardLibraryにsetDiscoveryDateメソッドを追加することを推奨
          (library as any)._discoveryDates?.set(cardData.id, discoveryDate);
        }
      } catch (error) {
        console.warn(`カード ${cardData.id} の復元に失敗しました:`, error);
      }
    });

    return library;
  }
}
