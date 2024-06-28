"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Embed = void 0;
const common_1 = require("../common");
/**
 * Represents a message embed.
 * @example
 * const embed = new Embed();
 * embed.setTitle('Seyfert');
 * embed.setDescription('Better than discord.js');
 * embed.setColor('Green');
 * const embedJSON = embed.json();
 */
class Embed {
    data;
    /**
     * Creates a new instance of Embed.
     * @param data - The initial data for the embed.
     * @example
     * const embed = new Embed({ title: 'Hello', description: 'This is an example embed' });
     */
    constructor(data = {}) {
        this.data = data;
        if (!data.fields)
            this.data.fields = [];
    }
    /**
     * Sets the author of the embed.
     * @param author - The author information.
     * @returns The updated Embed instance.
     * @example
     * embed.setAuthor({ name: 'John Doe', iconURL: 'https://example.com/avatar.png' });
     */
    setAuthor(author) {
        this.data.author = (0, common_1.toSnakeCase)(author);
        return this;
    }
    /**
     * Sets the color of the embed.
     * @param color - The color of the embed.
     * @returns The updated Embed instance.
     * @example
     * embed.setColor('#FF0000');
     * embed.setColor('Blurple');
     */
    setColor(color) {
        this.data.color = (0, common_1.resolveColor)(color);
        return this;
    }
    /**
     * Sets the description of the embed.
     * @param desc - The description of the embed.
     * @returns The updated Embed instance.
     * @example
     * embed.setDescription('This is the description of the embed');
     */
    setDescription(desc) {
        this.data.description = desc;
        return this;
    }
    /**
     * Adds one or more fields to the embed.
     * @param fields - The fields to add to the embed.
     * @returns The updated Embed instance.
     * @example
     * embed.addFields({ name: 'Field 1', value: 'Value 1' }, { name: 'Field 2', value: 'Value 2' });
     */
    addFields(...fields) {
        this.data.fields = this.data.fields.concat(fields.flat());
        return this;
    }
    /**
     * Sets the fields of the embed.
     * @param fields - The fields of the embed.
     * @returns The updated Embed instance.
     * @example
     * embed.setFields([{ name: 'Field 1', value: 'Value 1' }, { name: 'Field 2', value: 'Value 2' }]);
     */
    setFields(fields) {
        this.data.fields = fields;
        return this;
    }
    /**
     * Sets the footer of the embed.
     * @param footer - The footer information.
     * @returns The updated Embed instance.
     * @example
     * embed.setFooter({ text: 'This is the footer', iconURL: 'https://example.com/footer.png' });
     */
    setFooter(footer) {
        this.data.footer = (0, common_1.toSnakeCase)(footer);
        return this;
    }
    /**
     * Sets the image of the embed.
     * @param url - The URL of the image.
     * @returns The updated Embed instance.
     * @example
     * embed.setImage('https://example.com/image.png');
     */
    setImage(url) {
        this.data.image = { url };
        return this;
    }
    /**
     * Sets the timestamp of the embed.
     * @param time - The timestamp value.
     * @returns The updated Embed instance.
     * @example
     * embed.setTimestamp();
     * embed.setTimestamp(1628761200000);
     * embed.setTimestamp(new Date());
     */
    setTimestamp(time = Date.now()) {
        this.data.timestamp = new Date(time).toISOString();
        return this;
    }
    /**
     * Sets the title of the embed.
     * @param title - The title of the embed.
     * @returns The updated Embed instance.
     * @example
     * embed.setTitle('This is the title');
     */
    setTitle(title) {
        this.data.title = title;
        return this;
    }
    /**
     * Sets the URL of the embed.
     * @param url - The URL of the embed.
     * @returns The updated Embed instance.
     * @example
     * embed.setURL('https://seyfert.com');
     */
    setURL(url) {
        this.data.url = url;
        return this;
    }
    /**
     * Sets the thumbnail of the embed.
     * @param url - The URL of the thumbnail.
     * @returns The updated Embed instance.
     * @example
     * embed.setThumbnail('https://example.com/thumbnail.png');
     */
    setThumbnail(url) {
        this.data.thumbnail = url ? { url } : undefined;
        return this;
    }
    /**
     * Converts the Embed instance to a JSON object.
     * @returns The JSON representation of the MessageEmbed instance.
     */
    toJSON() {
        return { ...this.data };
    }
}
exports.Embed = Embed;
