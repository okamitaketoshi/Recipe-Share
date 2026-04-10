# Git Flow戦略ガイド

このドキュメントは、Recipe-ShareプロジェクトにおけるGit Flow運用の詳細ガイドです。

## 🎉 Vercel Preview環境について

このプロジェクトはVercelを使用しており、**すべてのPR作成時に自動的にPreview環境が生成されます**。

**Preview環境の動作**:
- ✅ すべてのPRで自動的にPreview環境が生成される
- ✅ マージ先ブランチに関係なく動作する
- ✅ PRごとに独立したURLが発行される

**対応方針**:
| ブランチ種別 | マージ先 | Preview環境 | 動作確認方法 |
|------------|---------|------------|------------|
| `feature/*` | `develop` | ✅ あり | Vercel Preview環境で動作確認 |
| `bugfix/*` | `develop` | ✅ あり | Vercel Preview環境で動作確認 |
| `release/*` | `main` | ✅ あり | Vercel Preview環境で最終確認 |
| `hotfix/*` | `main` | ✅ あり | Vercel Preview環境で確認 |

**重要**: PR作成後、Vercel Preview環境のURLが自動的にPRコメントに追加されます。Preview環境で十分な動作確認を実施してからマージしてください。

---

## 🌊 ブランチ戦略の全体像

```
main（本番環境 - Vercel Production）
  │
  ├─ hotfix/vX.Y.Z-description（緊急修正）
  │    └─ → main & develop へマージ
  │
  └─ develop（開発統合 - Vercel Preview）
       │
       ├─ feature/issue-XX-description（機能開発）
       ├─ bugfix/issue-XX-description（バグ修正）
       │
       └─ release/vX.Y.Z（リリース準備）
            └─ → main & develop へマージ
```

---

## 📋 各ブランチの役割

### 1. `main`ブランチ（本番環境）

**役割**: 本番環境にデプロイされている安定版コード

**運用ルール**:
- ✅ `release/*`または`hotfix/*`からのみマージ可能
- ❌ 直接コミット禁止
- ❌ `feature/*`や`bugfix/*`から直接マージ禁止
- ✅ マージ時に必ずバージョンタグを付与（例: `v1.0.0`）

**Vercel連携**: `main`ブランチへのpush → Production環境に自動デプロイ

---

### 2. `develop`ブランチ（開発統合）

**役割**: 次のリリースに向けた開発統合ブランチ

**運用ルール**:
- ✅ `feature/*`, `bugfix/*`, `release/*`, `hotfix/*`からマージ
- ❌ 直接コミット禁止（軽微な修正を除く）
- ✅ 常に動作可能な状態を維持
- ✅ マージ前に必ずpre-commitチェック

**Vercel連携**: 
- ✅ **PR作成時に自動的にPreview環境が生成される**
- ✅ Preview URLはPRコメントに自動的に追加される
- ✅ Preview環境で動作確認を実施してからマージ

---

### 3. `feature/*`ブランチ（機能開発）

**命名規則**: `feature/issue-XX-short-description`

**例**: 
- `feature/issue-42-recipe-image-upload`
- `feature/issue-45-category-system`

**ライフサイクル**:
```bash
develop → feature/issue-XX → PR → develop
```

**運用ルール**:
- ✅ `develop`から分岐
- ✅ 開発完了後、`develop`へマージ
- ❌ `main`へ直接マージ禁止
- ✅ PR作成時にissue番号を紐付け（`Closes #XX`）

---

### 4. `bugfix/*`ブランチ（バグ修正）

**命名規則**: `bugfix/issue-XX-short-description`

**例**: 
- `bugfix/issue-15-search-crash`
- `bugfix/issue-20-layout-issue`

**ライフサイクル**:
```bash
develop → bugfix/issue-XX → PR → develop
```

**運用ルール**:
- ✅ `develop`から分岐
- ✅ 修正完了後、`develop`へマージ
- ❌ `main`へ直接マージ禁止

---

### 5. `release/*`ブランチ（リリース準備）

