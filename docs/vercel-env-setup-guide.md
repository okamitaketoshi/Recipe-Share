# Vercel 環境変数設定ガイド

このドキュメントでは、Vercel CLI を使用して環境変数を設定する手順を説明します。

## 前提条件

- Vercelアカウントにログイン済みであること（`vercel login`が完了していること）
- プロジェクトがVercelにデプロイ済みであること
- Supabaseプロジェクトが作成済みで、URLとAnon Keyを取得済みであること

## 1. Supabase認証情報の取得

Supabase認証情報がまだない場合は、以下の手順で取得してください：

1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. プロジェクトを選択
3. **Settings** → **API** を開く
4. 以下の情報をコピー：
   - **Project URL** (`VITE_SUPABASE_URL`に使用)
   - **anon public** key (`VITE_SUPABASE_ANON_KEY`に使用)

## 2. Vercel環境変数の設定（CLI）

プロジェクトルートディレクトリで以下のコマンドを実行します。

### 2.1. VITE_SUPABASE_URL の設定

```bash
vercel env add VITE_SUPABASE_URL
```

実行後、以下の質問に答えてください：

1. **What's the value of VITE_SUPABASE_URL?**  
   → SupabaseのProject URLを入力（例: `https://xxxxx.supabase.co`）

2. **Add VITE_SUPABASE_URL to which Environments?**  
   → `Production`, `Preview`, `Development` すべてを選択（スペースキーで選択、Enterで確定）

### 2.2. VITE_SUPABASE_ANON_KEY の設定

```bash
vercel env add VITE_SUPABASE_ANON_KEY
```

実行後、以下の質問に答えてください：

1. **What's the value of VITE_SUPABASE_ANON_KEY?**  
   → Supabaseのanon public keyを入力（長い文字列）

2. **Add VITE_SUPABASE_ANON_KEY to which Environments?**  
   → `Production`, `Preview`, `Development` すべてを選択

## 3. 設定確認

環境変数が正しく設定されたか確認します。

```bash
vercel env ls
```

以下のように表示されればOKです：

```
Environment Variables (2)
┌────────────────────────────┬─────────────┬─────────┬─────────────┐
│ Name                       │ Value       │ Env     │ Created     │
├────────────────────────────┼─────────────┼─────────┼─────────────┤
│ VITE_SUPABASE_URL          │ https://... │ All     │ 1 min ago   │
│ VITE_SUPABASE_ANON_KEY     │ eyJh...     │ All     │ 1 min ago   │
└────────────────────────────┴─────────────┴─────────┴─────────────┘
```

## 4. 再デプロイ

環境変数を設定した後、アプリケーションを再デプロイする必要があります。

### 方法1: GitHubにpush（自動デプロイ）

```bash
# 環境変数設定完了後、何か変更をコミットしてpush
git commit --allow-empty -m "chore: トリガー再デプロイ（環境変数設定後）"
git push origin main
```

### 方法2: Vercel CLIで手動デプロイ

```bash
# 本番環境に再デプロイ
vercel --prod
```

## 5. 動作確認

再デプロイが完了したら、以下の手順で動作確認してください：

1. Vercelデプロイ完了URLにアクセス
2. レシピ一覧ページが表示されることを確認
3. ブラウザの開発者ツール（Console）でエラーが出ていないことを確認

詳細なテスト手順は `docs/supabase-connection-test.md` を参照してください。

## トラブルシューティング

### 環境変数が反映されない

1. 再デプロイを実行したか確認
2. Vercelダッシュボードで環境変数が設定されているか確認
   - https://vercel.com/dashboard → プロジェクト選択 → Settings → Environment Variables

### ビルドエラーが発生する

1. 環境変数の値が正しいか確認（スペースや改行が入っていないか）
2. Supabase URLが正しいフォーマットか確認（`https://`で始まっているか）
3. Vercelビルドログでエラー内容を確認

### ローカルで動作しない

Vercelの環境変数はローカル開発環境には影響しません。  
ローカル開発には `.env.local` ファイルを使用してください：

```bash
# .env.local.exampleをコピー
cp .env.local.example .env.local

# ローカルSupabaseを起動
npx supabase start

# アプリケーション起動
npm run dev
```

## 補足: 環境変数の更新

既存の環境変数を更新する場合：

```bash
# 環境変数を削除
vercel env rm VITE_SUPABASE_URL

# 再度追加
vercel env add VITE_SUPABASE_URL
```

または、Vercelダッシュボードから直接編集することもできます。

## 参考リンク

- [Vercel Environment Variables 公式ドキュメント](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Vite 環境変数ガイド](https://vitejs.dev/guide/env-and-mode.html)
