# Vercel デプロイガイド

このドキュメントでは、Recipe-ShareアプリケーションをVercelにデプロイする手順を説明します。

## 前提条件

- Vercelアカウントを持っていること
- GitHubリポジトリへのアクセス権があること
- Node.js と npm がインストールされていること

## 1. Vercel CLI のインストール

```bash
npm install -g vercel
```

## 2. Vercel へのログイン

```bash
vercel login
```

ブラウザが開き、認証プロセスが開始されます。指示に従ってログインしてください。

## 3. プロジェクトのデプロイ

プロジェクトルートディレクトリで以下のコマンドを実行します：

```bash
vercel
```

初回実行時、以下の質問に答えてください：

1. **Set up and deploy "~/dev/Recipe-Share"?** → `Y`
2. **Which scope do you want to deploy to?** → 自分のアカウントを選択
3. **Link to existing project?** → `N`
4. **What's your project's name?** → `recipe-share`（任意の名前）
5. **In which directory is your code located?** → `./`（Enterキーでデフォルト）
6. **Want to override the settings?** → `N`

これでプレビューデプロイが実行されます。

## 4. GitHubとの自動デプロイ連携

Vercelダッシュボードで以下の設定を行います：

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. デプロイしたプロジェクトを選択
3. **Settings** → **Git** セクションを開く
4. GitHubリポジトリと連携（既に連携済みの場合はスキップ）
5. **Production Branch** を `main` に設定

これで、`main`ブランチへのpush時に自動的に本番デプロイが実行されます。

## 5. 本番環境へのデプロイ

プレビュー確認後、本番環境にデプロイします：

```bash
vercel --prod
```

または、`main`ブランチにpushすることで自動的に本番デプロイされます：

```bash
git push origin main
```

## 6. デプロイ確認

デプロイが完了すると、以下のようなURLが発行されます：

- **本番環境**: `https://recipe-share.vercel.app`（プロジェクト名による）
- **プレビュー環境**: `https://recipe-share-xxx.vercel.app`（ブランチごとに生成）

ブラウザでURLにアクセスし、アプリケーションが正常に動作することを確認してください。

## 7. ビルド設定の確認

Vercelは自動的に以下の設定を検出します：

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

カスタマイズが必要な場合は、Vercelダッシュボードの **Settings** → **Build & Development Settings** で変更できます。

## トラブルシューティング

### ビルドエラーが発生する

1. ローカルで `npm run build` を実行してエラーを確認
2. Vercelダッシュボードの **Deployments** でビルドログを確認
3. 必要に応じて環境変数を設定（次のステップで実施）

### 404エラーが発生する

- `vercel.json` が正しく配置されているか確認
- SPAルーティング設定が有効になっているか確認

### 環境変数が読み込まれない

- 環境変数設定は Issue #34 で実施します
- Vercelダッシュボードで環境変数を設定してください

## 次のステップ

- Issue #34: 環境変数の設定とSupabase接続確認
- Issue #35: デプロイ後の動作確認
- Issue #36: ドキュメント更新

## 参考リンク

- [Vercel 公式ドキュメント](https://vercel.com/docs)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html#vercel)