**命名規則**: `release/vX.Y.Z`

**例**: 
- `release/v1.0.0`
- `release/v1.1.0`

**ライフサイクル**:
```bash
develop → release/vX.Y.Z → main（タグ付け） & develop
```

**運用ルール**:
- ✅ `develop`から分岐
- ✅ リリース準備完了後、`main`と`develop`の両方にマージ
- ✅ マージ後、`main`にバージョンタグを付与
- ⚠️ 新機能追加禁止（バグ修正・バージョン更新のみ）

**許可される作業**:
- バージョン番号の更新（`package.json`）
- CHANGELOG.mdの作成・更新
- 軽微なバグ修正
- ドキュメントの最終調整

---

### 6. `hotfix/*`ブランチ（緊急修正）

**命名規則**: `hotfix/vX.Y.Z-short-description`

**例**: 
- `hotfix/v1.0.1-security-fix`
- `hotfix/v1.2.1-critical-bug`

**ライフサイクル**:
```bash
main → hotfix/vX.Y.Z → main（タグ付け） & develop
```

**運用ルール**:
- ✅ `main`から分岐
- ✅ 修正完了後、`main`と`develop`の両方にマージ
- ✅ マージ後、`main`に新しいバージョンタグを付与
- ⚠️ 必要最小限の修正のみ

**対象**:
- 本番環境で発見された重大なバグ
- セキュリティ脆弱性
- データ損失の危険性があるバグ

---

## 🔄 具体的なワークフロー

### 📝 1. 新機能開発（Feature）

```bash
# 1. developから最新を取得
git checkout develop
git pull origin develop

# 2. featureブランチ作成
git checkout -b feature/issue-42-recipe-image-upload

# 3. 開発作業
# （コード編集、テスト作成）

# 4. ローカル環境で動作確認
npm run dev
# http://localhost:5173 で基本的な動作を確認

# 5. Supabase Previewトリガー + pre-commitチェック
mise run supabase:trigger-preview
mise run pre-commit:check

# 6. コミット作成
git add .
git commit -m "$(cat <<'EOF'
✨ レシピ画像アップロード機能を実装

- Supabase Storageを使用した画像アップロード
- 画像プレビュー表示機能
- RecipeFormコンポーネントに画像選択UIを追加

Closes #42

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 7. リモートにプッシュ
git push -u origin feature/issue-42-recipe-image-upload

# 8. PR作成（developへマージ）
gh pr create \
  --base develop \
  --title "✨ レシピ画像アップロード機能 (#42)" \
  --body "$(cat <<'EOF'
## 概要
レシピに画像をアップロードできる機能を実装しました。

## 変更内容
- Supabase Storageを使用した画像アップロード機能
- 画像プレビュー表示
- RecipeFormコンポーネントの拡張

## 関連Issue
Closes #42

## ローカル動作確認
- [x] `npm run dev`で基本動作確認済み
- [x] 画像アップロード機能が正常に動作
- [x] 既存機能にデグレなし

## Vercel Preview確認
- [ ] PR作成後、Vercel Preview環境で最終確認
- [ ] 画像アップロード機能の動作確認
- [ ] 既存機能のデグレチェック

## テスト方法
1. レシピ作成画面で画像を選択
2. プレビューが表示されることを確認
3. レシピ保存後、画像が表示されることを確認

✅ **Vercel Preview環境**: PR作成時に自動生成されます。Preview URLで最終動作確認を実施してください。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 9. PR作成後、Vercel Preview環境で最終確認
# ✅ PR作成時に自動的にVercel Preview環境が生成される
# ✅ Preview URLで最終動作確認を実施

# 10. レビュー完了後、developへマージ

# 10. マージ完了後、ローカルブランチ削除
git checkout develop
git pull origin develop
git branch -d feature/issue-42-recipe-image-upload
```

---

### 🐛 2. バグ修正（Bugfix）

