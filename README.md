# Recipe-Share - みんなのレシピ

## プロジェクト概要

Recipe-Shareは、誰でも自由にレシピを投稿・閲覧できる公開レシピ共有Webアプリケーションです。材料から検索できる機能を備え、家にある食材でどんな料理が作れるか簡単に見つけられます。

### 主要機能

- **レシピ管理**: レシピの作成・閲覧・編集・削除（完全CRUD操作）
- **材料検索**: 所持している材料からレシピを検索（AND/OR検索モード対応）
- **リアルタイム更新**: Supabase Realtimeによる即座のデータ同期
- **レスポンシブUI**: モバイル・タブレット・デスクトップ対応

## 技術スタック

### フロントエンド

- **React** 18.3.1 - UIフレームワーク
- **TypeScript** 5.5.3 - 静的型付け（strict mode）
- **Vite** 5.4.2 - ビルドツール・開発サーバー
- **Tailwind CSS** 3.4.1 - ユーティリティファーストCSS
- **lucide-react** 0.344.0 - アイコンライブラリ

### バックエンド

- **Supabase** 2.57.4 - BaaS（Backend as a Service）
- **PostgreSQL** - データベース（Supabase管理）

### コード品質

- **ESLint** 9.9.1 - コード静的解析
- **typescript-eslint** 8.3.0 - TypeScript用ESLintプラグイン

## プロジェクト構造

```
Recipe-Share/
├── src/
│   ├── components/
│   │   ├── RecipeCard.tsx        # レシピ表示カード
│   │   ├── RecipeForm.tsx        # レシピ作成・編集フォーム
│   │   └── IngredientSearch.tsx  # 材料検索UI
│   ├── lib/
│   │   ├── supabase.ts          # Supabaseクライアント設定・型定義
│   │   └── search.ts            # 材料検索ロジック
│   ├── App.tsx                  # メインアプリケーションコンポーネント
│   ├── main.tsx                 # Reactエントリーポイント
│   ├── index.css                # グローバルスタイル
│   └── vite-env.d.ts            # Vite型定義
├── supabase/
│   └── migrations/              # データベースマイグレーション
│       ├── 20260310143236_create_recipes_table.sql
│       └── 20260311065834_add_steps_and_url_to_recipes.sql
├── index.html                   # HTMLエントリーポイント
├── vite.config.ts              # Vite設定
├── tsconfig.json               # TypeScript設定（ルート）
├── tsconfig.app.json           # TypeScript設定（アプリ用）
├── tsconfig.node.json          # TypeScript設定（Node用）
├── tailwind.config.js          # Tailwind CSS設定
├── postcss.config.js           # PostCSS設定
├── eslint.config.js            # ESLint設定
└── package.json                # プロジェクト依存関係
```

## データモデル

### Recipe型定義（src/lib/supabase.ts）

```typescript
type Recipe = {
  id: string; // UUID（自動生成）
  title: string; // レシピ名
  ingredients: string[]; // 材料配列（例: ["小麦粉 200g", "卵 2個"]）
  steps: string; // 手順テキスト（後方互換性のため保持）
  steps_array: string[]; // 手順配列（例: ["粉をふるう", "卵を混ぜる"]）
  recipe_url: string | null; // 参照URLオプション
  created_at: string; // 作成日時（ISO 8601形式）
};
```

### データベーススキーマ

**テーブル**: `recipes`

| カラム名    | 型          | 制約                                   | 説明                   |
| ----------- | ----------- | -------------------------------------- | ---------------------- |
| id          | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | レシピの一意識別子     |
| title       | text        | NOT NULL                               | レシピ名               |
| ingredients | jsonb       | NOT NULL, DEFAULT '[]'                 | 材料配列               |
| steps       | text        | NOT NULL                               | 手順テキスト（旧形式） |
| steps_array | jsonb       | DEFAULT '[]'                           | 手順配列（新形式）     |
| recipe_url  | text        | NULLABLE                               | 参照URL                |
| created_at  | timestamptz | DEFAULT now()                          | 作成日時               |

### Row Level Security（RLS）ポリシー

- **完全公開設定**: 認証なしですべての操作が可能
- **対象ロール**: `anon`（匿名）、`authenticated`（認証済み）
- **許可操作**:
  - SELECT: すべてのレシピを閲覧可能
  - INSERT: 誰でもレシピを作成可能
  - UPDATE: すべてのレシピを編集可能
  - DELETE: すべてのレシピを削除可能

## 主要コンポーネント

### App.tsx

- アプリケーションのルートコンポーネント
- レシピデータの取得・管理
- Supabase Realtimeチャネルの購読・解除
- レシピCRUD操作のハンドラー
- 材料検索フィルタリング

