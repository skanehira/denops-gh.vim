export const onece = <A extends unknown, R extends Promise<unknown>>(
  f: (arg?: A) => R,
) => {
  let v: R | undefined;
  return (arg?: A): R => {
    return v || (v = f(arg));
  };
};
