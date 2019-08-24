import { Reactive } from "./common";

const placeholderHandler: ProxyHandler<Placeholder> = {
  get: (target, property: string) => {
    if (property === "replaceWith") {
      if (target.parent !== undefined) {
        throw new Error("You can only replace a placeholder once.");
      }
      return target.replaceWith.bind(target);
    } else if (target.parent !== undefined) {
      return target.parent[property];
    } else {
      return (...args: any[]) => {
        const dummy = placeholder();
        target.calls.push({
          dummy,
          method: property,
          args
        });
        return dummy;
      };
    }
  }
};

class Placeholder<R extends Reactive<any> = Reactive<any>> {
  parent: R | undefined = undefined;
  calls: Array<{ dummy: Placeholder; method: string; args: any[] }> = [];
  replaceWith(parent: R) {
    this.parent = parent;
    for (const { dummy, method, args } of this.calls) {
      dummy.replaceWith(this.parent[method](...args));
    }
    this.calls = [];
  }
}

export function placeholder<R extends Reactive<any> = Reactive<any>>(): R &
  Placeholder<R> {
  return new Proxy(new Placeholder<R>(), placeholderHandler) as any;
}

