import Dexie from "dexie";
import { GunAuth } from "./GunAuth";
import { GunDexieTable } from "./GunDexieTable";
import Gun from "gun";

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




