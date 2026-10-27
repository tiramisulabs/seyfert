<div align="center">
  <img src="./assets/icon.png" alt="Seyfert" width="200" />

# Seyfert

A TypeScript framework for building Discord bots.

[![License](https://img.shields.io/npm/l/seyfert?style=flat-square&color=white)](./LICENSE)
[![Version](https://img.shields.io/npm/v/seyfert?color=%23ff0000&logo=npm&style=flat-square)](https://www.npmjs.com/package/seyfert)
[![Discord](https://img.shields.io/discord/1003825077969764412?color=%23406da2&label=support&logo=discord&style=flat-square)](https://discord.com/invite/XNw2RZFzaP)

</div>

Seyfert brings Discord's API and gateway together with typed commands, interaction handlers, and plugins. Written in TypeScript for Node.js and Bun, it provides the tools to organize a bot while keeping the underlying Discord types and REST routes accessible.

## What it offers

- **Typed commands:** Application and prefix commands with option inference, choices, subcommands, and autocomplete. Contexts give handlers access to resolved options and the appropriate response methods.
- **Middleware and localization:** Share checks and preparation across commands, pass metadata to handlers, and translate command definitions and responses.
- **Interactions and builders:** Handle components and modals through dedicated contexts. Build responses with embeds, buttons, select menus, and layout components.
- **Discord resources:** Work with transformed structures and resource methods, or use the REST client directly when you need access to a route.
- **Gateway and cache:** Handle gateway and custom events, distribute connections across shards and workers, and choose which resources to cache with configurable adapters.
- **Plugins:** Package reusable commands, events, middleware, and client extensions with lifecycle hooks for setup and cleanup.

## Documentation and community

Explore the [documentation](https://seyfert.dev/guide) for guides and API usage, or join the [Discord server](https://discord.com/invite/XNw2RZFzaP) for questions and community support.

Contributions are welcome.

<a href="https://www.star-history.com/?repos=tiramisulabs%2Fseyfert&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=tiramisulabs/seyfert&type=date&theme=dark&legend=top-left&sealed_token=UNrJ9iHEmmnlVRygDYxO2q0eWbqNUrt2kUF-SYwj3laAXxzq7eXDFXQzWAZc8uovRAdLFcDUjWqz7gpb1Nf8J0I9JzVfcsnjT4rBcMPO46-6t4msr0kZwwxDgbhwcK07h4U_-i1Q80fEaA-V9gc27ZHUf646ucLdm8QeOT0AIshgiALFD7C5HUjY1do7" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=tiramisulabs/seyfert&type=date&legend=top-left&sealed_token=UNrJ9iHEmmnlVRygDYxO2q0eWbqNUrt2kUF-SYwj3laAXxzq7eXDFXQzWAZc8uovRAdLFcDUjWqz7gpb1Nf8J0I9JzVfcsnjT4rBcMPO46-6t4msr0kZwwxDgbhwcK07h4U_-i1Q80fEaA-V9gc27ZHUf646ucLdm8QeOT0AIshgiALFD7C5HUjY1do7" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=tiramisulabs/seyfert&type=date&legend=top-left&sealed_token=UNrJ9iHEmmnlVRygDYxO2q0eWbqNUrt2kUF-SYwj3laAXxzq7eXDFXQzWAZc8uovRAdLFcDUjWqz7gpb1Nf8J0I9JzVfcsnjT4rBcMPO46-6t4msr0kZwwxDgbhwcK07h4U_-i1Q80fEaA-V9gc27ZHUf646ucLdm8QeOT0AIshgiALFD7C5HUjY1do7" />
 </picture>
</a>
