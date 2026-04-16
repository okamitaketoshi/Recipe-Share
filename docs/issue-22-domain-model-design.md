# Issue #22: ドメインモデル設計書

## 📋 概要

レシピ共有アプリのドメインモデル（Entity・Value Object）を作成し、ビジネスロジックをドメイン層に集約します。

## 🎯 目的

- データ型とビジネスロジックを分離
- ドメイン駆動設計（DDD）の導入
- 不変性・バリデーション・型安全性の向上

## 🔍 現状分析

### 既存のRecipe型

**場所**: `src/lib/supabase.ts`

```typescript
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
```

**問題点**:
- 単なるデータ型でビジネスロジックがない
- バリデーションがない
- 不変性が保証されていない
- DTOとドメインモデルが混在

### Recipe型の使用箇所

| ファイル | 用途 | 影響度 |
|---------|------|-------|
| `App.tsx` | CRUD操作、状態管理 | 高 |
| `RecipeCard.tsx` | Recipe表示 | 中 |
| `RecipeForm.tsx` | Recipe編集フォーム | 中 |
| `SupabaseRecipeRepository.ts` | DB操作 | 高 |
| `src/lib/search.ts` | 検索機能 | 中 |

## 🏗️ 設計方針

### アーキテクチャ選択

**方針A: 段階的移行（推奨）** ✅

DTOとドメインモデルを分離し、既存コードへの影響を最小化します。

```
プレゼンテーション層（React Components）
  ↓ RecipeDTO（既存Recipe型）
インフラ層（Repository）
  ↓ DTO ⇔ ドメインモデル変換
ドメイン層（Domain Models）
```

**利点**:
- 既存コンポーネントの修正不要
- デグレリスク最小
- 段階的にドメインモデルに移行可能

**欠点**:
- 一時的にDTOとドメインモデルが共存
- 変換ロジックが必要

---

**方針B: 全面置換（リスク大）** ❌

既存Recipe型をドメインモデルに置き換え、すべてのコンポーネントを一度に修正します。

**利点**:
- 最終形に一気に到達
- DTOとドメインモデルの共存がない

**欠点**:
- 広範囲の修正が必要
- デグレリスク高い
- テストが大変

---

### 推奨: 方針A（段階的移行）

**理由**:
- 既存機能への影響を最小化
- PR範囲を小さく保てる
- テストしやすい
- 段階的にドメインモデルに移行できる

## 📐 ドメインモデル設計

### 1. RecipeId（Value Object）

**責務**: レシピIDの表現と検証

```typescript
export class RecipeId {
  private readonly value: string;

  private constructor(value: string) {
    if (!this.isValidUUID(value)) {
      throw new Error('Invalid RecipeId: must be a valid UUID');
    }
    this.value = value;
  }

  static create(value: string): RecipeId {
    return new RecipeId(value);
  }

  static generate(): RecipeId {
    // UUID v4生成
    return new RecipeId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RecipeId): boolean {
    return this.value === other.value;
  }

  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
```

**特徴**:
- 不変（immutable）
- UUID検証
- 型安全性（stringではなくRecipeId型）

### 2. Ingredient（Value Object）

**責務**: 材料の表現と検証

```typescript
export class Ingredient {
  private readonly value: string;

  private constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('Ingredient cannot be empty');
    }
    if (trimmed.length > 200) {
      throw new Error('Ingredient must be 200 characters or less');
    }
    this.value = trimmed;
  }

  static create(value: string): Ingredient {
    return new Ingredient(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Ingredient): boolean {
    return this.value === other.value;
  }
}
```

**特徴**:
- 不変（immutable）
- 空文字チェック
- 最大長チェック（200文字）
- トリム処理

### 3. CookingStep（Value Object）

**責務**: 調理手順の表現と検証

