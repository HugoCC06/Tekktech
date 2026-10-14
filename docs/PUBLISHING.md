# Writing and publishing with the TekkTech dashboard

The dashboard lives at **`https://tekktech.com/admin/`**. Only GitHub accounts you have authorised can sign in (see [DEPLOYMENT.md](DEPLOYMENT.md#3-dashboard-sign-in-github-oauth)). Every action in it becomes a Git commit in the repository, so nothing is ever lost.

## The publishing lifecycle

```
 ＋ New article ──► Save ──► Draft ──► In review ──► Ready ──► Publish now ──► live after deployment
                    (private branch: cms/…)                   (merged into main)
```

| Where the article is                                                  | Visible on the public site?                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Saved, not yet published (Workflow: Draft / In review / Ready)        | **No.** It exists only on a private `cms/…` branch                   |
| Published with **Site status: Published** and a date that has arrived | **Yes**, once the Cloudflare deployment finishes (about 1–2 minutes) |
| Published with **Site status: Draft**                                 | **No.** Useful for keeping a merged article hidden                   |
| Published with **Site status: Archived**                              | **No.** Removed everywhere, but kept in the repository               |
| Published with a future **Publication date**                          | **No**, until the first build on or after that date                  |

These rules were verified by an automated test that drives the real dashboard (`npm run test:publishing`).

## Signing in

1. Open `/admin/` and click **Login with GitHub**.
2. Approve the TekkTech Dashboard app the first time.
3. You land on **Contents → All articles**.

Working locally instead? Run `npm run dev` and `npm run cms` in two terminals, open <http://localhost:4321/admin/> and click **Login**. Changes are written straight to the files on your computer.

## Writing a new article

1. In the sidebar, pick the article type: **Reviews**, **Comparisons**, **Ranked lists**, **Explainers**, **Guides** or **Opinion & analysis**.
2. Click **＋ Review** (or the equivalent) at the top of the list. The body is pre-filled with that type's template.
3. Fill in the essentials:
   - **Title** – clear and specific.
   - **URL slug** – lowercase words separated by hyphens, e.g. `best-budget-mechanical-keyboards`. It becomes `/gaming/best-budget-mechanical-keyboards/`. **Don't change it after publishing.**
   - **Excerpt** – one or two sentences. It appears under the headline and on cards.
   - **Category** – also part of the URL.
   - **Publication date** – defaults to today.
4. Write the **Body**. Use headings (they build the table of contents automatically), short paragraphs and lists. Switch between _Rich text_ and _Markdown_ at the top of the editor. Delete the template's guidance comments as you go.
5. Add a **Featured image** with **alt text**, and a caption and credit where relevant.
6. Add **Sources and references**, preferring primary sources.
7. For reviews, complete **Review details**. Switch on **Used hands-on?** only if you genuinely used the product.
8. Optional: **Tags**, **Related articles**, **SEO title** and **SEO description** (both default to the title and excerpt), **Affiliate links**, **Feature on homepage**.
9. Click **Save** (top left). The article is now a draft.

## Previewing

- The **preview pane** on the right updates as you type and shows the article in the site's typography. The eye icon toggles it.
- With preview deployments enabled (see [DEPLOYMENT.md](DEPLOYMENT.md#preview-deployments-for-drafts)), each saved draft is also built at its own protected preview address.

## Publishing

1. Run through the [editorial checklist](EDITORIAL-CHECKLIST.md).
2. In the editor's top bar, open **Status** and choose **Ready**.
3. Click **Publish → Publish now**.
4. Cloudflare starts a deployment. The article is live when it finishes. If the build fails (for example, a required field is invalid), the site stays as it was and Cloudflare's deployment log names the problem.

You can also manage drafts from the **Workflow** tab, which shows _Drafts_, _In Review_ and _Ready_ columns.

## Editing a published article

Open it, change it and click **Save**. The live version stays unchanged until you publish again (Status → Ready → Publish now). For meaningful updates, set **Last updated** to today, so readers and search engines can see the change.

## Unpublishing (archiving)

1. Open the article.
2. Set **Site status** to **Archived — removed from the public site**.
3. **Save**, then **Status → Ready → Publish now**.

After the deployment, the article has gone from every page, the search index, the RSS feed and the sitemap. To bring it back, set **Site status** to _Published_ and publish again.

If other sites link to an archived article, consider adding a redirect to a related article in `public/_redirects`.

## Deleting

Open the article and choose **Delete published entry** (or **Delete unpublished entry** for an unpublished draft). The dashboard asks you to confirm. The file can still be recovered from Git history. Prefer archiving unless you're sure.

## Images

- **Upload:** use the **Featured image** field, or the image button in the body editor. Files go to `src/assets/images/articles/`.
- **Size:** 16:9, at least 1600×900 px. The site generates optimised, responsive WebP versions automatically.
- **Alt text** is required for featured images. Describe what is shown, not "image of".
- **AI illustrations:** tick **Image is AI-generated**. The article then labels it as an illustration.
- **Rights:** only use images you made, commissioned, licensed or that are clearly licensed for reuse, and credit them. Don't hotlink images from other sites, and don't use brand logos or product photos without permission.
- **Media library:** the **Media** tab in the top bar lists every uploaded image.

## Affiliate and sponsored content

- Add retailer links under **Affiliate links ("Where to buy")**. They are labelled, marked `rel="sponsored nofollow"`, and trigger the affiliate disclosure automatically.
- For an inline affiliate link in the body, switch to Markdown mode and write `[Check price](https://… "affiliate")`.
- For paid content, switch on **Sponsored content** and enter the **Sponsor name**. A prominent disclosure appears above the article.
- Only use these for genuine relationships. Never imply a partnership that doesn't exist.

## Site pages

**Site pages** in the sidebar holds About, Editorial policy, How we review, Contact and the legal pages. Edit and publish them the same way. Switch off **Needs legal review** once a page has been properly reviewed: that removes the "draft template" warning banner.
