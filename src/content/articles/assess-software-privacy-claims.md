---
title: 'How to assess software privacy claims'
slug: assess-software-privacy-claims
excerpt: '"We take your privacy seriously" tells you nothing. Learn how to read privacy policies, app-store privacy labels and encryption claims critically — and which questions reveal how an app really handles your data.'
category: productivity
type: explainer
tags:
  - privacy
  - security
status: published
publishDate: 2026-09-28
image: ../../assets/images/articles/assess-software-privacy-claims.webp
imageAlt: 'Illustration of a green shield with a padlock'
imageCredit: 'Illustration: TekkTech placeholder artwork'
seoDescription: 'How to evaluate software privacy claims: reading privacy policies, app-store privacy labels, encryption terms and data-retention promises with a critical eye.'
sources:
  - title: 'Regulation (EU) 2016/679 (General Data Protection Regulation)'
    url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'
    publisher: 'EUR-Lex'
  - title: 'App privacy details on the App Store'
    url: 'https://developer.apple.com/app-store/app-privacy-details/'
    publisher: 'Apple Developer'
  - title: 'Provide information for Google Play''s Data safety section'
    url: 'https://support.google.com/googleplay/android-developer/answer/10787469'
    publisher: 'Google Play Console Help'
related:
  - evaluate-productivity-app
  - passkeys-explained
demo: true
---

Almost every app claims to care about privacy. Far fewer explain, in specific and checkable terms, what they collect, why, who else receives it, and how long they keep it. This explainer shows you how to tell the difference.

It is not legal advice, and it cannot tell you whether a particular company follows its own policy. What it can do is help you ask the questions that matter.

## Why privacy claims are hard to judge

When you use software, you usually cannot see what data leaves your device or what happens to it on a company's servers. You are relying on what the company says. That makes the precision of its statements important: specific claims can be checked and challenged; vague ones cannot.

A useful rule of thumb: **treat marketing language as a starting point, and the privacy policy as the actual commitment.**

## Step 1: Read the privacy policy for specifics

You do not need to read every word. Look for clear answers to five questions:

1. **What is collected?** Content you create, account details, device identifiers, location, usage analytics?
2. **Why?** Each type of data should have a stated purpose.
3. **Who receives it?** Look for named categories of third parties, such as hosting providers, analytics companies or advertisers.
4. **How long is it kept?** Specific retention periods are a good sign; "as long as necessary" is not very informative.
5. **How can you access or delete it?** Look for a clear process.

In the EU and UK, the General Data Protection Regulation gives people rights over their personal data — including rights of access and erasure in many circumstances — and requires organisations to explain their processing transparently. Other jurisdictions have their own rules.

## Step 2: Compare with the app-store privacy labels

Apple's App Store displays privacy details provided by developers, and Google Play shows a Data safety section. These summaries are useful for quick comparisons between apps.

Remember two things:

- They are **self-reported by developers**. They are claims, not independent audits.
- They are summaries. If a label and the privacy policy seem to disagree, that is worth noticing.

## Step 3: Decode encryption claims

Encryption terminology is often used loosely. The distinctions that matter:

| Term | What it usually means | Can the provider read your data? |
| --- | --- | --- |
| Encryption in transit | Data is protected while travelling over the network (for example via TLS). | Yes, once it arrives. |
| Encryption at rest | Data is encrypted on the provider's storage. | Usually yes — the provider holds the keys. |
| End-to-end encryption | Data is encrypted on your device and only decryptable by intended recipients. | No, if implemented correctly. |

"Bank-grade encryption" or "military-grade encryption" are marketing phrases, not technical descriptions. Look for statements about *who holds the keys*.

## Step 4: Look for evidence beyond the company's word

Some signals provide more confidence than a policy alone:

- **Independent security audits** with published summaries or reports.
- **Open-source code** that others can inspect — though open code does not automatically mean it has been reviewed.
- **Transparency reports** describing government data requests.
- **A track record** of how the company has handled past security incidents.

None of these is a guarantee, but each one replaces trust with something closer to evidence.

## Step 5: Check the settings

Many apps collect optional analytics, personalise advertising or use content to improve features — including AI features — unless you switch these off. After installing, go through privacy settings and disable what you do not need. If important controls are missing, that tells you something too.

## Red flags and green flags

**Be cautious when you see:**

- vague purposes such as "to improve our services" covering everything;
- broad rights to share data with unnamed "partners";
- no clear way to delete your account and data;
- privacy settings that reset after updates.

**Encouraging signs include:**

- specific data categories, purposes and retention periods;
- end-to-end encryption for sensitive content, with a clear explanation of key management;
- independent audits;
- data minimisation — collecting only what the feature needs.

## The bottom line

Privacy is not a feature you can verify at a glance, but it is not unknowable either. Specific, consistent and independently supported claims deserve more trust than reassuring slogans. When in doubt, choose the product that asks you to trust it less.
