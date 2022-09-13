# @biscuitland/cache

## Most importantly, biscuit's cache is:

A resource control cache layer, based on carriers and resource-intensive policies

[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/oasisjs/biscuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/cache
```

## Example (Basic)

```ts
import { Cache, MemoryCacheAdapter } from '@biscuitland/cache';

const bootstrap = async () => {
	const cache = new Cache({
		adapter: new MemoryCacheAdapter(),
	});

    // You can listen to the raw biscuit event

    cache.start(<payloads>);
};

bootstrap();
```

## Links

-   [Documentation](https://docs.biscuitjs.com/)
-   [Website](https://biscuitjs.com/)
