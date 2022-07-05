import { ButtonBuilder, InputTextBuilder, SelectMenuBuilder } from "../mod.ts";
import { Snowflake } from "./Snowflake.ts";

export type AnyComponentBuilder = InputTextBuilder | SelectMenuBuilder | ButtonBuilder;
export type ComponentEmoji = {
    id: Snowflake;
    name: string;
    animated?: boolean;
};