```typescript
export class CookingStep {
  private readonly stepNumber: number;
  private readonly description: string;

  private constructor(stepNumber: number, description: string) {
    if (stepNumber < 1) {
      throw new Error('Step number must be 1 or greater');
    }
    const trimmed = description.trim();
    if (trimmed.length === 0) {
      throw new Error('Step description cannot be empty');
    }
    if (trimmed.length > 1000) {
      throw new Error('Step description must be 1000 characters or less');
    }
    this.stepNumber = stepNumber;
    this.description = trimmed;
  }

  static create(stepNumber: number, description: string): CookingStep {
    return new CookingStep(stepNumber, description);
  }

  getStepNumber(): number {
    return this.stepNumber;
  }

  getDescription(): string {
    return this.description;
  }

  equals(other: CookingStep): boolean {
    return (
      this.stepNumber === other.stepNumber &&
      this.description === other.description
    );
  }
}
```

**特徴**:
- 不変（immutable）
- 手順番号の検証（1以上）
- 説明の検証（空文字・最大長）

### 4. Recipe（Entity）

**責務**: レシピの集約とビジネスロジック

```typescript
export class Recipe {
  private readonly id: RecipeId;
  private title: string;
  private ingredients: Ingredient[];
  private steps: CookingStep[];
  private recipeUrl: string | null;
  private readonly createdAt: Date;

  private constructor(
    id: RecipeId,
    title: string,
    ingredients: Ingredient[],
    steps: CookingStep[],
    recipeUrl: string | null,
    createdAt: Date
  ) {
    this.validateTitle(title);
    this.validateIngredients(ingredients);
    this.validateSteps(steps);
    this.validateRecipeUrl(recipeUrl);

    this.id = id;
    this.title = title;
    this.ingredients = ingredients;
    this.steps = steps;
    this.recipeUrl = recipeUrl;
    this.createdAt = createdAt;
  }

  // ファクトリメソッド: 新規作成
  static create(
    title: string,
    ingredients: Ingredient[],
    steps: CookingStep[],
    recipeUrl: string | null = null
  ): Recipe {
    return new Recipe(
      RecipeId.generate(),
      title,
      ingredients,
      steps,
      recipeUrl,
      new Date()
    );
  }

  // ファクトリメソッド: 既存データから復元
  static reconstruct(
    id: RecipeId,
    title: string,
    ingredients: Ingredient[],
    steps: CookingStep[],
    recipeUrl: string | null,
    createdAt: Date
  ): Recipe {
    return new Recipe(id, title, ingredients, steps, recipeUrl, createdAt);
  }

  // ビジネスロジック: 材料追加
  addIngredient(ingredient: Ingredient): void {
    // 重複チェック
    if (this.ingredients.some((i) => i.equals(ingredient))) {
      throw new Error('Ingredient already exists');
    }
    this.ingredients.push(ingredient);
  }

  // ビジネスロジック: 材料削除
  removeIngredient(ingredient: Ingredient): void {
    const index = this.ingredients.findIndex((i) => i.equals(ingredient));
    if (index === -1) {
      throw new Error('Ingredient not found');
    }
    this.ingredients.splice(index, 1);
  }

  // ビジネスロジック: 手順更新
  updateStep(stepNumber: number, description: string): void {
    const index = this.steps.findIndex((s) => s.getStepNumber() === stepNumber);
    if (index === -1) {
      throw new Error('Step not found');
    }
    this.steps[index] = CookingStep.create(stepNumber, description);
  }

  // ビジネスロジック: 完成度チェック
  isComplete(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.ingredients.length > 0 &&
      this.steps.length > 0
    );
  }

  // バリデーション
  private validateTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (trimmed.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }
  }

  private validateIngredients(ingredients: Ingredient[]): void {
    if (ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }
  }

  private validateSteps(steps: CookingStep[]): void {
    if (steps.length === 0) {
      throw new Error('Recipe must have at least one step');
    }
  }

  private validateRecipeUrl(recipeUrl: string | null): void {
    if (recipeUrl === null) return;
    try {
      new URL(recipeUrl);
    } catch {
      throw new Error('Invalid recipe URL');
    }
  }

  // Getter
  getId(): RecipeId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getIngredients(): ReadonlyArray<Ingredient> {
    return this.ingredients;
  }

  getSteps(): ReadonlyArray<CookingStep> {
    return this.steps;
  }

  getRecipeUrl(): string | null {
    return this.recipeUrl;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
```

