# Supabase 接続テスト手順書

このドキュメントでは、VercelにデプロイしたアプリケーションとSupabaseの接続が正常に動作しているかを確認する手順を説明します。

## 前提条件

- Vercelに環境変数が設定済みであること（`docs/vercel-env-setup-guide.md`参照）
- アプリケーションがVercelにデプロイ済みであること
- Supabaseにテストデータが登録されていること

## 1. 基本的な接続確認

### 1.1. デプロイURLにアクセス

```
https://recipe-share.vercel.app （実際のURLに置き換えてください）
```

### 1.2. 初期表示の確認

アプリケーションが正常に読み込まれ、以下が表示されることを確認：

- ✅ ページタイトル: "Public Recipe Sharing App"
- ✅ ヘッダーが表示される
- ✅ レイアウトが正常に表示される
- ✅ JavaScriptエラーが発生していない

### 1.3. ブラウザ開発者ツールの確認

**Chrome/Edge/Firefox の場合:**

1. `F12` キーまたは右クリック → 「検証」を開く
2. **Console** タブを確認
3. 以下のエラーがないことを確認：
   - ❌ `Missing required environment variables`
   - ❌ `Failed to create Supabase client`
   - ❌ `Network error`

## 2. Supabase接続テスト

### 2.1. レシピ一覧表示の確認

1. トップページでレシピ一覧が表示されることを確認
2. レシピカードが正常に表示されることを確認
3. 以下の項目が表示されていること：
   - レシピタイトル
   - 材料リスト
   - 手順

**期待される動作:**
- Supabaseからレシピデータが取得され、画面に表示される

**エラー時の症状:**
- 「データがありません」のような空白表示
- Consoleに`Fetch error`や`401 Unauthorized`エラー

### 2.2. 材料検索機能の確認

1. 材料検索フォームに材料名を入力（例: "玉ねぎ"）
2. 検索ボタンをクリック
3. 該当するレシピが表示されることを確認

**期待される動作:**
- 入力した材料を含むレシピがフィルタリングされる
- 検索結果が即座に反映される

### 2.3. レシピ詳細表示の確認

1. レシピカードをクリック（または詳細ページに遷移）
2. レシピの詳細情報が表示されることを確認
3. 以下の項目が正しく表示されていること：
   - タイトル
   - 材料リスト（配列）
   - 調理手順
   - レシピURL（設定されている場合）

## 3. ネットワーク通信の確認

### 3.1. Network タブでAPIリクエストを確認

**Chrome/Edge/Firefox の場合:**

1. 開発者ツールの **Network** タブを開く
2. ページをリロード（`Ctrl + R` または `Cmd + R`）
3. Supabase APIへのリクエストを確認

**確認項目:**

| 項目 | 期待値 | 備考 |
|------|--------|------|
| Request URL | `https://xxxxx.supabase.co/rest/v1/recipes` | SupabaseエンドポイントであることRecipes |
| Status Code | `200 OK` | 正常なレスポンス |
| Response | JSON形式のレシピデータ | データが返されている |

**エラー例:**

- **401 Unauthorized**  
  → 環境変数`VITE_SUPABASE_ANON_KEY`が正しく設定されていない

- **404 Not Found**  
  → 環境変数`VITE_SUPABASE_URL`が正しくない、またはテーブルが存在しない

- **CORS Error**  
  → Supabase側のCORS設定確認（通常は自動設定されている）

### 3.2. リクエストヘッダーの確認

Networkタブで`recipes`リクエストを選択し、**Headers**タブを確認：

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... （Supabase Anon Key）
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

これらのヘッダーが正しく設定されていることを確認してください。

## 4. 環境別の確認

### 4.1. Production環境

- URL: `https://recipe-share.vercel.app`（実際のURLに置き換え）
- 確認: 上記すべてのテストを実施

### 4.2. Preview環境（プルリクエスト作成時）

1. GitHubでPRを作成
2. Vercelが自動生成したPreview URLにアクセス
3. 上記すべてのテストを実施

**Preview URLの例:**
```
https://recipe-share-git-feature-xxx.vercel.app
```

## 5. トラブルシューティング

### 環境変数が反映されない

**症状:**
- Consoleに`Missing required environment variables`エラー

**対処法:**
1. Vercelダッシュボードで環境変数が設定されているか確認
2. 環境変数設定後に再デプロイを実行
   ```bash
   git commit --allow-empty -m "chore: 再デプロイトリガー"
   git push origin main
   ```

### データが表示されない

**症状:**
- レシピ一覧が空白

**対処法:**
1. Supabaseダッシュボードで`recipes`テーブルにデータが存在するか確認
2. Supabase SQL Editorでクエリを実行して確認：
   ```sql
   SELECT * FROM recipes LIMIT 10;
   ```
3. データがない場合は、シードデータを投入：
   ```bash
   npx supabase db reset --local
   ```

### 接続エラー（Network Error）

**症状:**
- Consoleに`Failed to fetch`や`Network error`

**対処法:**
1. SupabaseプロジェクトがPausedになっていないか確認
2. Supabase URLが正しいか確認（`https://`で始まっているか）
3. ブラウザのネットワーク接続を確認

### 認証エラー（401 Unauthorized）

**症状:**
- API呼び出しで401エラー

**対処法:**
1. `VITE_SUPABASE_ANON_KEY`の値が正しいか確認
2. Supabaseダッシュボードで最新のAnon Keyを取得して再設定
3. 環境変数更新後、必ず再デプロイを実行

## 6. 接続確認チェックリスト

すべての項目が✅になることを確認してください：

- [ ] デプロイURLにアクセスできる
- [ ] ページが正常に表示される
- [ ] Consoleにエラーが表示されない
- [ ] レシピ一覧が表示される
- [ ] 材料検索が動作する
- [ ] Network タブでSupabase APIリクエストが成功（200 OK）
- [ ] リクエストヘッダーに`apikey`と`Authorization`が含まれている
- [ ] Production環境で動作する
- [ ] Preview環境で動作する（PRがある場合）

すべてのチェック項目が完了したら、Issue #34は完了です！

## 次のステップ

- Issue #35: Vercelデプロイ後の動作確認とトラブルシューティング
- Issue #36: ドキュメント更新

## 参考リンク

- [Supabase Client Library](https://supabase.com/docs/reference/javascript/introduction)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Chrome DevTools Network Tab](https://developer.chrome.com/docs/devtools/network/)
