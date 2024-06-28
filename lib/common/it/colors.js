"use strict";
// https://github.com/discordeno/discordeno/blob/main/packages/utils/src/colors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.setColorEnabled = setColorEnabled;
exports.getColorEnabled = getColorEnabled;
exports.reset = reset;
exports.bold = bold;
exports.dim = dim;
exports.italic = italic;
exports.underline = underline;
exports.inverse = inverse;
exports.hidden = hidden;
exports.strikethrough = strikethrough;
exports.black = black;
exports.red = red;
exports.green = green;
exports.yellow = yellow;
exports.blue = blue;
exports.magenta = magenta;
exports.cyan = cyan;
exports.white = white;
exports.gray = gray;
exports.brightBlack = brightBlack;
exports.brightRed = brightRed;
exports.brightGreen = brightGreen;
exports.brightYellow = brightYellow;
exports.brightBlue = brightBlue;
exports.brightMagenta = brightMagenta;
exports.brightCyan = brightCyan;
exports.brightWhite = brightWhite;
exports.bgBlack = bgBlack;
exports.bgRed = bgRed;
exports.bgGreen = bgGreen;
exports.bgYellow = bgYellow;
exports.bgBlue = bgBlue;
exports.bgMagenta = bgMagenta;
exports.bgCyan = bgCyan;
exports.bgWhite = bgWhite;
exports.bgBrightBlack = bgBrightBlack;
exports.bgBrightRed = bgBrightRed;
exports.bgBrightGreen = bgBrightGreen;
exports.bgBrightYellow = bgBrightYellow;
exports.bgBrightBlue = bgBrightBlue;
exports.bgBrightMagenta = bgBrightMagenta;
exports.bgBrightCyan = bgBrightCyan;
exports.bgBrightWhite = bgBrightWhite;
exports.rgb8 = rgb8;
exports.bgRgb8 = bgRgb8;
exports.rgb24 = rgb24;
exports.bgRgb24 = bgRgb24;
exports.stripColor = stripColor;
let enabled = true;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */
function setColorEnabled(value) {
    enabled = value;
}
/** Get whether text color change is enabled or disabled. */
function getColorEnabled() {
    return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */
function code(open, close) {
    return {
        open: `\x1b[${open.join(';')}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, 'g'),
    };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Reset the text modified
 * @param str text to reset
 */
function reset(str) {
    return run(str, code([0], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */
function bold(str) {
    return run(str, code([1], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */
function dim(str) {
    return run(str, code([2], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */
function italic(str) {
    return run(str, code([3], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */
function underline(str) {
    return run(str, code([4], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */
function inverse(str) {
    return run(str, code([7], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */
function hidden(str) {
    return run(str, code([8], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */
function strikethrough(str) {
    return run(str, code([9], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */
function black(str) {
    return run(str, code([30], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */
function red(str) {
    return run(str, code([31], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */
function green(str) {
    return run(str, code([32], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */
function yellow(str) {
    return run(str, code([33], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */
function blue(str) {
    return run(str, code([34], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */
function magenta(str) {
    return run(str, code([35], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */
function cyan(str) {
    return run(str, code([36], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */
function white(str) {
    return run(str, code([37], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */
function gray(str) {
    return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */
function brightBlack(str) {
    return run(str, code([90], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */
function brightRed(str) {
    return run(str, code([91], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */
function brightGreen(str) {
    return run(str, code([92], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */
function brightYellow(str) {
    return run(str, code([93], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */
function brightBlue(str) {
    return run(str, code([94], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */
function brightMagenta(str) {
    return run(str, code([95], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */
function brightCyan(str) {
    return run(str, code([96], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */
function brightWhite(str) {
    return run(str, code([97], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */
function bgBlack(str) {
    return run(str, code([40], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */
function bgRed(str) {
    return run(str, code([41], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */
function bgGreen(str) {
    return run(str, code([42], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */
function bgYellow(str) {
    return run(str, code([43], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */
function bgBlue(str) {
    return run(str, code([44], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */
function bgMagenta(str) {
    return run(str, code([45], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */
function bgCyan(str) {
    return run(str, code([46], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */
function bgWhite(str) {
    return run(str, code([47], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */
function bgBrightBlack(str) {
    return run(str, code([100], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */
function bgBrightRed(str) {
    return run(str, code([101], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */
function bgBrightGreen(str) {
    return run(str, code([102], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */
function bgBrightYellow(str) {
    return run(str, code([103], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */
function bgBrightBlue(str) {
    return run(str, code([104], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */
function bgBrightMagenta(str) {
    return run(str, code([105], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */
function bgBrightCyan(str) {
    return run(str, code([106], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */
function bgBrightWhite(str) {
    return run(str, code([107], 49));
}
/* Special Color Sequences */
/**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */
function clampAndTruncate(n, max = 255, min = 0) {
    return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */
function rgb8(str, color) {
    return run(str, code([38, 5, clampAndTruncate(color)], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */
function bgRgb8(str, color) {
    return run(str, code([48, 5, clampAndTruncate(color)], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { rgb24 } from "./colors.ts";
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
function rgb24(str, color) {
    if (typeof color === 'number') {
        return run(str, code([38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 39));
    }
    return run(str, code([38, 2, clampAndTruncate(color.r), clampAndTruncate(color.g), clampAndTruncate(color.b)], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { bgRgb24 } from "./colors.ts";
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
function bgRgb24(str, color) {
    if (typeof color === 'number') {
        return run(str, code([48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 49));
    }
    return run(str, code([48, 2, clampAndTruncate(color.r), clampAndTruncate(color.g), clampAndTruncate(color.b)], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
].join('|'), 'g');
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */
function stripColor(string) {
    return string.replace(ANSI_PATTERN, '');
}
