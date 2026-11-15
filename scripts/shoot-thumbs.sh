#!/bin/bash
# 批量给课件截图，作为卡片缩略图
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
SRC="/Users/fuheng/资料/高中Html交互模型/同江实验室/tongjiang-lab-lessons-2026-10-28/courses"
OUT="/Users/fuheng/WorkBuddy/2026-11-16-05-04-48/site/public/thumbs"
mkdir -p "$OUT"

count=0
for f in "$SRC"/*.html; do
  name=$(basename "$f" .html)
  [ -f "$OUT/$name.png" ] && continue
  agent-browser open "file://$f" >/dev/null 2>&1
  agent-browser set viewport 1200 750 >/dev/null 2>&1
  sleep 5
  agent-browser screenshot "$OUT/$name.png" >/dev/null 2>&1
  count=$((count+1))
  echo "[$count] $name"
done
echo "完成，共 $count 张"
