import { Id, Remap, Reactive } from "./common";
import { Now } from "./now";
import { placeholder, Placeholder } from "./placeholder";

export type ComponentOutput<A, O> = {
  available: A;
  output: O;
};

type ComponentAPI = {
  appendChild: (c: ComponentAPI) => void;
};

type MapComponentArray<A> = { [k in keyof A]: Component<{}, A[k]> };

const componentType = Symbol("component");

export abstract class Component<A, O> {
  abstract render(parent: ComponentAPI): ComponentOutput<A, O>;

  frpType = componentType;

  static is(obj: any): obj is Component<any, any> {
    return "frpType" in obj && obj.frpType === componentType;
  }

  static of<P>(output: P): Component<{}, P> {
    return new OfComponent(output);
  }

  flatMap<P>(fn: (output: O) => Component<any, P>): Component<A, P> {
    return new FlatMapComponent(this, fn);
  }

  map<P>(fn: (output: O) => P): Component<A, P> {
    return this.flatMap((output) => Component.of(fn(output)));
  }

  flatten<P>(this: Component<A, Component<any, P>>): Component<A, P> {
    return this.flatMap((c) => c);
  }

  ap<P>(fn: Component<any, (output: O) => P>): Component<A, P> {
    return this.flatMap((output) => fn.map((f) => f(output)));
  }

  static lift<A extends any[], O>(
    fn: (...args: A) => O,
    ...args: MapComponentArray<A>
  ): Component<{}, O> {
    return args
      .reduce(
        (previous, current) =>
          previous.flatMap((p) => current.map((c) => [...p, c])),
        Component.of([])
      )
      .map((a) => fn(...a));
  }

  output<U extends object, P extends Record<string, keyof A>>(
    this: Component<A, U>,
    map: P
  ): Component<A, Id<U & Remap<A, P>>> {
    return this.liftOutput((available: A, current: U) => {
      let output: Record<string, any> = { ...current };
      for (const key in map) {
        output[key] = available[map[key]];
      }
      return output as U & Remap<A, P>;
    });
  }

  liftOutput<P>(fn: (available: A, output: O) => P): Component<A, P> {
    return new OutputComponent(this, fn);
  }
}

class OfComponent<O> extends Component<{}, O> {
  constructor(private readonly out: O) {
    super();
  }

  render(): ComponentOutput<{}, O> {
    return { available: {}, output: this.out };
  }
}

class FlatMapComponent<A, O, P> extends Component<A, P> {
  constructor(
    private readonly component: Component<A, O>,
    private readonly fn: (output: O) => Component<any, P>
  ) {
    super();
  }

  render(parent: ComponentAPI): ComponentOutput<A, P> {
    const { available, output: componentOutput } = this.component.render(
      parent
    );
    const { output } = this.fn(componentOutput).render(parent);
    return { available, output };
  }
}

class OutputComponent<A, O, P> extends Component<A, P> {
  constructor(
    private readonly component: Component<A, O>,
    private readonly fn: (available: A, output: O) => P
  ) {
    super();
  }

  render(parent: ComponentAPI): ComponentOutput<A, P> {
    const { available, output } = this.component.render(parent);
    return { available, output: this.fn(available, output) };
  }
}

export function loop<O extends ReactiveMap>(
  fn: (output: O) => Now<Component<{}, O>>
) {
  return new LoopComponent(fn);
}

const placeholderProxyHandler: ProxyHandler<PlaceholderMap> = {
  get: (target, name: string): Reactive<any> => {
    if (!(name in target)) {
      target[name] = placeholder();
    }
    return target[name];
  }
};

type ReactiveMap = {
  [key: string]: Reactive<any>;
};

type PlaceholderMap<O extends ReactiveMap = ReactiveMap> = O & {
  [key: string]: ReturnType<typeof placeholder>;
};

export function placeholderMap<O extends ReactiveMap>() {
  return new Proxy({}, placeholderProxyHandler) as PlaceholderMap<O>;
}

class LoopComponent<O extends ReactiveMap> extends Component<{}, O> {
  constructor(private readonly fn: (output: O) => Now<Component<{}, O>>) {
    super();
  }

  render(parent: ComponentAPI): ComponentOutput<{}, O> {
    const placeholders = placeholderMap<O>();
    const child = this.fn(placeholders).run();
    const { output } = child.render(parent);
    for (const arg of Object.keys(placeholders)) {
      if (output[arg] === undefined) {
        throw new Error(`Property ${arg} is missing in component output.`);
      }
      placeholders[arg].replaceWith(output[arg]);
    }
    for (const key of Object.keys(output)) {
      if (Placeholder.is(output[key])) {
        output[key as keyof O] = (output[key] as any).parent;
      }
    }
    return { available: {}, output };
  }
}

