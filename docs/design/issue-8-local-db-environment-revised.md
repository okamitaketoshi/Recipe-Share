# Issue#8: ローカル開発環境用のDockerベースDB環境構築 - 設計書（修正版）

**作成日**: 2026-04-04  
**修正日**: 2026-04-04  
**Issue**: #8  
**優先度**: Medium  
**見積もり**: 4-8h

---

## 📋 概要

ローカル開発時にSupabaseの本番/ステージング環境に直接接続している状況を改善し、Supabase CLIによるローカル開発用DB環境を構築する。

### 修正理由

初期設計では「単純なPostgreSQLコンテナ」を採用していましたが、以下の問題が発覚：
- アプリケーションが `@supabase/supabase-js` クライアントを使用している
- SupabaseクライアントはSupabaseエンドポイント（http://localhost:54321）に接続する必要がある
- 単純なPostgreSQLコンテナ（ポート5432）では接続できない

**結論**: Supabaseクライアントを使用しているアプリケーションでは、最初から**Supabase CLI**を使う必要がある。

---

## 🎯 修正後の設計方針

### 採用する構成

1. **ローカルDB環境**: Supabase CLI（完全なローカルSupabase環境）
2. **マイグレーション管理**: Supabase CLI（既存の `supabase/migrations/*.sql` を活用）
3. **環境変数切り替え**: `.env.local` 優先（Viteの標準動作、コード変更不要）

### Supabase CLIの特徴

- **PostgreSQL**: ローカルPostgreSQLデータベース
- **PostgREST**: RESTful API自動生成
- **GoTrue**: Auth機能（将来的に使用可能）
- **Storage**: ファイルストレージ（将来的に使用可能）
- **Realtime**: リアルタイム機能（既にApp.tsxで使用中）
- **Supabase Studio**: ブラウザベースのDB管理UI

### エンドポイント

- **Supabase API**: http://localhost:54321
- **Supabase Studio**: http://localhost:54323
- **PostgreSQL**: localhost:5432（直接接続用）

---

## ✅ 実装タスク

### Phase 1: Supabase CLI環境構築

#### 1.1 既存の不要ファイル削除

- `docker-compose.yml` 削除
- `docker/postgres/` ディレクトリ削除

#### 1.2 Supabase CLIインストール（ユーザー側で実施）

```bash
# Homebrewでインストール
brew install supabase/tap/supabase

# またはnpx経由で使用（インストール不要）
npx supabase --version
```

#### 1.3 Supabase プロジェクト初期化

```bash
npx supabase init
```

実行すると、以下のディレクトリ・ファイルが作成される：
- `supabase/config.toml` - Supabase設定ファイル
- `supabase/seed.sql` - シードデータ（任意）

**注意**: `supabase/migrations/` は既に存在するので、そのまま活用。

#### 1.4 既存マイグレーションの確認

既存のマイグレーションファイル（4件）をSupabase CLIが認識するか確認：
```bash
npx supabase db diff --use-migra
```

### Phase 2: 環境変数の確認

#### 2.1 `.env.local` の確認

既に `.env.local` が存在し、正しい値が設定されているはず：
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recipe_share
```

**重要**: この `VITE_SUPABASE_ANON_KEY` はSupabase CLIのデフォルト値なので、そのまま使用可能。

#### 2.2 `.env.local.example` の更新

コメントを更新して、Supabase CLI使用前提であることを明記。

### Phase 3: mise task更新

`mise.toml` のDB関連タスクを更新：

```toml
[tasks."db:start"]
description = "ローカルSupabase環境起動"
run = "npx supabase start"

[tasks."db:stop"]
description = "ローカルSupabase環境停止"
run = "npx supabase stop"

[tasks."db:status"]
description = "ローカルSupabase環境の状態確認"
run = "npx supabase status"

[tasks."db:reset"]
description = "ローカルDBリセット（データ削除 + マイグレーション再適用）"
run = "npx supabase db reset"

[tasks."db:psql"]
description = "ローカルDBに接続（psqlシェル起動）"
run = "npx supabase db shell"

[tasks."db:studio"]
description = "Supabase Studio起動（ブラウザベースのDB管理UI）"
run = "open http://localhost:54323"
```

**変更点**:
- `docker compose` → `npx supabase` コマンドに変更
- `db:up` → `db:start`, `db:down` → `db:stop` に名称変更
- `db:status`, `db:studio` タスク追加

### Phase 4: ドキュメント整備

`README.md` の「ローカル開発環境（Docker）」セクションを更新：

#### 更新内容

```markdown
## 🐳 ローカル開発環境（Supabase CLI）

### セットアップ手順

#### 1. Supabase CLIインストール

