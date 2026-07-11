<div align='center'>
  <img src="./assets/icon.png" alt="seyfert" width="200px" />

  **Seyfert is a brand-new Discord framework to take the bot development to a next level**

  [![License](https://img.shields.io/npm/l/seyfert?style=flat-square&logo=apache&color=white)](https://github.com/tiramisulabs/seyfert/blob/main/LICENSE)
  [![Version](https://img.shields.io/npm/v/seyfert?color=%23ff0000&logo=npm&style=flat-square)](https://www.npmjs.com/package/seyfert)
  [![Discord](https://img.shields.io/discord/1003825077969764412?color=%23406da2&label=support&logo=discord&style=flat-square)](https://discord.com/invite/XNw2RZFzaP)

</div>

## FAQ
### So, what is `seyfert`?
Seyfert is the ultimate Discord framework! We make it easy to interact with the Discord API, big cache control, scalable code and a pretty dev experience.

### Why should I use it?
There are many reasons to use Seyfert, but they dont all fit in this tiny readme, so here is a list of the most awesome reasons!

- **Low RAM Usage**
- **Latest features**
- **Dev experience**
- **24/6 support (Sunday is for church)**
- **Written from Scratch**
- **Type-safe**
- **And many more!!**


## Installation
> [!NOTE]
> Node v18>= (or v16 with `--experimental-fetch` flag), Deno v2.6.9>= is required.
> Bun/Node/Deno LTS recommended.

```sh
pnpm add seyfert
```

```sh
deno add npm:seyfert
```

```sh
bun add seyfert
```

```sh
npm i seyfert
```
> Or other package manager.

## Contributing
We are open to contributions, fork the repo and make your changes!

## Typed errors

Seyfert throws `SeyfertError` in validation/runtime checks and can include:

- `code`: machine-readable identifier (`INVALID_EMOJI`, `INVALID_OPTIONS_LENGTH`, `MISSING_COMPONENT`, etc.)
- `metadata`: structured context for diagnostics

For validation errors, metadata follows this convention:

- `expected`: expected value/shape
- `received`: value actually received
- `receivedType`: optional primitive/runtime type

## Useful links

- [GitHub Repository](https://github.com/tiramisulabs/seyfert)
- [Discord server](https://discord.com/invite/XNw2RZFzaP)
- [npm - core](https://www.npmjs.com/package/seyfert)
- [Website](https://seyfert.dev)
- [Documentation](https://seyfert.dev/guide)

<a href="https://www.star-history.com/?repos=tiramisulabs%2Fseyfert&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=tiramisulabs/seyfert&type=date&theme=dark&legend=top-left&sealed_token=UNrJ9iHEmmnlVRygDYxO2q0eWbqNUrt2kUF-SYwj3laAXxzq7eXDFXQzWAZc8uovRAdLFcDUjWqz7gpb1Nf8J0I9JzVfcsnjT4rBcMPO46-6t4msr0kZwwxDgbhwcK07h4U_-i1Q80fEaA-V9gc27ZHUf646ucLdm8QeOT0AIshgiALFD7C5HUjY1do7" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=tiramisulabs/seyfert&type=date&legend=top-left&sealed_token=UNrJ9iHEmmnlVRygDYxO2q0eWbqNUrt2kUF-SYwj3laAXxzq7eXDFXQzWAZc8uovRAdLFcDUjWqz7gpb1Nf8J0I9JzVfcsnjT4rBcMPO46-6t4msr0kZwwxDgbhwcK07h4U_-i1Q80fEaA-V9gc27ZHUf646ucLdm8QeOT0AIshgiALFD7C5HUjY1do7" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=tiramisulabs/seyfert&type=date&legend=top-left&sealed_token=UNrJ9iHEmmnlVRygDYxO2q0eWbqNUrt2kUF-SYwj3laAXxzq7eXDFXQzWAZc8uovRAdLFcDUjWqz7gpb1Nf8J0I9JzVfcsnjT4rBcMPO46-6t4msr0kZwwxDgbhwcK07h4U_-i1Q80fEaA-V9gc27ZHUf646ucLdm8QeOT0AIshgiALFD7C5HUjY1do7" />
 </picture>
</a>
