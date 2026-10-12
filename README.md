# RedundancyGuard AI

A lightweight industrial network router readiness and predictive monitoring lab inspired by ABB research on redundant router health in System 800xA networks.

**Live demo:** [redundancyguard-ai.charanvaranasi44.workers.dev](https://redundancyguard-ai.charanvaranasi44.workers.dev)

## Features

### Industrial Network Monitor

- Interactive industrial network topology
- RNRP active/standby redundancy simulation
- PRP parallel-path traffic simulation
- Router readiness scores from 0–100
- Bandwidth, latency, jitter, packet loss, CPU, and interface-error monitoring
- Bandwidth degradation, CPU overload, packet-loss, and latency fault injection
- Failover capacity evaluation
- Explainable readiness factors and deterministic telemetry trends

### Readiness Evaluation Lab

- Adjustable probe intervals and packet sizes
- Calculated monitoring overhead
- Threshold-based and weighted readiness scoring
- Detection delay, sensitivity, false-positive, and false-negative analysis
- Synthetic ground-truth comparison
- Scenario comparison charts
- Exportable Markdown research report

## Readiness Model

The weighted readiness score uses:

- 30% bandwidth headroom
- 18% latency stability
- 12% jitter stability
- 18% packet integrity
- 14% router CPU health
- 8% interface health

RNRP models one active production path with a standby failover path. PRP models duplicated production traffic across two parallel LANs.

All telemetry is deterministic and generated locally. The application does not connect to real industrial equipment or external APIs.

## Technology

- React
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React
- Vite
- Cloudflare Workers Static Assets
- Wrangler

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Production Build

```bash
npm run build
```

The generated production files are written to `dist/`.

## Cloudflare Deployment

Authenticate Wrangler:

```bash
npx wrangler login
```

Build and deploy:

```bash
npm run build
npm run deploy
```

## Project Structure

```text
src/
├── App.tsx          # Dashboard, simulations, scoring, and evaluation
├── index.css        # Tailwind and visual styling
└── main.tsx         # React entry point

wrangler.jsonc       # Cloudflare deployment configuration
vite.config.ts       # Vite configuration
```

## Important Notice

RedundancyGuard AI is a research and demonstration tool. Its simulations, readiness scores, alerts, and failover results must not be used as a substitute for validated industrial network monitoring, safety systems, or engineering assessment.

## License

MIT
