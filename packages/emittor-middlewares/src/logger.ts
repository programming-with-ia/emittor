import type { Middleware } from "emittor";

const style = (color: string) => `color: ${color}; font-weight: bold;`;

export const middlewareLogger: Middleware<any, any> = (next, em) => {
  const prevState = em.getState();
  const time = new Date();

  console.groupCollapsed(
    `%cemittor @ ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`,
    style("gray")
  );

  console.log("%cprev state", style("#9E9E9E"), prevState);

  next();

  const nextState = em.getState();
  console.log("%cnext state", style("#4CAF50"), nextState);
  console.groupEnd();
};
