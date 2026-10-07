# How To Contribute

## Installation

- `git clone https://github.com/prysmex/ember-mapbox-gl`
- `cd ember-mapbox-gl`
- `pnpm install`

## Mapbox access token

The tests and the demo app need a Mapbox access token. Never commit it.
Put it in `.env.development.local` (git-ignored):

```sh
VITE_MAPBOX_ACCESS_TOKEN=pk.your-token
```

or export `VITE_MAPBOX_ACCESS_TOKEN` in your shell. CI reads it from the
`MAPBOX_ACCESS_TOKEN` repository secret.

## Linting

- `pnpm lint`
- `pnpm lint:fix`

## Building the addon

- `pnpm build`

## Running tests

- `pnpm test` – Runs the test suite on the current Ember version
- `pnpm start`, then visit [http://localhost:5173/tests/](http://localhost:5173/tests/) – Runs the test suite in the browser in "watch mode"

## Running the demo application

- `pnpm start`
- Visit the demo application at [http://localhost:5173](http://localhost:5173).