**Homebrewでインストール（推奨）**:
\`\`\`bash
brew install supabase/tap/supabase
\`\`\`

**またはnpx経由で使用（インストール不要）**:
\`\`\`bash
npx supabase --version
\`\`\`

#### 2. ローカルDB環境設定

\`.env.local.example\` をコピーして \`.env.local\` を作成：
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

#### 3. Supabaseローカル環境起動

\`\`\`bash
mise run db:start
# または
npx supabase start
\`\`\`

**初回起動時の注意**:
- Dockerイメージのダウンロードに数分かかります
- PostgreSQL, PostgREST, GoTrue, Storage, Realtime などのコンテナが起動します

起動完了後、以下のエンドポイントが利用可能になります：
- **Supabase API**: http://localhost:54321
- **Supabase Studio**: http://localhost:54323（ブラウザベースのDB管理UI）
- **PostgreSQL**: localhost:5432

#### 4. DB接続確認

\`\`\`bash
mise run db:psql
# または
npx supabase db shell
\`\`\`

psqlシェルが起動したら \`\\dt\` でテーブル一覧を確認。

#### 5. 開発サーバー起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで http://localhost:5173 にアクセスし、レシピCRUD機能が動作するか確認。

### DB管理コマンド

| コマンド               | 説明                                     |
| ---------------------- | ---------------------------------------- |
| \`mise run db:start\`  | ローカルSupabase環境起動                 |
| \`mise run db:stop\`   | ローカルSupabase環境停止                 |
| \`mise run db:status\` | 環境の状態確認（エンドポイントURL表示）  |
| \`mise run db:reset\`  | データ削除 + マイグレーション再適用      |
| \`mise run db:psql\`   | psqlシェル起動（DB接続確認）            |
| \`mise run db:studio\` | Supabase Studio起動（ブラウザで管理UI） |

### Supabase Studioの使い方

http://localhost:54323 にアクセスすると、ブラウザベースのDB管理UIが開きます。

**できること**:
- テーブル構造の確認・編集
- データの閲覧・追加・更新・削除
- SQLクエリの実行
- RLSポリシーの管理
- マイグレーション履歴の確認

### 環境切り替え

- **ローカルDB使用**: \`.env.local\` が存在する状態
- **Supabase本番使用**: \`.env.local\` を削除または \`.env.local.backup\` にリネーム

### トラブルシューティング

#### ポート競合エラー

\`\`\`bash
# 既存のプロセスを確認
lsof -i :54321
lsof -i :5432

# Supabase環境を停止
mise run db:stop

# Dockerコンテナを確認
docker ps
\`\`\`

#### マイグレーションが適用されていない

\`\`\`bash
# DBをリセットして再起動
mise run db:reset

# ステータス確認
mise run db:status
\`\`\`

#### Docker Desktopが起動していない

Supabase CLIはDockerを使用するため、Docker Desktopが起動している必要があります。

\`\`\`bash
# Dockerが起動しているか確認
docker ps
\`\`\`
\`\`\`

### Phase 5: 動作確認

実装完了後、以下を確認：

1. **Supabase環境起動確認**
   ```bash
   mise run db:start
   mise run db:status
   ```

2. **DB接続確認**
   ```bash
   mise run db:psql
   ```
   
   psqlシェルで以下を実行：
   ```sql
   \dt  -- テーブル一覧確認（recipesテーブルが存在するか）
   \d recipes  -- recipesテーブルの構造確認
   SELECT * FROM recipes;  -- データ確認（初期は空）
   ```

3. **Supabase Studio確認**
   ```bash
   mise run db:studio
   # または直接アクセス: http://localhost:54323
   ```

4. **アプリケーション起動確認**
   ```bash
   npm run dev
   ```
   
   ブラウザで http://localhost:5173 にアクセスし、レシピCRUD機能が動作するか確認。

---

## 📊 構成の比較

| 項目                   | 単純なPostgreSQLコンテナ（旧） | Supabase CLI（新）           |
| ---------------------- | ------------------------------ | ---------------------------- |
| PostgreSQL             | ✅                             | ✅                           |
| Supabaseエンドポイント | ❌                             | ✅                           |
| Supabaseクライアント   | ❌                             | ✅                           |
| Realtime機能           | ❌                             | ✅                           |
| Auth機能               | ❌                             | ✅（将来的に使用可能）       |
| Storage機能            | ❌                             | ✅（将来的に使用可能）       |
| Supabase Studio        | ❌                             | ✅                           |
| セットアップの簡単さ   | 🟢 シンプル                    | 🟡 やや複雑（CLIインストール必要） |
| リソース消費           | 🟢 小                          | 🟡 中（複数コンテナ起動）   |
| 本番環境との互換性     | ❌                             | ✅                           |

---

## ✅ 受け入れ条件

- [ ] `mise run db:start` でローカルSupabase環境が起動する
- [ ] `.env.local` の切り替えでローカルDB/Supabase本番を選択できる
- [ ] 既存マイグレーションがローカルDBに適用されている
- [ ] 既存機能（レシピCRUD）がローカルDBで動作する
- [ ] 既存機能にデグレがない
- [ ] `README.md` にセットアップ手順が記載されている
- [ ] Supabase Studioでテーブル確認ができる

---

## 🔗 参考資料

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Vite環境変数](https://vite.dev/guide/env-and-mode.html)
