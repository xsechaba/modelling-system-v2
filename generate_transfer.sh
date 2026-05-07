#!/bin/bash
OUTPUT="transfer_to_work_agent.md"

cat << 'HEADER' > $OUTPUT
# dim-wiz Frontend & Backend Export

Copy everything below and paste it to the coding agent on your work laptop.

Prompt: *"Here are the updated files for dim-wiz. We have stabilized the build environment and completely fixed the backend API for the CSV profiling. We also fixed caching, typescript configuration, and the deployment page simulation. Please apply these precise structural additions and design updates to the existing codebase securely. Overwrite existing files securely with these new components."*

---
HEADER

FILES=(
  "app/globals.css"
  "app/layout.tsx"
  "app/page.tsx"
  "app/projects/page.tsx"
  "app/wizard/layout.tsx"
  "app/wizard/upload/page.tsx"
  "app/wizard/profile/page.tsx"
  "app/api/profile/route.ts"
  "middleware.ts"
  "tsconfig.json"
  "next.config.mjs"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    ext="${file##*.}"
    lang="$ext"
    if [ "$ext" == "tsx" ] || [ "$ext" == "ts" ]; then lang="typescript"; fi
    if [ "$ext" == "mjs" ]; then lang="javascript"; fi
    if [ "$ext" == "json" ]; then lang="json"; fi
    if [ "$ext" == "css" ]; then lang="css"; fi
    
    echo "## \`$file\`" >> $OUTPUT
    echo "" >> $OUTPUT
    echo "\`\`\`$lang" >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo "\`\`\`" >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done
