---
title: 'Self-custody basics: how crypto wallets keep your keys safe'
slug: crypto-wallet-self-custody-basics
excerpt: 'A crypto wallet does not store coins — it protects the keys that control them. This guide explains seed phrases, hot and cold wallets, and the security habits that matter most.'
category: crypto
type: guide
tags:
  - blockchain
  - security
  - wallets
status: published
publishDate: 2026-09-20
image: ../../assets/images/articles/crypto-wallet-self-custody-basics.webp
imageAlt: 'Illustration of a dark shield with a padlock on a sand-coloured background'
imageCredit: 'Illustration: TekkTech placeholder artwork'
seoDescription: 'A beginner-friendly guide to crypto self-custody: private keys, seed phrases, hot vs cold wallets, and practical security habits. Not financial advice.'
sources:
  - title: 'Ethereum wallets'
    url: 'https://ethereum.org/en/wallets/'
    publisher: 'ethereum.org'
  - title: 'Bitcoin: A Peer-to-Peer Electronic Cash System'
    url: 'https://bitcoin.org/bitcoin.pdf'
    publisher: 'Satoshi Nakamoto (2008)'
related:
  - how-blockchain-networks-differ
  - passkeys-explained
demo: true
---

*This guide explains how wallet security works. It is not financial or investment advice. Crypto-assets are high-risk, and mistakes with keys are usually irreversible.*

One of the most common misunderstandings in crypto is the idea that a wallet "holds" coins. It doesn't. Balances are recorded on the blockchain itself. What a wallet actually protects is the **private key** — the secret that proves you are allowed to move those funds.

Understanding that one idea makes the rest of wallet security much easier to follow.

## Keys, addresses and seed phrases

- A **private key** is a secret number. Anyone who has it can authorise transactions from the associated account.
- A **public address** is derived from the key and can be shared freely so people can send you funds.
- A **seed phrase** (also called a recovery phrase) is a list of words — commonly 12 or 24 — from which a wallet can regenerate your private keys. It is effectively a master key.

If you lose your seed phrase and your device, you may lose access permanently. If someone else obtains your seed phrase, they can take your funds. There is usually no bank or helpline that can reverse either outcome.

## Custodial vs self-custody

With a **custodial** service, such as many exchanges, the provider holds the keys on your behalf. It is convenient and often offers account recovery, but you are trusting the provider's security, solvency and policies.

With **self-custody**, you hold the keys yourself. As ethereum.org's wallet guide notes, wallet providers don't have custody of your funds — the wallet is an interface to your account, and you can switch wallet software while keeping control. That independence comes with full responsibility.

Neither is right for everyone. The important thing is to know which one you are using.

## Hot wallets and cold wallets

| Type | What it is | Strengths | Risks |
| --- | --- | --- | --- |
| Hot wallet | Software on an internet-connected phone, computer or browser | Convenient for frequent use | Exposed to malware, phishing and compromised devices |
| Cold wallet | Keys kept offline, typically on a dedicated hardware device | Keys never touch an internet-connected computer | Can be lost or damaged; needs careful setup |

Many people use both: a hot wallet for small, everyday amounts and a cold wallet for anything they cannot afford to lose.

## The security habits that matter most

### Protect the seed phrase

- Write it down on paper or another durable medium and store it somewhere safe and private.
- **Never** type it into a website, share it in a message, or store it in a photo, cloud document or password note unless you fully understand the risks.
- Consider whether a trusted person should know how to access it in an emergency.

### Assume anyone asking for it is a scammer

No legitimate wallet provider, exchange or support agent needs your seed phrase. Messages claiming your wallet needs "verification" or "synchronising" are a common phishing technique.

### Verify before you sign

Wallets ask you to approve transactions and permissions. Read what you are approving, check addresses carefully (malware can swap copied addresses), and be cautious about granting unlimited spending permissions to apps.

### Buy hardware from trusted sources

If you use a hardware wallet, buy it directly from the manufacturer or an authorised retailer, and set it up yourself so that the seed phrase is generated on the device. Never use a device that arrives with a pre-written seed phrase.

### Practise recovery with a small amount

Before trusting a setup with significant value, test that you can restore a wallet from your seed phrase using only a small amount.

## Common mistakes to avoid

- Keeping your entire balance in a browser wallet used for experimenting with new apps.
- Storing a seed phrase as a screenshot.
- Rushing a transaction because a message claims it is urgent.
- Assuming that a transaction can be cancelled or refunded.

## The bottom line

Self-custody gives you full control, and full responsibility. Protect the seed phrase above everything else, keep large amounts offline, and treat every unexpected request for your keys as an attack. If that level of responsibility feels uncomfortable, that is a reasonable signal to keep amounts small — or to stay out entirely.
