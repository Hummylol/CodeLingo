const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = ['node_modules', '.next', '.git', 'public'];
const INCLUDED_EXTS = ['.tsx', '.ts', '.css'];

// Directories we care about the most
const DIRS_TO_SCAN = ['app', 'components', 'lib', 'utils'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (EXCLUDED_DIRS.includes(file)) return;

    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (INCLUDED_EXTS.includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const outputFile = 'codelingo_full_context.md';
let outputStream = fs.createWriteStream(outputFile);

const overview = `
# CodeLingo - Full Context Overview

## App Structure & How It Works
1. **Framework**: Next.js App Router (13/14+) with React, Tailwind CSS, and Framer Motion.
2. **Auth & Database**: Supabase JS Client is used for authentication and database queries (\`profiles\` table for streak, xp, etc.). The AuthContext (\`lib/auth-context.tsx\`) maintains the user session.
3. **Gamification (XP & Goals)**: 
   - Users gain 10 XP per minute they are logged in (calculated in \`lib/auth-context.tsx\`).
   - The Weekly Goal component (\`components/codelingo/weekly-goal.tsx\`) reads the total XP and divides by 10 to show minutes learned, with an editable target stored in \`localStorage\`.
4. **Learning Trails (Lessons)**:
   - Guided path shown in \`app/lesson/page.tsx\`. Each lesson goes to \`app/lesson/theory/[id]/page.tsx\`.
   - The Theory page parses \`[id].json\` files from \`public/theory/...\` to display theory topics, and quizzes users across 3 difficulties (Beginner, Intermediate, Expert) unlocking the next tier upon hitting 70% passing.
5. **Daily Quiz & Streaks**:
   - \`app/daily-quiz/page.tsx\` selects 15 random questions from JSON banks. 
   - Scoring 12 out of 15 (80%) updates the streak logic in \`profiles.streak\`. Streaks only update once per 24 hours. The dynamic \`StreakBadge\` subcribes to realtime DB changes.

---

## File Contents
`;

outputStream.write(overview);

DIRS_TO_SCAN.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    const files = getAllFiles(fullPath);
    files.forEach((file) => {
      const relativePath = path.relative(__dirname, file);
      const content = fs.readFileSync(file, 'utf8');
      outputStream.write(`\n\n### FILE: \`${relativePath}\`\n\n\`\`\`tsx\n`);
      outputStream.write(content);
      outputStream.write(`\n\`\`\`\n`);
    });
  }
});

outputStream.end();
console.log('Context bundle generated at codelingo_full_context.md');
