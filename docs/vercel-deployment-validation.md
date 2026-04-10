# Vercel デプロイ後の動作確認ガイド

このドキュメントでは、Vercelにデプロイしたアプリケーションの動作確認手順とトラブルシューティング方法を説明します。

## 前提条件

- Vercelへのデプロイが完了していること
- 環境変数が設定されていること（Issue #34参照）
- Supabaseにテストデータが登録されていること

## デプロイURL

- **本番環境**: https://recipe-share-two.vercel.app
- **プレビュー環境**: PR作成時に自動生成

---

## 1. 基本動作確認

### 1.1. ページアクセス確認

1. ブラウザで本番URLにアクセス
   ```
   https://recipe-share-two.vercel.app
   ```

2. 以下の項目を確認：
   - [ ] ページが正常に読み込まれる
   - [ ] ページタイトル「Public Recipe Sharing App」が表示される
   - [ ] ヘッダーが表示される
   - [ ] レイアウトが崩れていない
   - [ ] 白紙ページやエラー画面が表示されない

### 1.2. 開発者ツールでエラー確認

**Chrome/Edge/Firefox:**

1. `F12` キーまたは右クリック → 「検証」
2. **Console** タブを開く
3. 以下のエラーがないことを確認：
   - ❌ `Missing required environment variables`
   - ❌ `Failed to create Supabase client`
   - ❌ `Uncaught Error`
   - ❌ `Failed to fetch`

**期待される状態:**
- ✅ エラーがない、または軽微な警告のみ
- ✅ Supabase接続が成功している

---

## 2. 機能別動作確認

### 2.1. レシピ一覧表示

**確認手順:**
1. トップページにアクセス
2. レシピカードが表示されることを確認

**確認項目:**
- [ ] レシピカードが表示される
- [ ] レシピタイトルが表示される
- [ ] 材料リストが表示される
- [ ] 調理手順が表示される
- [ ] レシピURLリンクが表示される（設定されている場合）

**期待される動作:**
- Supabaseからレシピデータが取得され、カード形式で表示される
- 複数のレシピが縦に並んで表示される

