import { singleton } from "tsyringe";

@singleton()
export class EnvironmentService {
    private _isTestEnvironment = false;

    public get isTestEnvironment(): boolean {
        return this._isTestEnvironment;
    }

    public setTestEnvironment(): void {
        this._isTestEnvironment = true;
    }
}
