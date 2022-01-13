import Gun from "gun";


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function gunGetType(){
  return Gun().get("e")
}




export function getOnce(gunGet: ReturnType<typeof Gun>): Promise<unknown> {
  return new Promise((resolve) => {
    gunGet
      .once((t) => {
        resolve(t);
      });
  });
}

/**
 * @function delay Delays the execution of an action.
 * @param {number} time The time to wait in seconds.
 * @returns {Promise<void>}
 */
 export function delay(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time * 1000));
}

export function putOnce(gunGet: ReturnType<typeof Gun>, data: Partial<unknown>): Promise<unknown> {
  return new Promise((resolve) => {
    gunGet
      .put(data,(t) => {
        resolve(t);
      });
  });
}




