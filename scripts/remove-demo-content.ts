/**
 * Lists or removes all demonstration content before launch.
 *
 *   npm run demo:remove            — dry run: lists what would be deleted
 *   npm run demo:remove -- --yes   — deletes demo articles and their images
 *
 * An article is demo content when its frontmatter contains `demo: true`.
 * Images are deleted only if no remaining (non-demo) article uses them.
 * Category fallback illustrations in src/assets/images/fallback/ are kept:
 * they are used for articles without a featured image.
 */
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const articlesDir = join(root, 'src/content/articles');
const confirm = process.argv.includes('--yes');

const frontmatter = (text: string) => text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
const imagesOf = (text: string) =>
  [...frontmatter(text).matchAll(/^(?:image|socialImage):\s*['"]?([^'"\n]+)['"]?\s*$/gm)].map((match) =>
    resolve(articlesDir, match[1]!.trim()),
  );

const files = readdirSync(articlesDir).filter((file) => file.endsWith('.md'));
const demo = files.filter((file) =>
  /^demo:\s*true\s*$/m.test(frontmatter(readFileSync(join(articlesDir, file), 'utf8'))),
);
const kept = files.filter((file) => !demo.includes(file));

const keptImages = new Set(kept.flatMap((file) => imagesOf(readFileSync(join(articlesDir, file), 'utf8'))));
const demoImages = [...new Set(demo.flatMap((file) => imagesOf(readFileSync(join(articlesDir, file), 'utf8'))))].filter(
  (image) => !keptImages.has(image) && existsSync(image),
);

if (demo.length === 0) {
  console.log('No demonstration articles found.');
  process.exit(0);
}

console.log(`${confirm ? 'Deleting' : 'Would delete'} ${demo.length} demonstration article(s):`);
demo.forEach((file) => console.log(`  src/content/articles/${file}`));
console.log(`${confirm ? 'Deleting' : 'Would delete'} ${demoImages.length} image(s) used only by them:`);
demoImages.forEach((image) => console.log(`  ${image.slice(root.length + 1)}`));

if (!confirm) {
  console.log('\nDry run only. Run `npm run demo:remove -- --yes` to delete these files, then commit the change.');
} else {
  demo.forEach((file) => rmSync(join(articlesDir, file)));
  demoImages.forEach((image) => rmSync(image));
  console.log(`\nDone. ${kept.length} article(s) remain. Review with \`git status\`, then commit.`);
  if (kept.length === 0)
    console.log('The homepage will show a "first articles are on their way" message until you publish.');
}
