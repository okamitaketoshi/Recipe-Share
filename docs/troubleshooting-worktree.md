# Git Worktreeトラブルシューティングガイド

このドキュメントは、Git Worktreeを使用した並行開発で発生する問題と対処法をまとめたものです。

## 🚨 よくある問題と対処法

### 問題1: developブランチで作業してしまった

**症状：**
- Worktreeを作成したはずなのに、developブランチでコミットしていた
- `git branch --show-current`で`develop`と表示される

**原因：**
- Worktree作成が失敗していた
- Worktree作成後、worktreeディレクトリに移動していなかった
- `pwd`で現在地を確認していなかった

**対処法：**

```bash
# 1. 現在の状態確認
pwd
git branch --show-current
git worktree list

# 2. Worktreeが作成されているか確認
ls -ld wt-issue-*

# 3. Worktreeディレクトリに移動
cd wt-issue-XX-name

# 4. 正しいブランチにいることを確認
git branch --show-current
# 期待: feature/issue-XX-name

# 5. これで正しい環境で作業できる
```

**予防策：**
- Worktree作成後、必ず以下を実行：
  ```bash
  git worktree list     # worktreeが表示されること
  ls -ld wt-issue-*     # ディレクトリが存在すること
  cd wt-issue-XX-name   # worktreeディレクトリに移動
  pwd                   # 現在地確認
  git branch --show-current  # 正しいブランチか確認
  ```

### 問題2: Worktree作成に失敗する

**症状：**
- `git worktree add`コマンドがエラーを返す
- `git worktree list`に新しいworktreeが表示されない

**原因：**
- ブランチ名が既に使用されている
- Worktreeディレクトリが既に存在する
- ディスク容量が不足している

**対処法：**

```bash
# 既存のブランチ確認
git branch --list feature/issue-XX-*

# 既存のWorktreeディレクトリ確認
ls -ld wt-issue-*

# ブランチが既に存在する場合
git worktree add wt-issue-XX-name feature/issue-XX-name  # 既存ブランチを使用

# ディレクトリが既に存在する場合
rm -rf wt-issue-XX-name  # 削除してから再作成
git worktree add -b feature/issue-XX-name wt-issue-XX-name develop

# ディスク容量確認
df -h .
```

### 問題3: Worktreeディレクトリに移動できない

**症状：**
- `cd wt-issue-XX-name`がエラーになる
- `No such file or directory`と表示される

**原因：**
- Worktree作成が失敗していた
- ディレクトリ名が間違っている

**対処法：**

```bash
# 1. 実際に存在するworktreeを確認
git worktree list

# 2. ディレクトリ名を確認
ls -ld wt-issue-*

# 3. 正しいディレクトリ名でcdを実行
cd <実際のディレクトリ名>

# 4. Worktreeが存在しない場合は作成し直す
git worktree add -b feature/issue-XX-name wt-issue-XX-name develop
```

### 問題4: コミット作成時に「developブランチ禁止」エラー

**症状：**
- コミット作成時に「developブランチでの直接コミットは禁止」と表示される

**原因：**
- Worktreeディレクトリに移動していない
- 元のプロジェクトルートで作業していた

**対処法：**

```bash
# 1. 現在地確認
pwd
# 期待: /Users/user/project/wt-issue-XX-name
# 実際: /Users/user/project（間違い）

# 2. Worktreeディレクトリに移動
cd wt-issue-XX-name

# 3. ブランチ確認
git branch --show-current
# 期待: feature/issue-XX-name

# 4. これでコミット作成可能
```

### 問題5: Developer Agent実行後、developブランチにコミットされていた

**症状：**
- Developer Agent完了後、developブランチに変更が入っていた
- Worktreeディレクトリに変更が入っていない

**原因：**
- Developer Agent起動前に`pwd`で現在地を確認していなかった
- Worktreeディレクトリに移動せずにAgent起動した

**対処法：**

```bash
# 1. Developer Agent起動前の必須チェック
pwd  # Worktreeディレクトリにいるか確認
git branch --show-current  # feature/bugfix/choreブランチにいるか確認

# 2. Worktreeディレクトリに移動してからAgent起動
cd wt-issue-XX-name
pwd  # 確認
git branch --show-current  # 確認

# 3. これでDeveloper Agent起動
```

## 📋 Worktree作業時の必須チェックリスト

すべてのWorktree作業で、以下のチェックリストを**必ず実施**してください：

### Worktree作成時

- [ ] `git worktree add`コマンド実行
- [ ] `git worktree list`で新しいworktreeが表示されている
- [ ] `ls -ld wt-issue-*`でディレクトリが存在している
- [ ] `cd wt-issue-XX-name`でディレクトリに移動
- [ ] `pwd`でworktreeディレクトリにいる
- [ ] `git branch --show-current`で正しいブランチにいる（feature/bugfix等）
- [ ] ❌ developブランチにいない

