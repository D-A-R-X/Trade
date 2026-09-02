# Signal Tracker (demo / paper-trading)

A tool that listens to a Telegram trading-signal channel, parses each signal, and
**logs what would have happened** — without placing a single real trade. The point
is to measure the *true* win rate of a signal channel (including the losses the
channel never posts) before you ever risk real money.

> ⚠️ **Read this first.** This project deliberately does **not** place live trades.
> Signal channels advertising "100%" win rates and martingale ("GALE1 + GALE2 if
> loss") recovery are, over time, mathematically losing systems on sub-100% payouts.
> Use this tool to collect a few weeks of honest data. Let the numbers decide for you.

## What it does

1. **Listens** to a Telegram channel using your own user account (Telethon).
2. **Parses** each signal into structured fields: asset, direction (CALL/PUT),
   entry time, timeframe, gale levels.
3. **Stores** every signal in a local SQLite database.
4. **Tracks outcomes** two independent ways:
   - **Channel-claimed** — parses the channel's own follow-up GAIN/WIN/LOSS posts.
   - **Independent** — an optional price adapter (e.g. Quotex *demo* feed) that
     checks the actual candle direction at expiry. This is the honest number.
5. **Reports** a stats summary: real win rate, martingale-adjusted P/L, drawdown.

## What it does NOT do

- It does not log into Quotex with real money.
- It does not place, size, or martingale live trades.
- It is not investment advice.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate         # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env         # then fill in the values
```

Get `API_ID` and `API_HASH` from https://my.telegram.org (Login → API development
tools). These identify *your* Telegram app; keep them private.

## Run

```bash
python -m app.main listen      # start listening + logging signals
python -m app.main stats       # print the win-rate report so far
python -m app.main backfill     # re-scan recent channel history
```

On first run you'll be asked for your phone number and a login code (sent in
Telegram). A session file is saved so you won't re-enter it each time.

## Layout

```
app/
  main.py            # CLI entrypoint
  config.py          # loads .env
  parser.py          # signal + result text -> structured data
  storage.py         # SQLite persistence
  listener.py        # Telethon client, wires messages -> parser -> storage
  outcomes.py        # resolves signal outcomes, computes stats
  pricefeed.py       # pluggable price source (demo adapter interface)
tests/
  test_parser.py     # parser unit tests (run: pytest)
```
