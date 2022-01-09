import Dexie from "dexie";
import Gun from "gun";
import { Friend, db } from "./db";
import { v4 as uuidv4 } from 'uuid';
import { TrackOpTypes } from "vue";

export const gun = Gun([
  "https://gun-manhattan.herokuapp.com/gun",
]);

export function getOnce(gunGet: ReturnType<typeof gun.get>): Promise<unknown> {
  return new Promise((resolve) => {
    gunGet
      .once((t) => {
        resolve(t);
      });
  });
}

export function mapOnce(gunGet: ReturnType<typeof gun.get>): Promise<unknown> {
  return new Promise((resolve) => {
    gunGet
      .map().once((row, idx) => {
        resolve({ row: row, idx: idx });
      });
  });
}

export class GunDexie<ItfRow> {
  dxTable: Dexie.Table<ItfRow, string>
  gunStore: ReturnType<typeof gun.get>
  sessionId = uuidv4()
  callnack= (row:any, idx: any):void=>{return;}
  lastModifiedNotifications:string[]=[]

  private eliminateRepeatingNotifications(row: any){
    if(this.lastModifiedNotifications.indexOf(row.lastModeified)>-1){return true;}
    if(this.lastModifiedNotifications.length > 100){this.lastModifiedNotifications = []}
    this.lastModifiedNotifications.push(row.lastModeified)
    
    return false
  }

  private mapOnCallback(row:any, idx: any){
    if (this.eliminateRepeatingNotifications(row)){return;}
    this.callnack(row, idx)
  }
  constructor(txTable: Dexie.Table<ItfRow, string>, gunStore: ReturnType<typeof gun.get>, 
    ) {
    this.dxTable = txTable
    this.gunStore = gunStore

  }

  setCallback(callnack=(row:any, idx: any):void=>{return;}){
    this.callnack = callnack;

    this.gunStore.map().on((row, idx)=>{this.mapOnCallback.call(this,row, idx) })
  }
  async add(row: ItfRow | unknown) {
    const r = row as any
    r.lastModeified = uuidv4()
    r.sessionId = this.sessionId
    r.deleted = false;
    const key = await this.dxTable.add(r)
    r.key = key
    this.gunStore.get(key).put(r)
  }

  async put(row: any, key: string, keepLastModified = false) {
    if (!keepLastModified) {
      (row).lastModeified = uuidv4()
    }
    (row).sessionId = this.sessionId
    await this.dxTable.put(row, key)
    this.gunStore.get(key).put(row)

  }

  private async deleteDxByKey(key: string){
    const dxRow: any=await this.dxTable.get(key) as any
    dxRow.deleted = true 
    await this.put(dxRow,key)
  }

  async delete(key: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.deleteDxByKey(key)
    this.gunStore.get(key).put({ deleted: true, lastModeified: uuidv4() })

  }

  async doSyncGunToDexie(row: any, key: string){
    if ((row).sessionId === this.sessionId) { return; }

    const dxRow: any = await this.dxTable.get((row).oid)
    if (!dxRow){
      await this.put(row, key, true)
      return;
    }
    if (row.lastModeified !== dxRow.lastModeified) {
      await this.put(row, key, true)
      return;
    }
  }


  syncGunToDexie() {
    this.gunStore.map(async (row: any, key: string) => {
 
      this.doSyncGunToDexie(row, key)
    });
  }
}


