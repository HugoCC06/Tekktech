# Publishing from the GitHub website (the simple way)

No dashboard, no software, no terminal. Each article is one text file in `src/content/articles/`. When you save (commit) a file to the `main` branch, the site rebuilds and goes live in about two minutes.

## Publish a new article

1. Open the [article template](../content-templates/NEW-ARTICLE.md), click the **Raw** button, and copy everything.
2. Go to the `src/content/articles/` folder on GitHub and click **Add file → Create new file**.
3. Name the file after the article's slug, for example `best-budget-keyboards.md`.
4. Paste the template, fill in the fields at the top (title, slug, excerpt, category, type, date), and write the article underneath. Click **Preview** to check how it reads.
5. Click **Commit changes…**, choose **Commit directly to the `main` branch**, and confirm.
6. Watch the **Actions** tab. When the "Deploy to GitHub Pages" run turns green, the article is live.

## Add an image

1. Go to `src/assets/images/articles/` → **Add file → Upload files**, upload the image (16:9, at least 1600×900, JPG/PNG/WebP), and commit to `main`.
2. In the article, uncomment the image lines (remove the `# `) and use the file name:

   ```yaml
   image: ../../assets/images/articles/your-image.webp
   imageAlt: 'What the image shows'
   ```

   Keep the `../../assets/images/articles/` part exactly as it is. Alt text is required whenever there is an image.

## Edit an article

Open its file in `src/content/articles/`, click the pencil icon, make your changes, and commit to `main`. For a meaningful update, add or change `updatedDate:`.

## Save a draft without publishing

Set `status: draft` and commit. The file is saved, but the article doesn't appear anywhere on the site. Change it to `status: published` when you're ready.

## Unpublish or delete

- **Take down but keep:** change `status: published` to `status: archived` and commit.
- **Delete:** open the file → **⋯ → Delete file** → commit. It can still be recovered from the file's history.

## If something goes wrong

If the Actions run turns red, the live site stays as it was. Nothing breaks. Click the failed run, then the **build** step: the error names the file and the problem, for example:

| Error says                                        | Fix                                                         |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `imageAlt: Add alternative text`                  | Add an `imageAlt:` line                                     |
| `slug: Slugs may only contain lowercase letters…` | Use only `a-z`, `0-9` and single hyphens                    |
| `category: Invalid option`                        | Use `consumer-tech`, `gaming`, `crypto` or `productivity`   |
| `Duplicate article slug`                          | Another article already uses that slug; pick a new one      |
| `excerpt: Too small`                              | The excerpt needs at least 20 characters                    |
| A YAML error mentioning a line number             | Usually a missing quote. Wrap text containing `:` in quotes |

Then fix the file and commit again.

## Tips

- Prefer a desktop browser, or press `.` on any GitHub repository page to open a full editor (github.dev) in your browser.
- Before publishing, run through the [editorial checklist](EDITORIAL-CHECKLIST.md).
- To have Claude write an article in the right format, use the prompt in [`content-templates/CLAUDE-PROMPT.md`](../content-templates/CLAUDE-PROMPT.md).
- Type-specific outlines (review, comparison, ranked list and so on) are in [`content-templates/`](../content-templates/). Paste one under the `---` line in place of the example body.