```bash
# 1. developから分岐
git checkout develop
git pull origin develop
git checkout -b bugfix/issue-15-search-crash

# 2. バグ修正 + テスト追加
# （コード修正）

# 3. ローカル環境で動作確認
npm run dev
# バグが修正されていることを確認

# 4. pre-commitチェック
mise run supabase:trigger-preview
mise run pre-commit:check

# 5. コミット
git add .
git commit -m "$(cat <<'EOF'
🐛 材料検索時のクラッシュを修正

- 空文字列入力時のnullチェックを追加
- search.tsのnormalizeString関数を改善

Fixes #15

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 6. PR作成（developへマージ）
git push -u origin bugfix/issue-15-search-crash
gh pr create \
  --base develop \
  --title "🐛 材料検索時のクラッシュを修正 (#15)" \
  --body "$(cat <<'EOF'
Fixes #15

## ローカル動作確認
- [x] `npm run dev`で修正を確認済み
- [x] クラッシュが発生しないことを確認
- [x] 既存機能にデグレなし

## Vercel Preview確認
- [ ] PR作成後、Vercel Preview環境で最終確認

✅ **Vercel Preview環境**: PR作成時に自動生成されます。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 7. PR作成後、Vercel Preview環境で最終確認
# ✅ PR作成時に自動的にVercel Preview環境が生成される

# 8. マージ完了後、ローカルブランチ削除
git checkout develop
git pull origin develop
git branch -d bugfix/issue-15-search-crash
```

---

### 🏷️ 3. リリース準備（Release）

```bash
# 1. developから最新を取得
git checkout develop
git pull origin develop

# 2. releaseブランチ作成
git checkout -b release/v1.1.0

# 3. バージョン番号を更新
# package.jsonの"version"を"1.1.0"に変更

# 4. CHANGELOG.mdを更新
cat >> CHANGELOG.md <<EOF

## [1.1.0] - $(date +%Y-%m-%d)

### Added
- レシピ画像アップロード機能 (#42)
- カテゴリー検索機能 (#45)

### Fixed
- 材料検索時のクラッシュを修正 (#15)

### Changed
- 検索UIのレスポンシブ対応を改善
EOF

# 5. pre-commitチェック
mise run supabase:trigger-preview
mise run pre-commit:check

# 6. コミット作成
git add package.json CHANGELOG.md
git commit -m "$(cat <<'EOF'
🚀 Release v1.1.0 準備

- バージョン番号を1.1.0に更新
- CHANGELOG.mdを更新

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 7. リモートにプッシュ
git push -u origin release/v1.1.0

# 8. PR作成（mainへマージ）
gh pr create \
  --base main \
  --title "🚀 Release v1.1.0" \
  --body "$(cat <<'EOF'
## リリース内容

### 新機能
- ✨ レシピ画像アップロード機能 (#42)
- ✨ カテゴリー検索機能 (#45)

### バグ修正
- 🐛 材料検索時のクラッシュを修正 (#15)

### 改善
- ♻️ 検索UIのレスポンシブ対応を改善

## テスト状況
- [ ] Vercel Preview環境での最終動作確認（PR作成後に実施）
- [ ] 画像アップロード機能の動作確認
- [ ] カテゴリー検索の動作確認
- [ ] 既存機能のデグレチェック
- [ ] モバイル表示の確認

## デプロイ先
- Production: https://recipe-share-two.vercel.app
- Preview: （PR作成後に自動生成されるURLで確認）

✅ **Vercel Preview環境**: PR作成時に自動生成されます。Preview URLで本番デプロイ前の最終確認を実施してください。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 9. PR作成後、Vercel Preview環境URLで最終確認
# ✅ この時点でVercel Preview環境が自動生成される
# ✅ Preview URLで本番デプロイ前の最終動作確認を実施
# ✅ 問題があればreleaseブランチで修正 → 再度Previewで確認

# 10. レビュー + マージ完了後、mainにタグ付け
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# 11. developにもマージバック
git checkout develop
git merge main
git push origin develop

# 12. releaseブランチ削除
git branch -d release/v1.1.0
git push origin --delete release/v1.1.0
```

---

### 🚨 4. 緊急修正（Hotfix）

