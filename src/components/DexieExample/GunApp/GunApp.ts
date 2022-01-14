import Dexie from "dexie";
import { GunDexieTable } from "./GunDexieTable";
import Gun from "gun";

export class GunApp {  
  gun = Gun([
    "https://gun-manhattan.herokuapp.com/gun",
  ]);

  applicationUnqueId: string

  constructor(applicationUnqueId: string){
    this.applicationUnqueId = applicationUnqueId
  }

  createStore<T>(storeName: string, txTable: Dexie.Table<T, string>): GunDexieTable<T>{
    const tbStore = this.gun.get(this.applicationUnqueId).get(storeName);    
    const dexieGunFriends = new GunDexieTable<T>(txTable, tbStore,this.gun);
    
    return dexieGunFriends;
  }

}




