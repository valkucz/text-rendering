// TODO: remove
export class EventHandler {
    externalCallback: Function;

    constructor(callback: Function) {
        this.externalCallback = callback;
    }

    handleEvent(object: any, type: string, internalCallback: Function) {
        object.addEventListener(type, () => {
            internalCallback();
        });
        this.externalCallback();
    }
    
}