```bash
# 1. mainから分岐
git checkout main
git pull origin main
git checkout -b hotfix/v1.0.1-security-fix

# 2. 緊急修正
# （セキュリティ脆弱性の修正）

# 3. pre-commitチェック
mise run supabase:trigger-preview
mise run pre-commit:check

# 4. コミット
git add .
git commit -m "$(cat <<'EOF'
🚨 [HOTFIX] XSS脆弱性を修正

- RecipeCardコンポーネントのHTML出力をサニタイズ
- dangerouslySetInnerHTMLを削除

Security: CVE-XXXX-XXXXX

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 5. リモートにプッシュ
git push -u origin hotfix/v1.0.1-security-fix

# 6. PR作成（mainへマージ）
gh pr create \
  --base main \
  --title "🚨 [HOTFIX] v1.0.1 セキュリティ脆弱性修正" \
  --label "urgent,security" \
  --body "$(cat <<'EOF'
## 緊急修正内容
XSS脆弱性を修正しました。

## 影響範囲
- RecipeCardコンポーネント

## 対応内容
- HTML出力のサニタイズ処理を追加
- dangerouslySetInnerHTMLの使用を削除

## セキュリティ情報
Security: CVE-XXXX-XXXXX

## 動作確認
- [ ] Vercel Preview環境で修正内容を確認（PR作成後）
- [ ] 脆弱性が修正されていることを確認
- [ ] 既存機能にデグレなし

✅ **Vercel Preview環境**: mainへのPR作成時に自動生成されます。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 7. PR作成後、Vercel Preview環境で修正内容を確認
# ✅ Vercel Preview環境が自動生成される
# ✅ 脆弱性が修正されていることを確認

# 8. マージ後、mainにタグ付け
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Hotfix v1.0.1 - Security fix"
git push origin v1.0.1

# 9. developにもマージバック
git checkout develop
git merge main
git push origin develop

# 10. hotfixブランチ削除
git branch -d hotfix/v1.0.1-security-fix
git push origin --delete hotfix/v1.0.1-security-fix
```

---

## 📊 バージョニング規則（Semantic Versioning）

```
vMAJOR.MINOR.PATCH
例: v1.2.3
```

| バージョン | 更新タイミング | 例 |
|-----------|--------------|-----|
| **MAJOR** | 破壊的変更 | v1.0.0 → v2.0.0 |
| **MINOR** | 新機能追加（後方互換性あり） | v1.0.0 → v1.1.0 |
| **PATCH** | バグ修正（hotfix） | v1.0.0 → v1.0.1 |

**例**:
- `v1.0.0`: 初回リリース
- `v1.1.0`: 画像アップロード機能追加（feature）
- `v1.0.1`: セキュリティ修正（hotfix）
- `v2.0.0`: 認証機能追加で既存APIが破壊的変更

---

## 🛠️ Git Flow初期セットアップ

### 1. developブランチの作成