**特徴**:
- Entityとして識別性を持つ（RecipeId）
- ビジネスロジックを含む
  - `addIngredient()`: 材料追加（重複チェック）
  - `removeIngredient()`: 材料削除
  - `updateStep()`: 手順更新
  - `isComplete()`: 完成度チェック
- バリデーション
  - タイトル（必須、最大100文字）
  - 材料（最低1個）
  - 手順（最低1個）
  - レシピURL（URL形式）

## 🔄 データ変換（DTO ⇔ ドメインモデル）

### RecipeDTO型の定義

既存のRecipe型をRecipeDTOにリネームします。

**場所**: `src/infrastructure/dto/RecipeDTO.ts`（新規作成）

```typescript
export type RecipeDTO = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
```

### SupabaseRecipeRepositoryでの変換

**ドメインモデル → DTO（永続化時）**:

```typescript
private toDTO(recipe: Recipe): Omit<RecipeDTO, 'id' | 'created_at'> {
  const ingredients = recipe.getIngredients().map((i) => i.getValue());
  const steps = recipe.getSteps().map((s) => s.getDescription());

  return {
    title: recipe.getTitle(),
    ingredients,
    steps_array: steps,
    steps: steps.join('\n'),
    recipe_url: recipe.getRecipeUrl(),
  };
}
```

**DTO → ドメインモデル（取得時）**:

```typescript
private toDomain(dto: RecipeDTO): Recipe {
  const id = RecipeId.create(dto.id);
  const ingredients = dto.ingredients.map((i) => Ingredient.create(i));
  const steps = dto.steps_array.map((s, index) => CookingStep.create(index + 1, s));

  return Recipe.reconstruct(
    id,
    dto.title,
    ingredients,
    steps,
    dto.recipe_url,
    new Date(dto.created_at)
  );
}
```

## 📂 ファイル構成

```
src/
├── domain/
│   └── models/
│       ├── Recipe.ts           # Recipe Entity
│       ├── RecipeId.ts         # RecipeId Value Object
│       ├── Ingredient.ts       # Ingredient Value Object
│       └── CookingStep.ts      # CookingStep Value Object
├── infrastructure/
│   ├── dto/
│   │   └── RecipeDTO.ts        # RecipeDTO型定義
│   └── repositories/
│       └── SupabaseRecipeRepository.ts  # 変換ロジック追加
└── lib/
    └── supabase.ts             # Recipe型をRecipeDTOにリネーム予定
```

## ⚠️ デグレリスク・破壊的変更

### リスク1: 既存コンポーネントへの影響

**影響範囲**: App.tsx, RecipeCard.tsx, RecipeForm.tsx

**対策**:
- 段階的移行により、既存コンポーネントは**変更不要**
- RecipeDTO型をそのまま使用し続ける
- 将来的にドメインモデルに移行（別PR）

### リスク2: Repository変換ロジックのバグ

**影響**: CRUD操作が失敗する可能性

**対策**:
- 単体テストで変換ロジックを検証
- 既存の統合テストを実行してデグレがないか確認

### リスク3: パフォーマンス低下

**影響**: DTO⇔ドメインモデル変換でオーバーヘッド

**対策**:
- 変換処理は軽量（単純なマッピング）
- 実測して問題があれば最適化

## ✅ 受け入れ条件

- [ ] RecipeId Value Objectが作成されていること
  - UUID検証が正しく動作すること
  - 不変性が保証されていること

- [ ] Ingredient Value Objectが作成されていること
  - 空文字チェックが正しく動作すること
  - 最大長チェックが正しく動作すること
  - 不変性が保証されていること

- [ ] CookingStep Value Objectが作成されていること
  - 手順番号の検証が正しく動作すること
  - 説明の検証が正しく動作すること
  - 不変性が保証されていること

- [ ] Recipe Entityが作成されていること
  - ビジネスロジックが正しく動作すること
    - `addIngredient()`: 材料追加（重複チェック）
    - `removeIngredient()`: 材料削除
    - `updateStep()`: 手順更新
    - `isComplete()`: 完成度チェック
  - バリデーションが正しく動作すること

