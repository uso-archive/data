# Svelte Template Hot

This is a copy of official [Svelte template](https://github.com/sveltejs/template) with added HMR support. It lives at https://github.com/rixo/svelte-template-hot.

This template aims to remain as close to the official template as possible. Please refer to official docs for general usage. For HMR specific stuff, see bellow.

**:warning: Experimental :warning:**

This HMR implementation relies on Svelte's private & non documented API. This means that it can stop working with any new version of Svelte.

Progress of Svelte HMR support can be tracked in [this issue](https://github.com/sveltejs/svelte/issues/3632).

**Update 2020-02-24** We're [making progress](https://github.com/sveltejs/svelte/pull/3822) :)

**NOTE** This template pins the minor version of Svelte in `package.json`, using the [tilde comparator](https://docs.npmjs.com/misc/semver#tilde-ranges-123-12-1) because, in practice, HMR breakages tend to only happen with new minor versions of Svelte (not patch). And I don't want people to download a hot template with broken HMR... But, in your app, you can change this to your liking -- because you might be more interested in last version of Svelte than stable HMR, or be wise and pin the exact versions of all you dependencies.

## Installation

To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit rixo/svelte-template-hot svelte-app
cd svelte-app
npm install
```

Run the build script a first time, in order to avoid 404 errors about missing `bundle.css` in the browser:

```bash
npm run build
```

## Quick start

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and... Eyeball!

## Usage

HMR is supported both with [Nollup](https://github.com/PepsRyuu/nollup) or with Rollup itself with (very experimental) [rollup-plugin-hot](https://github.com/rixo/rollup-plugin-hot).

Nollup implements the shortest possible path from a file change to the module reloaded in the browser and is all in-memory. Said otherwise, it is insanely fast. Also, it has been around for some time so it is quite battle tested already.

The Rollup plugin on the other hand is still little more than a proof of concept by now, but it has better sourcemap support and error reporting (according to my own tastes at least).

Support for both Nollup and Rollup HMR is provided by [rollup-plugin-svelte-hot](https://github.com/rixo/rollup-plugin-svelte-hot). Please report issues regarding HMR in [this plugin's tracker](https://github.com/rixo/rollup-plugin-svelte-hot/issues). Or [this template's project](https://github.com/rixo/svelte-template-hot/issues) might make more sense. You be the judge.

### Start HMR server with Nollup

```bash
npm run dev:nollup
```

### Start Rollup with HMR support

```bash
npm run dev:rollup
```

### Start with LiveReload (no HMR)

This is the default `dev` of official template.

```bash
npm run dev:livereload
```

### Start with default method

Nollup HMR is also aliased as `dev` so you can simply run:

```bash
npm run dev
```

You can change the default `dev` script to your preferred method in the `scripts` section of `package.json`.

**2020-06-29** Nollup has been made the default `dev` script (instead of Rollup) because just released Nollup 0.12.0 fixes support for Svelte sourcemaps and dynamic imports, and Nollup is monstrously fast (especially on the most important metrics, that is rebuild time in big projects)!

The suggested workflow is to use Nollup for dev and enjoy instant feedback loop. If you need a plugin that doesn't work with Nollup, or if you are in a situation that Nollup makes harder to debug (mainly because of it running your code through eval), you can fallback on `npm run dev:rollup` (HMR with rollup-plugin-hot). If you have a bug that you suspect might be caused by HMR or HMR code transform, confirm by turning back to `npm run dev:livereload`.

### Build

```bash
npm run build
```
