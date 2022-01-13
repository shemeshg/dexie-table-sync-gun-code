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


export function putOnce(gunGet: ReturnType<typeof Gun>, data: Partial<unknown>): Promise<unknown> {
  return new Promise((resolve) => {
    gunGet
      .put(data,(t) => {
        resolve(t);
      });
  });
}




