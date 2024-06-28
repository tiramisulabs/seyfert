import type { ContextComponentCommandInteractionMap, ComponentContext } from './componentcontext';
import type { ExtraProps, RegisteredMiddlewares, UsingClient } from '../commands';
export declare const InteractionCommandType: {
    readonly COMPONENT: 0;
    readonly MODAL: 1;
};
export interface ComponentCommand {
    __filePath?: string;
}
export declare abstract class ComponentCommand {
    type: 0;
    abstract componentType: keyof ContextComponentCommandInteractionMap;
    abstract filter(context: ComponentContext<typeof this.componentType>): Promise<boolean> | boolean;
    abstract run(context: ComponentContext<typeof this.componentType>): any;
    middlewares: (keyof RegisteredMiddlewares)[];
    props: ExtraProps;
    get cType(): number;
    onAfterRun?(context: ComponentContext, error: unknown | undefined): any;
    onRunError?(context: ComponentContext, error: unknown): any;
    onMiddlewaresError?(context: ComponentContext, error: string): any;
    onInternalError?(client: UsingClient, error?: unknown): any;
}