```bash
# mainから現在の状態をdevelopブランチとして作成
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### 2. GitHub Branch Protection設定

**mainブランチの保護**:
- Settings → Branches → Add branch protection rule
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals (1人以上)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

**developブランチの保護**:
- Branch name pattern: `develop`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging

### 3. Vercel環境設定

**現在の設定**:
- Production Branch: `main`
- Preview環境: すべてのPR作成時に自動生成

**デプロイフロー**:
- `main`へのpush → **Production環境に自動デプロイ**
- すべてのPR作成 → **Preview環境が自動生成**
  - `feature/*` → `develop` のPR → Preview環境で動作確認
  - `bugfix/*` → `develop` のPR → Preview環境で動作確認
  - `release/*` → `main` のPR → Preview環境で最終確認（本番デプロイ前）
  - `hotfix/*` → `main` のPR → Preview環境で確認

**重要**: すべてのPRで自動的にVercel Preview環境が生成されます。PR作成後、Preview URLで十分な動作確認を実施してからマージしてください。

---

## 📐 ベストプラクティス

### ✅ Do（推奨）

1. **developから最新を取得してからブランチ作成**
   ```bash
   git checkout develop && git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **feature/bugfixは小さく保つ**
   - 1ブランチ = 1機能または1バグ修正
   - 大きな機能は複数のfeatureブランチに分割

3. **releaseブランチでは新機能追加禁止**
   - バージョン更新、CHANGELOG作成、軽微なバグ修正のみ

4. **hotfixは必要最小限**
   - 緊急性の高いバグのみ
   - 修正後は必ずdevelopにもマージバック

5. **マージ後はブランチ削除**
   ```bash
   git branch -d feature/old-feature
   git push origin --delete feature/old-feature
   ```

6. **ローカル環境で基本動作確認**
   ```bash
   npm run dev
   # http://localhost:5173 で基本的な動作確認を実施
   ```
   - ✅ PR作成前にローカルで基本動作を確認
   - ✅ 明らかなバグがないことを確認

7. **コミット前に必ずpre-commitチェック**
   ```bash
   mise run supabase:trigger-preview
   mise run pre-commit:check
   ```

8. **PR作成後、Vercel Preview環境で最終確認**
   - ✅ すべてのPRでPreview環境が自動生成される
   - ✅ Preview URLで十分な動作確認を実施してからマージ
   - ✅ 特にreleaseブランチは本番デプロイ前の最終確認として重要

9. **コミットメッセージに絵文字プレフィックス**
   - ✨ feat: 新機能
   - 🐛 fix: バグ修正
   - 📝 docs: ドキュメント
   - ♻️ refactor: リファクタリング
   - ✅ test: テスト追加
   - 🔧 chore: 環境・ツール
   - 🚀 release: リリース
   - 🚨 hotfix: 緊急修正

10. **PRには必ずissue番号を紐付け**
   ```
   Closes #42
   Fixes #15
   Related to #30
   ```

### ❌ Don't（非推奨）

1. **mainやdevelopで直接コミット禁止**
2. **featureからmainへ直接マージ禁止**
3. **releaseブランチで大きな機能追加禁止**
4. **hotfix後のdevelopマージバックを忘れない**
5. **pre-commitチェックをスキップしない**（`--no-verify` 禁止）
6. **長期間（1週間以上）マージしないブランチを作らない**
7. **PRなしで直接mainにマージしない**
8. **コミットメッセージを曖昧にしない**（❌ "fix", "update" のみ）

---

## 🔄 よくある質問（FAQ）

### Q1. featureブランチが長期化した場合は？

**A**: developの最新を定期的にマージしてください。

```bash
git checkout feature/long-running-feature
git merge develop
# コンフリクト解決
git push
```

### Q2. releaseブランチで重大なバグが見つかった場合は？

**A**: releaseブランチ上で修正してコミットしてください。release完了時に自動的にdevelopにもマージされます。

### Q3. hotfixとbugfixの使い分けは？

**A**:
- **hotfix**: 本番環境（main）で発見された緊急性の高いバグ → mainから分岐
- **bugfix**: 開発環境（develop）で発見されたバグ → developから分岐

### Q4. developとmainが大きく乖離した場合は？

**A**: releaseブランチを作成してリリースプロセスを進めてください。定期的なリリースサイクルを設定することで乖離を防げます。

### Q5. PRを作成する前に、Vercel Preview環境で確認したい場合は？

**A**: draft PRを作成してください。

```bash
# 作業ブランチから draft PR を作成
gh pr create --base develop --title "[DRAFT] 動作確認中" --draft

# → Vercel Preview環境が自動生成される
# Preview URLで動作確認

# 確認完了後、draft を解除してレビュー依頼
gh pr ready
```

✅ **メリット**: 
- PR作成と同時にPreview環境が生成される
- draft状態なのでレビュワーに通知されない
- 動作確認完了後、そのままレビュー依頼に移行できる

---

## 📚 参考リソース

- [Git Flow原文（Vincent Driessen）](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**最終更新**: 2026-04-10
**メンテナー**: @okamitaketoshi