**トラブルシューティング:**
- レシピが表示されない → [3.1. データ取得エラー](#31-データ取得エラー)参照

### 2.2. 材料検索機能

**確認手順:**
1. 材料検索フォームに材料名を入力（例: "玉ねぎ"）
2. 検索ボタンをクリック

**確認項目:**
- [ ] 入力した材料を含むレシピがフィルタリングされる
- [ ] 検索結果が即座に反映される
- [ ] 検索結果が0件の場合、適切なメッセージが表示される

**期待される動作:**
- クライアント側で材料名によるフィルタリングが実行される
- 該当するレシピのみが表示される

### 2.3. レシピフォーム（該当する場合）

**確認手順:**
1. レシピ追加フォームにアクセス
2. レシピ情報を入力して送信

**確認項目:**
- [ ] フォームが表示される
- [ ] 入力検証が動作する
- [ ] 送信後、レシピが追加される
- [ ] 追加後、一覧ページに反映される

---

## 3. トラブルシューティング

### 3.1. データ取得エラー

**症状:**
- レシピ一覧が表示されない
- 「データがありません」と表示される

**原因と対処法:**

#### A. 環境変数未設定

**確認方法:**
```bash
vercel env ls
```

**対処法:**
```bash
# 環境変数を設定（Issue #34参照）
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 再デプロイ
vercel --prod
```

#### B. Supabaseデータが存在しない

**確認方法:**
1. Supabaseダッシュボードにアクセス
2. Table Editor → `recipes` テーブルを確認

**対処法:**
```bash
# ローカルでシードデータ投入（Issue #29参照）
npx supabase db reset --local
npx supabase db push
```

#### C. Supabaseプロジェクトが停止

**確認方法:**
- Supabaseダッシュボードでプロジェクトステータスを確認

**対処法:**
- プロジェクトを再開（Paused状態の場合）

### 3.2. 404エラー（SPAルーティング問題）

**症状:**
- ページリロード時に404エラーが発生
- 直接URLにアクセスすると404エラー

**原因:**
- `vercel.json`のSPAルーティング設定が不足

**対処法:**
1. `vercel.json`を確認：
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. 設定がない場合は追加してデプロイ

### 3.3. CORS エラー

**症状:**
- Console に `CORS policy` エラーが表示される

**原因:**
- Supabase側のCORS設定（通常は自動設定）

**対処法:**
1. Supabaseダッシュボード → Settings → API
2. CORS設定を確認
3. 必要に応じてVercel URLを許可リストに追加

### 3.4. 環境変数が反映されない

**症状:**
- 環境変数を設定したのに `Missing required environment variables` エラーが出る

**原因:**
- 環境変数設定後に再デプロイしていない

**対処法:**
```bash
# 再デプロイを強制実行
git commit --allow-empty -m "chore: 再デプロイトリガー"
git push origin main
```

または

```bash
vercel --prod
```

### 3.5. ビルドエラー

**症状:**
- Vercelデプロイ時にビルドが失敗する

**確認方法:**
- Vercelダッシュボード → Deployments → 該当デプロイのログを確認

**よくあるエラーと対処法:**

#### TypeScriptエラー
```bash
# ローカルで型チェック
npm run typecheck
```

#### Lintエラー
```bash
# ローカルでLint実行
npm run lint
```

#### 依存関係エラー
```bash
# package-lock.json を更新
npm install
git add package-lock.json
git commit -m "chore: 依存関係更新"
```

---

## 4. パフォーマンス確認

### 4.1. ページ読み込み速度

**確認手順:**
1. Chrome DevTools → **Network** タブを開く
2. ページをリロード（`Ctrl + R` または `Cmd + R`）
3. DOMContentLoaded、Load時間を確認

**期待値:**
- **DOMContentLoaded**: 1秒以内
- **Load**: 3秒以内

**改善方法（必要に応じて）:**
- 画像の最適化（WebP形式、遅延読み込み）
- 未使用のコードの削除
- コード分割の実装

### 4.2. API応答速度

**確認手順:**
1. Chrome DevTools → **Network** タブ
2. `recipes` APIリクエストを確認
3. Time列で応答時間を確認

**期待値:**
- **Supabase API応答**: 500ms以内

**改善方法（必要に応じて）:**
- Supabaseのインデックス設定
- クエリの最適化
- データキャッシュの実装

### 4.3. Lighthouse スコア確認

**確認手順:**
1. Chrome DevTools → **Lighthouse** タブ
2. Category: すべて選択
3. 「Analyze page load」をクリック

**目標スコア:**
- **Performance**: 80以上
- **Accessibility**: 90以上
- **Best Practices**: 90以上
- **SEO**: 80以上

---

## 5. モバイル表示確認

### 5.1. レスポンシブデザイン

**確認手順:**
1. Chrome DevTools → **Device Toolbar** (`Ctrl + Shift + M`)
2. デバイスを選択（iPhone 12 Pro, iPad等）
3. 表示を確認

**確認項目:**
- [ ] レイアウトが崩れていない
- [ ] テキストが読める大きさである
- [ ] ボタンが押しやすいサイズである
- [ ] 横スクロールが発生しない
- [ ] タッチ操作がスムーズである

### 5.2. 実機確認（推奨）

**確認デバイス:**
- iOS（iPhone）
- Android（Google Pixel等）
- タブレット（iPad等）

---

## 6. SEO設定確認

### 6.1. メタタグ確認

**確認手順:**
1. ページのソースを表示（`Ctrl + U`）
2. `<head>`タグ内を確認

**確認項目:**
- [ ] `<title>` タグが設定されている
- [ ] `<meta name="description">` が設定されている（推奨）
- [ ] OGP タグが設定されている（推奨）
- [ ] favicon が設定されている

**現在の状態:**
```html
<title>Public Recipe Sharing App</title>
```

**改善推奨:**
- meta description の追加
- OGP画像の設定（Issue #33で削除済み）
- Twitter Cardの設定

---

## 7. Vercelダッシュボード確認

### 7.1. デプロイステータス

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. プロジェクト「recipe-share」を選択
3. 以下を確認：
   - [ ] 最新デプロイが **Ready** ステータス
   - [ ] ビルドログにエラーがない
   - [ ] 環境変数が設定されている

### 7.2. アクセスログ確認

**確認手順:**
1. Vercelダッシュボード → プロジェクト選択
2. **Logs** タブを開く
3. エラーログがないか確認

**よくあるエラー:**
- `500 Internal Server Error` → サーバーサイドエラー
- `404 Not Found` → ルーティング設定ミス

---

## 8. 継続的監視（推奨）

### 8.1. Vercel Analytics（オプション）

**設定方法:**
1. Vercelダッシュボード → プロジェクト選択
2. **Analytics** タブ
3. 「Enable Analytics」をクリック

**確認項目:**
- ページビュー数
- パフォーマンススコア
- ユーザー行動

### 8.2. エラー監視ツール（検討）

**推奨ツール:**
- **Sentry**: エラー監視・トラッキング
- **LogRocket**: セッションリプレイ
- **Google Analytics**: アクセス解析

---

## 9. 動作確認チェックリスト

すべての項目が✅になることを確認してください：

### 基本動作
- [ ] ページが正常にアクセスできる
- [ ] Consoleにエラーが表示されない
- [ ] レシピ一覧が表示される
- [ ] 材料検索が動作する

### パフォーマンス
- [ ] ページ読み込みが3秒以内
- [ ] API応答が500ms以内
- [ ] Lighthouseスコアが目標値以上

### レスポンシブ
- [ ] モバイル表示が正常
- [ ] タブレット表示が正常
- [ ] レイアウトが崩れていない

### 環境別
- [ ] Production環境で動作する
- [ ] Preview環境で動作する（PRがある場合）

### その他
- [ ] SPAルーティングが正常に動作する
- [ ] 環境変数が正しく設定されている
- [ ] Supabase接続が正常

---

## 10. 問題発生時の対応フロー

```
問題発生
    ↓
1. Consoleでエラー確認
    ↓
2. Network タブでAPI確認
    ↓
3. Vercel ログ確認
    ↓
4. 環境変数確認
    ↓
5. Supabase 接続確認
    ↓
6. トラブルシューティング実施
    ↓
解決
```

---

## 次のステップ

すべての動作確認が完了したら：

- Issue #36: ドキュメント更新（README更新、デプロイURL追加等）
- 継続的改善（パフォーマンス最適化、SEO改善等）

## 参考リンク

- [Vercel Platform Documentation](https://vercel.com/docs)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Supabase Troubleshooting](https://supabase.com/docs/guides/platform/troubleshooting)
