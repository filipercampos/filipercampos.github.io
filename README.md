# filipercampos.github.io

Portfolio site for six backend architecture projects, each with an interactive in-browser demo.

| Project | Demo |
|---|---|
| [ledger-service](https://github.com/filipercampos/ledger-service) | Balanced postings + 50 buyers racing one wallet (naive vs row locks) |
| [platform-infra](https://github.com/filipercampos/platform-infra) | SLO multi-window burn-rate calculator |
| [order-saga-platform](https://github.com/filipercampos/order-saga-platform) | Saga stepper for every compensation path |
| [flash-sale-engine](https://github.com/filipercampos/flash-sale-engine) | Sale storm: check-then-act vs atomic gate |
| [serverless-doc-pipeline](https://github.com/filipercampos/serverless-doc-pipeline) | Duplicate events, spoofed and poison files through S3 → SQS → Lambda |
| [legacy-strangler-migration](https://github.com/filipercampos/legacy-strangler-migration) | Sticky percentage rollout with kill switch |

Demos are deterministic simplified models (`src/sim`, unit-tested); the real systems live in the linked repos.

```bash
npm ci
npm run dev    # local
npm test       # simulation tests
npm run build  # static output in dist/
```

Deployed by GitHub Actions to GitHub Pages on every push to `main`.
