import { ComponentType, APIMessageActionRowComponent } from "discord-api-types/v10";
import { Session } from "../../session";
import { BiscuitActionRowMessageComponents } from "../../utils/types";

import { BaseComponent } from "../extra/BaseComponent";

export class MessageActionRowComponent<
	T extends BiscuitActionRowMessageComponents,
> extends BaseComponent<ComponentType.ActionRow> {
	constructor(
		readonly session: Session,
		data: { type: ComponentType.ActionRow; components: APIMessageActionRowComponent[] },
	) {
		super(data);
		this.components = data.components.map((component) => session.utils.componentFactory(component)) as T[];
	}
	components: T[];
}
