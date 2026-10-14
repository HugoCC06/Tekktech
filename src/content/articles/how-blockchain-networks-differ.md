---
title: 'How blockchain networks differ: consensus, fees and finality explained'
slug: how-blockchain-networks-differ
excerpt: 'Not all blockchains work the same way. Here is a plain-English guide to the design choices — consensus, fees, finality and programmability — that separate one network from another.'
category: crypto
type: explainer
tags:
  - blockchain
  - consensus
  - explainers
status: published
featured: true
publishDate: 2026-10-08
image: ../../assets/images/articles/how-blockchain-networks-differ.webp
imageAlt: 'Abstract illustration of a chain of connected blocks on a sand-coloured grid'
imageCaption: 'Every blockchain is a chain of blocks — the differences lie in how those blocks are agreed upon.'
imageCredit: 'Illustration: TekkTech placeholder artwork'
seoTitle: 'How blockchain networks differ: consensus, fees and finality'
seoDescription: 'A plain-English explainer on the design choices that separate blockchain networks: consensus mechanisms, transaction fees, finality and programmability.'
sources:
  - title: 'Bitcoin: A Peer-to-Peer Electronic Cash System'
    url: 'https://bitcoin.org/bitcoin.pdf'
    publisher: 'Satoshi Nakamoto (2008)'
  - title: 'Proof-of-stake (PoS)'
    url: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/'
    publisher: 'ethereum.org developer documentation'
  - title: 'Proof-of-work (PoW)'
    url: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/'
    publisher: 'ethereum.org developer documentation'
related:
  - crypto-wallet-self-custody-basics
demo: true
---

People often talk about "the blockchain" as if there were only one. In reality there are many independent networks, and they make very different engineering choices. Those choices determine how a network stays secure, how much it costs to use, how quickly a payment becomes irreversible, and what kinds of applications it can support.

This explainer walks through the four design questions that matter most. It describes how the technology works; it is not investment advice, and it makes no claims about the future value of any asset.

## What every blockchain has in common

At its core, a blockchain is a shared record of transactions that many independent computers maintain together. Transactions are grouped into **blocks**, and each block contains a cryptographic fingerprint (a hash) of the block before it. Changing an old block would change its fingerprint and break every link that follows, which is what makes the history tamper-evident.

The hard problem is agreement. If thousands of computers around the world each receive transactions in a slightly different order, how do they settle on a single version of the history without trusting a central operator? The answer is a **consensus mechanism**, and it is the first big way that networks differ.

## 1. Consensus: how the network agrees

### Proof of work

Bitcoin's original design, described in the 2008 Bitcoin white paper, uses **proof of work**. Participants called miners compete to find a number that, combined with the block's contents, produces a hash meeting a difficulty target. Finding it requires enormous numbers of guesses, so producing blocks costs real-world energy and hardware. Rewriting history would mean redoing that work faster than the rest of the network combined.

The trade-off is well known: proof of work is battle-tested and conceptually simple, but it consumes large amounts of electricity by design.

### Proof of stake

**Proof of stake** replaces computational work with locked-up capital. Validators deposit ("stake") the network's native token as collateral. They are chosen to propose and attest to blocks, earn rewards for honest behaviour, and can have part of their stake destroyed ("slashed") for provably dishonest behaviour. Ethereum moved from proof of work to proof of stake in 2022, and its developer documentation explains the mechanism in detail.

Proof of stake uses far less energy than proof of work. Its critics argue that it can concentrate influence among those who already hold large stakes, and its security assumptions are different rather than simply better or worse.

### Other approaches

Some networks use smaller, permissioned sets of validators, or variants of Byzantine fault-tolerant protocols. These can be faster, but they generally rely on a smaller, more identifiable group of participants. When you read about a network, it is worth asking: *who* can validate, and how many independent parties would have to collude to cheat?

## 2. Fees: who pays, and why they change

Block space is limited, so networks need a way to decide which transactions get included. Most use fees paid in the native token. When demand is high, users bid more to get included sooner, and fees rise; when demand falls, so do fees.

Networks differ in how fees are calculated and where they go. Some simply pay fees to the block producer. Others burn part of each fee, or use a base fee that adjusts automatically with demand. For an everyday user, the practical points are simple: fees vary over time, they can spike during busy periods, and the cheapest network is not automatically the most secure one.

## 3. Finality: when is a transaction really done?

**Finality** describes the point at which a transaction can no longer be reversed. It is one of the most misunderstood properties of blockchains.

- **Probabilistic finality** (typical of proof-of-work chains) means a transaction becomes *more* certain as more blocks are added on top of it, but never mathematically absolute. This is why services often wait for several confirmations before treating a payment as settled.
- **Economic or deterministic finality** (offered by many proof-of-stake designs) means that, once a checkpoint is finalised, reversing it would require a large, provable and costly violation of the protocol rules.

The time to finality ranges from seconds to many minutes depending on the network and how cautious the recipient wants to be.

## 4. Programmability: what can you build?

Bitcoin's scripting language is deliberately limited, which keeps the base layer simple. Networks such as Ethereum support general-purpose **smart contracts** — programs stored on the chain that execute when called. That enables decentralised exchanges, lending protocols and token standards, but it also widens the attack surface: bugs in smart contracts have led to significant losses.

Many networks now also rely on **layer 2** systems that process transactions off the main chain and post compressed proofs or data back to it. They can reduce fees, at the cost of extra complexity and new trust assumptions.

## How to compare networks sensibly

When you encounter a new network, a few questions cut through most of the marketing:

| Question | Why it matters |
| --- | --- |
| How does consensus work, and who can participate? | Determines how decentralised and attack-resistant the network is. |
| How are fees set, and how do they behave under load? | Affects real-world cost, especially at busy times. |
| How long until a transaction is final? | Matters for anyone accepting payments. |
| What can developers build, and how is code audited? | More capability means more potential for bugs. |
| How long has the network operated without major failures? | Track record is evidence; promises are not. |

## What we know, and what remains uncertain

The mechanisms described above are documented in primary sources such as the Bitcoin white paper and Ethereum's developer documentation. What is far less certain is how any given network will evolve, how regulation will develop, and how new designs will hold up under real attack. Be sceptical of anyone who presents those open questions as settled — in either direction.
