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
const firstPushTmp = join(root, '.deploy-gh-pages-tmp');

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

/** После fetch: есть ли origin/gh-pages */
function remoteHasGhPages() {
  const ref = runSilent('git rev-parse --verify refs/remotes/origin/gh-pages');
  return ref.length > 0;
}

function safeRemoveWorktreeDir() {
  try {
    execSync(`git worktree remove --force "${worktreeDir}"`, {
      cwd: root,
      stdio: 'pipe',
      shell: true,
    });
  } catch {
    /* не зарегистрирован как worktree */
  }
  if (existsSync(worktreeDir)) {
    rmSync(worktreeDir, { recursive: true, force: true });
  }
  runSilent('git worktree prune');
}

/**
 * Первый выклад: на remote ещё нет gh-pages (git worktree --orphan есть не во всех версиях Git for Windows).
 * Копируем dist во временный каталог, git init, один коммит, force push в gh-pages.
 */
function deployFirstGhPagesBranch() {
  const remoteUrl = runSilent('git remote get-url origin');
  if (!remoteUrl) {
    console.error('Error: could not read origin URL');
    process.exit(1);
  }

  console.log('[deploy] Первый push: создаю ветку gh-pages на origin (временный repo + --force)');

  safeRemoveWorktreeDir();
  if (existsSync(firstPushTmp)) {
    rmSync(firstPushTmp, { recursive: true, force: true });
  }
  cpSync(distPath, firstPushTmp, { recursive: true });
  writeFileSync(join(firstPushTmp, '.nojekyll'), '');

  const quotedRemote = remoteUrl.includes(' ') ? `"${remoteUrl.replace(/"/g, '\\"')}"` : remoteUrl;

  run('git init', firstPushTmp);
  run('git checkout -b gh-pages', firstPushTmp);
  run('git add -A', firstPushTmp);
  run('git commit -m "Deploy to GitHub Pages"', firstPushTmp);
  run(`git remote add origin ${quotedRemote}`, firstPushTmp);
  run('git push -u origin gh-pages --force', firstPushTmp);

  rmSync(firstPushTmp, { recursive: true, force: true });
  run('git fetch origin');

  console.log('[deploy] Done: origin/gh-pages создана. Следующие деплои пойдут через worktree.');
}

/**
 * deploy:setup — проверяет origin (ветка gh-pages создаётся при первом deploy)
 */
function setup() {
  if (!hasOrigin()) {
    console.error('Error: No remote "origin" found. Add it with: git remote add origin <url>');
    process.exit(1);
  }
  runSilent('git fetch origin');
  if (remoteHasGhPages()) {
    console.log('Remote branch gh-pages exists. Publish: npm run deploy');
  } else {
    console.log('Remote gh-pages ещё нет — она будет создана при первом `npm run deploy`.');
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

  console.log('[deploy] Building for GitHub Pages (VITE_BASE_PATH from .env.github-pages)...');
  run('npm run build:gh-pages');

  if (!existsSync(distPath)) {
    console.error('Error: dist/ not found after build');
    process.exit(1);
  }

  run('git fetch origin');

  if (!remoteHasGhPages()) {
    deployFirstGhPagesBranch();
    return;
  }

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