- [ ] すべてのドメインモデルに単体テストが追加されていること
  - 正常系・異常系の両方をカバー
  - バリデーションのテスト
  - ビジネスロジックのテスト

- [ ] SupabaseRecipeRepositoryに変換ロジックが追加されていること
  - DTO → ドメインモデル変換
  - ドメインモデル → DTO変換

- [ ] 既存機能にデグレがないこと
  - レシピ一覧表示
  - レシピ作成
  - レシピ編集
  - レシピ削除
  - 材料検索

## 🧪 テスト計画

### 単体テスト

1. **RecipeId.test.ts**
   - 正常なUUID → 成功
   - 不正なUUID → エラー
   - equals()メソッド

2. **Ingredient.test.ts**
   - 正常な材料 → 成功
   - 空文字 → エラー
   - 最大長超過 → エラー
   - トリム処理

3. **CookingStep.test.ts**
   - 正常な手順 → 成功
   - 手順番号0以下 → エラー
   - 空文字の説明 → エラー
   - 最大長超過 → エラー

4. **Recipe.test.ts**
   - レシピ作成 → 成功
   - 材料追加 → 成功
   - 材料削除 → 成功
   - 手順更新 → 成功
   - 完成度チェック → 正しい結果
   - バリデーションエラー

### 統合テスト（既存）

- レシピCRUD操作
- 材料検索機能

## 📝 実装順序

1. ✅ **設計ドキュメント作成**（本ドキュメント）
2. ⏳ **Value Object作成**
   - RecipeId.ts
   - Ingredient.ts
   - CookingStep.ts
3. ⏳ **Entity作成**
   - Recipe.ts
4. ⏳ **単体テスト作成**
   - 各ドメインモデルのテスト
5. ⏳ **DTO定義**
   - RecipeDTO.ts
6. ⏳ **Repository変換ロジック追加**
   - SupabaseRecipeRepository.ts
7. ⏳ **既存機能の動作確認**
   - 手動テスト + 統合テスト実行

## 🤔 要検討事項

### 1. DTO⇔ドメインモデル変換のタイミング

**現在の方針**: Repository層で変換

**代替案**:
- Use Case層で変換
- プレゼンテーション層で変換

**質問**: Repository層での変換で問題ないか？

---

### 2. 既存Recipe型（`src/lib/supabase.ts`）の扱い

**現在の方針**: そのままRecipeDTOにリネーム（別PR）

**代替案**:
- 今回のPRでリネーム実施
- Recipe型をexportしたまま残す

**質問**: 既存Recipe型をこのPRでリネームするか、別PRで実施するか？

---

### 3. 将来的なドメインモデルへの移行計画

**現在の方針**: 段階的移行（今回はドメインモデル作成のみ）

**次のステップ案**:
1. Use Case層の作成（ApplicationService）
2. コンポーネントでドメインモデルを使用
3. DTOを段階的に削除

**質問**: 移行のスケジュール・優先度はどうするか？

---

### 4. バリデーションエラーのハンドリング

**現在の方針**: Errorをthrow

**代替案**:
- Result型（成功/失敗を明示）
- カスタムエラークラス

**質問**: Errorのthrowで問題ないか？

---

## 💬 確認事項

以下の点についてユーザーに確認が必要です：

1. **設計方針**: 段階的移行（方針A）で問題ないか？
2. **ドメインモデル設計**: Recipe、RecipeId、Ingredient、CookingStepの設計で問題ないか？
3. **要検討事項**: 上記4点について判断・方針決定
4. **実装開始の承認**: Developer Agentを起動して実装開始してよいか？

---

## 🚀 次のステップ

ユーザー承認後、Developer Agentを起動して以下を実装します：

1. Value Object作成（RecipeId, Ingredient, CookingStep）
2. Entity作成（Recipe）
3. 単体テスト作成
4. RecipeDTO型定義
5. Repository変換ロジック追加
6. 既存機能の動作確認
