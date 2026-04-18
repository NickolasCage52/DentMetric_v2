/**
 * Deploy to GitHub Pages via gh-pages branch (git worktree).
 * Works on Windows PowerShell and Unix.
 */
import { execSync } from 'child_process';
import { existsSync, readdirSync, cpSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distPath = join(root, 'dist');
const worktreeDir = join(root, '.gh-pages-worktree');

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function runSilent(cmd, cwd = root) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', shell: true }).trim();
  } catch {
    return '';
  }
}

function hasOrigin() {
  const remotes = runSilent('git remote');
  return remotes.includes('origin');
}

function hasGhPagesBranch() {
  runSilent('git fetch origin');
  const branches = runSilent('git branch -a');
  return branches.includes('gh-pages') || branches.includes('origin/gh-pages');
}

/**
 * deploy:setup — проверяет origin и создаёт gh-pages при необходимости
 */
function setup() {
  if (!hasOrigin()) {
    console.error('Error: No remote "origin" found. Add it with: git remote add origin <url>');
    process.exit(1);
  }
  if (!hasGhPagesBranch()) {
    console.log('Creating gh-pages branch...');
    run('git push origin main:gh-pages');
    console.log('gh-pages branch created.');
  } else {
    console.log('gh-pages branch already exists.');
  }
  console.log('Deploy setup OK.');
}

/**
 * deploy — build + push dist в gh-pages через worktree
 */
function deploy() {
  if (!hasOrigin()) {
    console.error('Error: No remote "origin" found. Run: npm run deploy:setup');
    process.exit(1);
  }
  if (!hasGhPagesBranch()) {
    console.error('Error: gh-pages branch not found. Run: npm run deploy:setup');
    process.exit(1);
  }

  console.log('[deploy] Building for GitHub Pages (VITE_BASE_PATH from .env.github-pages)...');
  run('npm run build:gh-pages');

  if (!existsSync(distPath)) {
    console.error('Error: dist/ not found after build');
    process.exit(1);
  }

  run('git fetch origin gh-pages');

  const worktreeExists = existsSync(worktreeDir);
  const hasLocalGhPages = runSilent('git branch --list gh-pages').trim().length > 0;
  if (worktreeExists) {
    console.log('[deploy] Reusing existing worktree');
    run(`git -C "${worktreeDir}" reset --hard origin/gh-pages`);
  } else {
    console.log('[deploy] Creating worktree');
    if (hasLocalGhPages) {
      run(`git worktree add "${worktreeDir}" gh-pages`);
      run(`git -C "${worktreeDir}" reset --hard origin/gh-pages`);
    } else {
      run(`git worktree add -b gh-pages "${worktreeDir}" origin/gh-pages`);
    }
  }

  const entries = readdirSync(worktreeDir);
  for (const e of entries) {
    if (e === '.git') continue;
    const p = join(worktreeDir, e);
    rmSync(p, { recursive: true, force: true });
  }

  cpSync(distPath, worktreeDir, { recursive: true });
  writeFileSync(join(worktreeDir, '.nojekyll'), '');

  run('git add -A', worktreeDir);
  const status = runSilent('git status --porcelain', worktreeDir);
  if (status) {
    run('git commit -m "Deploy to GitHub Pages"', worktreeDir);
    run('git push origin gh-pages', worktreeDir);
    console.log('[deploy] Done: commit created, pushed to origin/gh-pages');
  } else {
    console.log('[deploy] Done: no changes (dist unchanged, skip commit/push)');
  }
}

const cmd = process.argv[2];
if (cmd === 'setup') setup();
else if (cmd === 'deploy') deploy();
else {
  console.error('Usage: node scripts/deploy.js [setup|deploy]');
  process.exit(1);
}