### 実装開始時（Developer Agent起動前）

- [ ] `pwd`でworktreeディレクトリにいる
- [ ] `git branch --show-current`で正しいブランチにいる
- [ ] ❌ developブランチにいない
- [ ] 未コミット変更がない（`git status`で確認）

### コミット作成時

- [ ] `pwd`でworktreeディレクトリにいる
- [ ] `git branch --show-current`で正しいブランチにいる
- [ ] ❌ developブランチにいない
- [ ] `mise run supabase:trigger-preview`実行済み
- [ ] `mise run pre-commit:check`実行済み

### PR作成時

- [ ] `pwd`でworktreeディレクトリにいる
- [ ] `git branch --show-current`で正しいブランチにいる
- [ ] ❌ developブランチにいない
- [ ] ❌ mainブランチにいない
- [ ] コミットがプッシュされている（または/create-prが自動プッシュ）

## 🔧 検証コマンド集

Worktree作業中に実行すべき検証コマンド：

```bash
# === 現在の状態確認 ===
pwd                          # 現在地
git branch --show-current    # 現在のブランチ
git worktree list           # すべてのworktree一覧
git status                  # 変更ファイル

# === Worktree存在確認 ===
ls -ld wt-issue-*           # Worktreeディレクトリ一覧
du -sh wt-issue-*           # Worktreeディレクトリサイズ

# === ブランチ確認 ===
git branch --list feature/* # featureブランチ一覧
git branch --list bugfix/*  # bugfixブランチ一覧

# === リモート状態確認 ===
git fetch origin
git log --oneline origin/develop..HEAD  # developとの差分コミット
git diff --stat origin/develop..HEAD    # developとの差分統計
```

## 🎯 ベストプラクティス

### 1. Worktree作成後は必ず検証

```bash
# Worktree作成
git worktree add -b feature/issue-23-usecase wt-issue-23-usecase develop

# 必ず検証（このステップを省略しない）
git worktree list
ls -ld wt-issue-23-usecase
cd wt-issue-23-usecase
pwd
git branch --show-current
```

### 2. 実装開始前に必ず現在地確認

```bash
# Developer Agent起動前
pwd
git branch --show-current

# developと表示されたら即座に中断
```

### 3. 定期的に状態確認

```bash
# 作業中に定期的に実行
pwd                        # 迷子になっていないか
git branch --show-current  # 正しいブランチか
git status                 # 変更ファイル確認
```

### 4. Claude Codeウィンドウを複数開く

並行開発時は、複数のClaude Codeウィンドウを開いて作業する：

- **ウィンドウ1**: 元のプロジェクトルート（developブランチ）
- **ウィンドウ2**: wt-issue-22-domain-model（feature/issue-22-domain-model）
- **ウィンドウ3**: wt-issue-23-usecase（feature/issue-23-usecase）

各ウィンドウで独立して作業できる。

## 📝 トラブルシューティング履歴

### Issue #23: developブランチで作業してしまった（2026-04-17）

**問題：**
- `/start-issue-worktree #23`を実行したが、実際にはworktreeが作成されていなかった
- developブランチで実装を開始し、feature/issue-23-usecase-layerブランチでコミットした
- 最終的にPRは正常にマージされたが、worktree使用という目的は達成できなかった

**原因：**
1. Worktree作成後の検証を実施していなかった
2. `pwd`と`git branch --show-current`で現在地を確認していなかった
3. Developer Agent起動前のチェックリストを実施していなかった

**対策：**
1. CLAUDE.mdにWorktree作成時の必須検証を追加
2. start-issue-worktreeスキルに検証ステップ（Step 7.5）を追加
3. create-commitスキルに現在地確認を追加
4. create-prスキルに現在地確認を追加
5. このトラブルシューティングガイドを作成

**教訓：**
- スキル実行後の検証は必須
- `pwd`と`git branch --show-current`は作業前の儀式
- 「作成完了」と報告する前に必ず証跡を確認

## 🔗 関連ドキュメント

- [CLAUDE.md](../CLAUDE.md) - Git Worktree使用時の必須検証
- [start-issue-worktreeスキル](../.claude/skills/start-issue-worktree/skill.md) - Step 7.5検証ステップ
- [create-commitスキル](../.claude/skills/create-commit/skill.md) - Step 1現在地確認
- [create-prスキル](../.claude/skills/create-pr/skill.md) - Step 1現在地確認
- [Git Flow戦略ガイド](./git-flow-strategy.md) - ブランチ戦略全体
