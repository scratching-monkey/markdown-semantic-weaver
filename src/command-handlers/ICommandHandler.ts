import { InjectionToken } from "tsyringe";

export interface ICommandHandler {
    readonly command: string;
    execute(...args: any[]): void;
}

export const commandHandlerToken: InjectionToken<ICommandHandler> = "ICommandHandler";