### components/RecipeCard.tsx

- レシピの表示カード
- 編集・削除ボタン
- レシピURL外部リンク
- 材料リスト表示
- 作り方手順表示（番号付きステップ）

### components/RecipeForm.tsx

- レシピ作成・編集フォーム（モーダル）
- 動的な材料・手順の追加・削除
- バリデーション（空欄チェック）
- 新規作成と編集の両モード対応

### components/IngredientSearch.tsx

- 材料検索UI
- スペース区切りでの複数キーワード入力
- AND/OR検索モード切替
- 入力済みタグ表示・個別削除
- クリアボタン

### lib/search.ts

- 材料検索ロジック
- 全角・半角正規化（`normalizeString`）
- 部分一致検索（`matchIngredient`）
- AND/OR検索フィルタリング（`filterRecipesByIngredients`）

### lib/supabase.ts

- Supabaseクライアントの初期化
- 環境変数からURL・APIキー取得
- Recipe型定義のエクスポート

## 🐳 ローカル開発環境（Supabase CLI）

### セットアップ手順

#### 1. Supabase CLIインストール

**Homebrewでインストール（推奨）**:

```bash
brew install supabase/tap/supabase
```

**またはnpx経由で使用（インストール不要）**:

```bash
npx supabase --version
```

#### 2. ローカルDB環境設定

`.env.local.example` をコピーして `.env.local` を作成：

```bash
cp .env.local.example .env.local
```

#### 3. Supabaseローカル環境起動

```bash
mise run db:start
# または
npx supabase start
```

**初回起動時の注意**:

- Dockerイメージのダウンロードに数分かかります
- PostgreSQL, PostgREST, GoTrue, Storage, Realtime などのコンテナが起動します

起動完了後、以下のエンドポイントが利用可能になります：

- **Supabase API**: http://localhost:54321
- **Supabase Studio**: http://localhost:54323（ブラウザベースのDB管理UI）
- **PostgreSQL**: localhost:5432

#### 4. DB接続確認

```bash
mise run db:psql
```

psqlシェルが起動したら `\dt` でテーブル一覧を確認。

#### 5. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセスし、レシピCRUD機能が動作するか確認。

### DB管理コマンド

| コマンド             | 説明                                    |
| -------------------- | --------------------------------------- |
| `mise run db:start`  | ローカルSupabase環境起動                |
| `mise run db:stop`   | ローカルSupabase環境停止                |
| `mise run db:status` | 環境の状態確認（エンドポイントURL表示） |
| `mise run db:reset`  | データ削除 + マイグレーション再適用     |
| `mise run db:psql`   | psqlシェル起動（DB接続確認）            |
| `mise run db:studio` | Supabase Studio起動（ブラウザで管理UI） |
| `mise run db:seed`   | シードデータを投入（seed.sql実行）      |

### シードデータについて

`supabase/seed.sql` には7件のサンプルレシピが含まれています。

**自動適用**: `mise run db:reset` 実行時にマイグレーション後、シードデータが自動的に適用されます。

**手動投入**: シードデータのみを投入したい場合は `mise run db:seed` を実行してください。

**データ内容**: カレーライス、オムライス、カルボナーラなど、材料検索機能のテストに使用できるレシピデータです。共通材料（卵、米、パスタなど）を持つレシピが複数含まれており、AND/OR検索機能のテストに最適です。

### Supabase Studioの使い方

http://localhost:54323 にアクセスすると、ブラウザベースのDB管理UIが開きます。

**できること**:

- テーブル構造の確認・編集
- データの閲覧・追加・更新・削除
- SQLクエリの実行
- RLSポリシーの管理
- マイグレーション履歴の確認

### 環境切り替え

- **ローカルDB使用**: `.env.local` が存在する状態
- **Supabase本番使用**: `.env.local` を削除または `.env.local.backup` にリネーム

### トラブルシューティング

#### ポート競合エラー

```bash
# 既存のプロセスを確認
lsof -i :54321
lsof -i :5432

# Supabase環境を停止
mise run db:stop

# Dockerコンテナを確認
docker ps
```

#### マイグレーションが適用されていない

```bash
# DBをリセットして再起動
mise run db:reset

# ステータス確認
mise run db:status
```

#### Docker Desktopが起動していない

Supabase CLIはDockerを使用するため、Docker Desktopが起動している必要があります。

```bash
# Dockerが起動しているか確認
docker ps
```

## 開発ワークフロー

### セットアップ（Supabase本番環境使用の場合）

