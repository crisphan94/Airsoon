#!/bin/bash

START_DAY=100
END_DAY=119
BRANCH_NAME="stress_commit_2"

# Kiểm tra Git repo
if [ ! -d ".git" ]; then
  echo "❌ This is not a Git repository!"
  exit 1
fi

# Tạo nhánh mới từ nhánh hiện tại
git checkout stress_commit
git checkout -b "$BRANCH_NAME"

for ((i=START_DAY; i<=END_DAY; i++))
do
  COMMIT_DATE=$(date -v -${i}d +"%Y-%m-%dT12:00:00")

  echo "Extra commit for $COMMIT_DATE" > "extra_commit_$i.txt"
  git add .
  GIT_AUTHOR_DATE=$COMMIT_DATE GIT_COMMITTER_DATE=$COMMIT_DATE git commit -m "Extra fake commit for day $i"
done

echo "✅ Done: Created $((END_DAY - START_DAY + 1)) commits on branch $BRANCH_NAME"
