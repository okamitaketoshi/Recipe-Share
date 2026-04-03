#!/bin/bash
# 機密情報チェックスクリプト

set -e

echo "🔍 機密情報チェック開始..."

# ステージングされたファイル一覧を取得
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "✅ ステージングされたファイルがありません"
  exit 0
fi

# .envファイルのチェック
if echo "$STAGED_FILES" | grep -qE '\.env$|\.env\..*$'; then
  echo "❌ エラー: .envファイルがステージングされています"
  echo "$STAGED_FILES" | grep -E '\.env$|\.env\..*$'
  echo ""
  echo "機密情報を含む.envファイルはコミットできません。"
  echo "以下のコマンドでアンステージしてください:"
  echo "  git reset HEAD .env"
  exit 1
fi

# 秘密鍵のパターンチェック
SECRET_PATTERNS=(
  "PRIVATE[_-]KEY"
  "SECRET[_-]KEY"
  "API[_-]SECRET"
  "PASSWORD"
  "TOKEN"
  "SUPABASE[_-]SERVICE[_-]ROLE[_-]KEY"
)

for file in $STAGED_FILES; do
  # バイナリファイルをスキップ
  if file "$file" | grep -q "text"; then
    for pattern in "${SECRET_PATTERNS[@]}"; do
      # パターンマッチング（大文字小文字を区別しない）
      if grep -iHn "$pattern.*=.*['\"][^'\"]\{20,\}['\"]" "$file" 2>/dev/null; then
        echo "⚠️  警告: $file に機密情報の可能性があるパターンを検出しました"
        echo "内容を確認して、問題なければコミットしてください。"
        # 警告のみで継続（exit 1にすると厳格化）
      fi
    done
  fi
done

echo "✅ 機密情報チェック完了"
exit 0