```bash
# 依存関係のインストール
npm install

# 環境変数の設定（.envファイルを作成）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 開発コマンド

```bash
# 開発サーバー起動（http://localhost:5173）
npm run dev

# TypeScript型チェック
npm run typecheck

# ESLintによるコード静的解析
npm run lint

# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

### データベースマイグレーション

#### ローカル環境（Supabase CLI）

ローカルSupabase起動時に、`supabase/migrations/` 内のマイグレーションファイルが自動的に適用されます：

1. `20260310143236_create_recipes_table.sql` - recipesテーブル作成・RLS設定
2. `20260311065834_add_steps_and_url_to_recipes.sql` - steps_array・recipe_url追加

マイグレーションのステータスを確認する場合：

```bash
mise run db:status
```

#### Supabase本番環境

Supabaseダッシュボードで上記のマイグレーションを実行：

1. `20260310143236_create_recipes_table.sql` - recipesテーブル作成・RLS設定
2. `20260311065834_add_steps_and_url_to_recipes.sql` - steps_array・recipe_url追加

## コーディング規約

### TypeScript

- **strict mode**: 有効
- **未使用変数**: エラー（noUnusedLocals, noUnusedParameters）
- **型定義**: 明示的な型定義を推奨
- **any型**: 使用禁止（必要な場合は適切な型定義を使用）

### React

- **関数コンポーネント**: 推奨
- **Hooks**: useState、useEffect活用
- **Props型定義**: インターフェースで明示

### CSS

- **Tailwind CSS**: ユーティリティクラス使用
- **カスタムCSS**: 必要最小限（index.css）
- **カラーパレット**: オレンジ系（orange-50〜orange-700）

### ファイル命名

- **コンポーネント**: PascalCase（例: RecipeCard.tsx）
- **ユーティリティ**: camelCase（例: search.ts）
- **定数**: UPPER_SNAKE_CASE

## 環境変数

プロジェクトルートに`.env`ファイルを作成：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**注意**: `.env`ファイルは`.gitignore`に含まれているため、各開発者が個別に設定する必要があります。

## デプロイ

### Vercel / Netlify

1. リポジトリを連携
2. ビルドコマンド: `npm run build`
3. 公開ディレクトリ: `dist`
4. 環境変数を設定（VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY）

### Supabase設定

1. Supabaseプロジェクト作成
2. マイグレーションSQL実行
3. API URLとAnon Keyを環境変数に設定
4. RLSポリシーが適用されていることを確認

## 既知の制限事項

### セキュリティ

- **認証なし**: 誰でも編集・削除可能（公開プロトタイプとして設計）
- **本番環境への推奨事項**:
  - 認証機能の追加（Supabase Auth）
  - ユーザーごとのレシピ所有権管理
  - RLSポリシーの更新（ownerId制約）

### 機能

- **画像アップロード未実装**: レシピに画像を追加できない
- **カテゴリー機能未実装**: 料理のジャンル分類がない
- **評価・コメント機能未実装**: ユーザー間のインタラクションがない

### パフォーマンス

- **全件取得**: レシピ数が増えるとページングが必要
- **クライアント側検索**: 大量データでは検索パフォーマンスが低下

## トラブルシューティング

### Supabase接続エラー

```
Error: Invalid Supabase URL or Key
```

→ `.env`ファイルの環境変数を確認

### リアルタイム更新が動かない

→ SupabaseダッシュボードでRealtimeが有効化されているか確認

### ビルドエラー

```
Type error: ...
```

→ `npm run typecheck`で型エラーを確認・修正

### 材料検索が正しく動作しない

→ `src/lib/search.ts`の正規化関数を確認（全角・半角変換）

## 今後の拡張提案

### 短期

- [ ] レシピ画像アップロード機能
- [ ] カテゴリー・タグ機能
- [ ] お気に入り機能
- [ ] ページング実装

### 中期

- [ ] ユーザー認証（Supabase Auth）
- [ ] レシピ所有権管理
- [ ] 評価・レビュー機能
- [ ] 調理時間・難易度の追加

### 長期

- [ ] レコメンデーション機能
- [ ] 栄養情報表示
- [ ] ショッピングリスト生成
- [ ] ソーシャルシェア機能

## 参考リソース

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 貢献ガイドライン

1. **Issue作成**: バグ報告や機能要望はIssueで共有
2. **ブランチ戦略**: `feature/`, `bugfix/`, `hotfix/`プレフィックス使用
3. **コミットメッセージ**: 簡潔かつ明確に記述
4. **プルリクエスト**: 変更内容の説明を記載

## ライセンス

このプロジェクトはプライベートリポジトリです。

---

**最終更新**: 2026-04-03
**メンテナー**: @okamitaketoshi
