import Dexie from "dexie";
import Gun from "gun";
import { GunAuth } from "./GunAuth";
import { GunDexieTable } from "./GunDexieTable";

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


export class GunApp {
  gunAuth: GunAuth    
  gun = Gun([
    "https://gun-manhattan.herokuapp.com/gun",
  ]);

  applicationUnqueId: string

  constructor(applicationUnqueId: string){
    this.applicationUnqueId = applicationUnqueId
    this.gunAuth = new GunAuth(this.gun)
  }

  createStore<T>(storeName: string, txTable: Dexie.Table<T, string>, encryptedFields: string[]): GunDexieTable<T>{
    const tbStore = this.gun.get(this.applicationUnqueId).get(storeName);    

    const dexieGunFriends = new GunDexieTable<T>(txTable, tbStore,this.gun, this.gunAuth, encryptedFields);
    
    return dexieGunFriends;
  }
}


export const gunApp=new GunApp("UnqueAppId123")

