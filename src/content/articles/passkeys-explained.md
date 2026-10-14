---
title: 'Passkeys explained: the technology replacing passwords'
slug: passkeys-explained
excerpt: 'Passkeys let you sign in with the same fingerprint, face scan or PIN you use to unlock your device — and they are designed to resist phishing. Here is how they work and what to watch out for.'
category: consumer-tech
type: explainer
tags:
  - security
  - privacy
  - emerging tech
status: published
publishDate: 2026-09-12
image: ../../assets/images/articles/passkeys-explained.webp
imageAlt: 'Illustration of a key symbol inside concentric rings on a pale blue background'
imageCredit: 'Illustration: TekkTech placeholder artwork'
seoDescription: 'What are passkeys? A clear explainer on how passkeys use public-key cryptography to replace passwords, why they resist phishing, and their current limitations.'
sources:
  - title: 'Passkeys'
    url: 'https://fidoalliance.org/passkeys/'
    publisher: 'FIDO Alliance'
  - title: 'Web Authentication: An API for accessing Public Key Credentials'
    url: 'https://www.w3.org/TR/webauthn/'
    publisher: 'W3C'
  - title: 'Bringing passkeys to Android & Chrome'
    url: 'https://android-developers.googleblog.com/2022/10/bringing-passkeys-to-android-and-chrome.html'
    publisher: 'Android Developers Blog (October 2022)'
related:
  - assess-software-privacy-claims
  - crypto-wallet-self-custody-basics
demo: true
---

Passwords have been the default way to sign in for decades, and their weaknesses are well known: people reuse them, forget them, and type them into convincing fake websites. **Passkeys** are designed to replace them. Instead of something you remember, a passkey is a cryptographic credential stored on your devices and unlocked the same way you unlock your phone or computer.

This explainer covers how passkeys work, why they resist common attacks, and the practical questions that remain.

## What a passkey is

The FIDO Alliance, the industry group behind the underlying standards, describes passkeys as FIDO credentials that let you sign in to apps and websites using the same method you use to unlock your device — such as a fingerprint, a face scan or a device PIN. The term is intended to be vendor-neutral rather than tied to one company's products.

On the web, passkeys build on the W3C **Web Authentication (WebAuthn)** standard, which browsers implement so websites can request and verify these credentials.

## How it works: two keys instead of one secret

Passkeys use **public-key cryptography**. When you create a passkey for a website, your device generates a matched pair of keys:

- a **private key**, which stays on your device (or in your encrypted password manager or platform keychain); and
- a **public key**, which is sent to the website and stored with your account.

When you sign in, the website sends a random challenge. Your device asks you to unlock it — with biometrics or a PIN — and then uses the private key to sign the challenge. The website checks the signature with the public key. If it matches, you are in.

Crucially, **the private key is never sent to the website**, and your fingerprint or face data does not leave your device. The biometric step only unlocks the key locally.

## Why passkeys resist phishing

A passkey is tied to the website it was created for. Your device will only use it on the genuine site's domain, so a look-alike phishing page cannot trick it into signing in. That is a major improvement over passwords and over one-time codes, which people can be persuaded to type into fake pages.

Passkeys also limit the damage from data breaches. A website stores only public keys, which are useless to an attacker trying to sign in as you. And because each passkey is unique to one site, there is nothing to reuse elsewhere.

## Syncing and using other devices

Many platforms and password managers can **sync passkeys** across your devices using end-to-end encryption, so a passkey created on your phone can be available on your laptop. You can also often sign in on a nearby device — for example a friend's computer — by scanning a QR code with your phone, without copying the passkey to that computer.

## What to watch out for

Passkeys are a significant improvement, but they come with considerations:

- **Account recovery.** If you lose all the devices that hold your passkeys, recovery depends on the provider's backup options and the website's recovery process. Set up more than one device or a trusted password manager.
- **Ecosystem choices.** Where your passkeys are stored — a platform keychain or a third-party password manager — affects how easily you can use them across different operating systems. Standards work on moving passkeys between providers is ongoing.
- **Mixed support.** Not every website supports passkeys yet, and many still keep a password as a fallback, which remains a weaker point until it is removed.
- **Shared devices.** Anyone who can unlock your device may be able to use passkeys stored on it.

## Should you start using them?

For most people, using passkeys where they are offered is a sensible security upgrade, particularly for important accounts such as email, which is often the key to resetting everything else. Keep your device lock strong, make sure you have a backup device or password manager, and keep recovery options up to date.

## The bottom line

Passkeys replace a shared secret with cryptographic proof that never leaves your device. That makes them far harder to phish, steal or reuse than passwords. They are not yet universal, and recovery planning matters, but the direction of travel is clear.
