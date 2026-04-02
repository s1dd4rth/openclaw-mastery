# Day 1: Deploy Your OpenClaw Instance

This file covers getting OpenClaw running on Hostinger. Complete every step before moving on to the security verification.

---

## 1. Get an LLM API Key

If you don't already have an API key for one of the supported LLMs (Claude, GPT-4, Gemini, etc.), get one before continuing. You will need it during the Hostinger setup wizard.

---

## 2. Create a Hostinger Account and Launch Your VPS

Go to [https://levelup-labs.ai/HOSTINGER-OPENCLAW](https://levelup-labs.ai/HOSTINGER-OPENCLAW) and follow the video below to:

1. Create a Hostinger account
2. Create a new VPS
3. Select the OpenClaw one-click template
4. Complete the setup wizard (you will be asked for your LLM API key)

[![Watch the setup video](https://img.youtube.com/vi/JXWmkPCcF7E/0.jpg)](https://youtu.be/JXWmkPCcF7E)

The Hostinger template runs OpenClaw inside a Docker container. Hostinger's proxy handles external access, so you interact with your Claw through the web chat UI it provides.

---

## 3. Confirm OpenClaw Is Running

Once the VPS finishes provisioning, open the web chat URL from your Hostinger dashboard.

Send a simple message — anything will do:

> Hello

**Expected:** Your Claw responds. If it does not respond within 2 minutes, go to your Hostinger dashboard and restart the VPS, then try again.

Once you see a response, your Claw is live.

---

## 4. Note Your Access Details

Before continuing, confirm you have:

- The web chat URL (from your Hostinger dashboard)
- SSH access to the VPS (username, IP address, and password or key)

You will use SSH in the security verification step.

---

## What Should Be True After This Step

- [ ] VPS is running on Hostinger
- [ ] OpenClaw is responding in the web chat
- [ ] You have SSH access to the VPS

Once all three are true, proceed to the security verification.
