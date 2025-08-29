import { InjectionToken } from "tsyringe";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ICommandHandler {
    readonly command: string;
    execute(...args: any[]): void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const commandHandlerToken: InjectionToken<ICommandHandler> = "ICommandHandler";
