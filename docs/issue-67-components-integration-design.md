# Issue #67 設計ドキュメント: `src/components/` を `src/presentation/components/` に統合

## 背景

クリーンアーキテクチャ導入後、UIコンポーネントの大半は `src/presentation/` 配下に再配置されたが、
初期に作成された3コンポーネント（`RecipeCard` / `RecipeForm` / `IngredientSearch`）は
旧構造の `src/components/` に残存しており、Presentation 層内で import path が揺れている。

現状の import 不整合:

| 利用側 | 現在の import | 問題 |
| --- | --- | --- |
| `src/App.tsx:1` | `./presentation/components/ErrorBoundary` | ✅ 一貫 |
| `src/presentation/pages/RecipeListPage.tsx:2-4` | `../../components/*` | ❌ presentation 層が親ディレクトリの `src/components/` を跨いで import |

## ゴール

- `src/components/` ディレクトリを**撲滅**し、UI コンポーネント配置を `src/presentation/components/` に一本化する。
- レイヤ境界（presentation / domain / application / infrastructure）を目視で把握可能にする。
- ビルド・テスト・lint・動作すべてに デグレなし。

## 対象ファイル一覧

### 移動対象（3ファイル）

| 現在のパス | 移動先 |
| --- | --- |
| `src/components/RecipeCard.tsx` | `src/presentation/components/RecipeCard.tsx` |
| `src/components/RecipeForm.tsx` | `src/presentation/components/RecipeForm.tsx` |
| `src/components/IngredientSearch.tsx` | `src/presentation/components/IngredientSearch.tsx` |

### 既存ファイルとの同居

- `src/presentation/components/ErrorBoundary.tsx` が既に存在する。
- 命名衝突なし・責務重複なし・互いに干渉なし。
- 問題なく同居可能。

### 外部 import 修正対象（1ファイル）

| ファイル | 現在 | 修正後 |
| --- | --- | --- |
| `src/presentation/pages/RecipeListPage.tsx:2` | `import { RecipeCard } from '../../components/RecipeCard'` | `from '../components/RecipeCard'` |
| `src/presentation/pages/RecipeListPage.tsx:3` | `import { RecipeForm } from '../../components/RecipeForm'` | `from '../components/RecipeForm'` |
| `src/presentation/pages/RecipeListPage.tsx:4` | `import { IngredientSearch } from '../../components/IngredientSearch'` | `from '../components/IngredientSearch'` |

### 移動ファイル内部の相対 import 修正

ファイルを1階層深くに移動するため、相対 import の `../` が 1 レベル増える:

| ファイル | 現在 | 修正後 |
| --- | --- | --- |
| `RecipeCard.tsx:2` | `import { RecipeDto } from '../application/dto/RecipeDto'` | `from '../../application/dto/RecipeDto'` |
| `RecipeForm.tsx:3` | `import { RecipeDto } from '../application/dto/RecipeDto'` | `from '../../application/dto/RecipeDto'` |
| `IngredientSearch.tsx` | （外部 import のみ: `lucide-react`） | 修正不要 |

## 実行手順

```bash
# 1. git mv でファイル移動（history 保持）
git mv src/components/RecipeCard.tsx src/presentation/components/RecipeCard.tsx
git mv src/components/RecipeForm.tsx src/presentation/components/RecipeForm.tsx
git mv src/components/IngredientSearch.tsx src/presentation/components/IngredientSearch.tsx

# 2. 空になった src/components/ ディレクトリを削除
rmdir src/components

# 3. 移動したファイル内部の相対 import を修正
#    - RecipeCard.tsx:  ../application/dto/RecipeDto → ../../application/dto/RecipeDto
#    - RecipeForm.tsx:  ../application/dto/RecipeDto → ../../application/dto/RecipeDto

# 4. RecipeListPage.tsx の import path を修正
#    - 2: ../../components/RecipeCard       → ../components/RecipeCard
#    - 3: ../../components/RecipeForm       → ../components/RecipeForm
#    - 4: ../../components/IngredientSearch → ../components/IngredientSearch

# 5. 検証
npm run typecheck
npm run lint
npm run test
npm run build
```

## 影響範囲

### ビルド・型

- 相対 import が残る他ファイルは **ない**（grep で `from.*components/` を確認済み）。
- TypeScript strict mode で型エラーが出ない。

### テスト

- 移動対象3ファイルに対する既存テストは **存在しない**（ドメイン層のみテスト有り）。
- 既存ドメインテストには影響しない。

### Runtime

- ESM のパス解決のみが変わる。実行時挙動は完全に不変。
- 表示・操作の golden path（一覧表示・作成・編集・削除・材料検索）に影響なし。

## デグレリスク / 破壊的変更

| リスク | 評価 | 対応 |
| --- | --- | --- |
| 未検出の import 残存 | 低 | `grep -rn "from.*components/"` で網羅確認済み（3箇所のみ） |
| git history 欠損 | 低 | `git mv` を使い rename として記録 |
| 循環参照 | 無 | presentation → application DTO の単方向で変化なし |
| テスト破損 | 無 | 移動対象にテスト無し・既存テスト範囲外 |
| Vercel / Supabase 連携 | 無 | 純粋なファイル再配置 |

## 検証項目（受け入れ条件に対応）

- [ ] `src/components/` ディレクトリが存在しない（`ls src/components` が失敗）
- [ ] `src/presentation/components/` に `ErrorBoundary.tsx` / `RecipeCard.tsx` / `RecipeForm.tsx` / `IngredientSearch.tsx` の4つが存在
- [ ] `npm run typecheck` 成功
- [ ] `npm run lint` 成功
- [ ] `npm run test` 成功
- [ ] `npm run build` 成功
- [ ] `grep -rn "from.*['\"]\\.\\./\\.\\./components" src/` が0件
- [ ] ローカルで `npm run dev` し、一覧表示・作成・編集・削除・材料検索が動作

## スコープ外

- コンポーネント本体のリファクタ（props 型変更・分割など）は次 issue（#68 ViewModel 導入）の対象。
- `RecipeDto` の命名規則変更（snake_case → camelCase）も #68 のスコープ。
- Storybook 等の導入は別 issue。

## 実装者

Developer Agent に委譲。軽微な機械的移動だが、複数ファイル変更 + 相対 import 修正のため本体では実施しない。
