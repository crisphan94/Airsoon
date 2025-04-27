#!/bin/bash

# Số ngày muốn commit tính từ hôm nay lùi về quá khứ
TOTAL_DAYS=100

# Tên branch
BRANCH_NAME="stress_commit"

# Clone repo hoặc cd vào repo đã có
# cd /path/to/your/repo

# Đảm bảo đang trong repo Git
if [ ! -d ".git" ]; then
  echo "This is not a Git repository!"
  exit 1
fi

# Tạo branch mới (nếu chưa có)
git checkout -b "$BRANCH_NAME"

for ((i=TOTAL_DAYS; i>=0; i--))
do
  COMMIT_DATE=$(date -v -${i}d +"%Y-%m-%dT12:00:00")

  echo "Commit for $COMMIT_DATE" > "fake_commit_$i.txt"
  git add .
  GIT_AUTHOR_DATE=$COMMIT_DATE GIT_COMMITTER_DATE=$COMMIT_DATE git commit -m "Fake commit for day $i"
done

echo "Done!"
