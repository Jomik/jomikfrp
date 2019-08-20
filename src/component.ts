export type ComponentOutput<A, O> = {
  available: A;
  output: O;
};

type ComponentAPI = {
  appendChild: (c: ComponentAPI) => void;
};

type MapComponentArray<A> = { [k in keyof A]: Component<{}, A[k]> };

export abstract class Component<A, O> {
  abstract render(parent: ComponentAPI): ComponentOutput<A, O>;

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
