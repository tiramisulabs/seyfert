import { Options, bgBrightWhite, black, bold, cyan, gray, italic, red, yellow } from './Util';

export enum LogLevels {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4
}

export enum LogDepth {
  Minimal = 0,
  Full = 1
}

export type LoggerOptions = {
  logLevel?: LogLevels;
  name?: string;
  active?: boolean;
};

export class Logger {
  readonly options: Required<LoggerOptions>;

  constructor(options: LoggerOptions) {
    this.options = Options(Logger.DEFAULT_OPTIONS, options);
  }

  set level(level: LogLevels) {
    this.options.logLevel = level;
  }

  get level(): LogLevels {
    return this.options.logLevel;
  }

  set active(active: boolean) {
    this.options.active = active;
  }

  get active(): boolean {
    return this.options.active;
  }

  set name(name: string) {
    this.options.name = name;
  }

  get name(): string {
    return this.options.name;
  }

  rawLog(level: LogLevels, ...args: unknown[]) {
    if (!this.active) return;
    if (level < this.level) return;

    const color = Logger.colorFunctions.get(level) ?? Logger.noColor;

    const date = new Date();
    const log = [
      bgBrightWhite(black(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`)),
      color(Logger.prefixes.get(level) ?? 'DEBUG'),
      this.name ? `${this.name} >` : '>',
      ...args
    ];

    switch (level) {
      case LogLevels.Debug:
        return console.debug(...log);
      case LogLevels.Info:
        return console.info(...log);
      case LogLevels.Warn:
        return console.warn(...log);
      case LogLevels.Error:
        return console.error(...log);
      case LogLevels.Fatal:
        return console.error(...log);
      default:
        return console.log(...log);
    }
  }

  debug(...args: any[]) {
    this.rawLog(LogLevels.Debug, ...args);
  }

  info(...args: any[]) {
    this.rawLog(LogLevels.Info, ...args);
  }

  warn(...args: any[]) {
    this.rawLog(LogLevels.Warn, ...args);
  }

  error(...args: any[]) {
    this.rawLog(LogLevels.Error, ...args);
  }

  fatal(...args: any[]) {
    this.rawLog(LogLevels.Fatal, ...args);
  }

  static DEFAULT_OPTIONS: Required<LoggerOptions> = {
    logLevel: LogLevels.Info,
    name: 'BISCUIT',
    active: true
  };

  static noColor(msg: string) {
    return msg;
  }

  static colorFunctions = new Map<LogLevels, (str: string) => string>([
    [LogLevels.Debug, gray],
    [LogLevels.Info, cyan],
    [LogLevels.Warn, yellow],
    [LogLevels.Error, (str: string) => red(str)],
    [LogLevels.Fatal, (str: string) => red(bold(italic(str)))]
  ]);

  static prefixes = new Map<LogLevels, string>([
    [LogLevels.Debug, 'DEBUG'],
    [LogLevels.Info, 'INFO'],
    [LogLevels.Warn, 'WARN'],
    [LogLevels.Error, 'ERROR'],
    [LogLevels.Fatal, 'FATAL']
  ]);
}
