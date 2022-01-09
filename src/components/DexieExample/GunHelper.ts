import Dexie from "dexie";
import Gun from "gun";
import { v4 as uuidv4 } from 'uuid';

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

export type ItfDixieGunTable<T> = T & {  
  lastModeified: string;
  sessionId: string
  deleted: boolean  
  key: string
  oid: string
};

export class GunDexie<ItfRow> {


  dxTable: Dexie.Table<ItfDixieGunTable<ItfRow>, string>
  gunStore: ReturnType<typeof gun.get>
  sessionId = uuidv4()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callnack= (row:ItfDixieGunTable<ItfRow> , idx: string):void=>{return;}
  lastModifiedNotifications:string[]=[]

  private eliminateRepeatingNotifications(row: ItfDixieGunTable<ItfRow>){
    if(this.lastModifiedNotifications.indexOf(row.lastModeified)>-1){return true;}
    if(this.lastModifiedNotifications.length > 100){this.lastModifiedNotifications = []}
    this.lastModifiedNotifications.push(row.lastModeified)
    
    return false
  }

  private mapOnCallback(row:ItfDixieGunTable<ItfRow>, idx: string){
    if (this.eliminateRepeatingNotifications(row)){return;}
    this.doSyncGunToDexie(row,idx)
    this.callnack(row, idx)
  }
  constructor(txTable: Dexie.Table<ItfRow, string>, gunStore: ReturnType<typeof gun.get>, 
    ) {
    this.dxTable = txTable as unknown as Dexie.Table<ItfDixieGunTable<ItfRow>, string>
    this.gunStore = gunStore

  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCallback(callnack=(row:ItfDixieGunTable<ItfRow>, idx: string):void=>{return;}): void{
    this.callnack = callnack;
    this.gunStore.map().on((row, idx)=>{this.mapOnCallback.call(this,row, idx as string) })
  }

  async add(row:ItfRow): Promise<void> {
    const r = row as unknown as ItfDixieGunTable<ItfRow>
    r.lastModeified = uuidv4()
    r.sessionId = this.sessionId
    r.deleted = false;
    const key = await this.dxTable.add(r)
    r.key = key
    this.gunStore.get(key).put(r)
  }

  async put(row: ItfDixieGunTable<ItfRow>, key: string, 
      keepLastModified = false, doNotImportDixie=false): Promise<void> {
    if (!keepLastModified) {
      (row).lastModeified = uuidv4()
    }
    row.sessionId = this.sessionId
    if (!doNotImportDixie){
      await this.dxTable.put(row, key)
    }
    
    this.gunStore.get(key).put(row)

  }

  private async deleteDxByKey(key: string): Promise<void>{
    const dxRow=await this.dxTable.get(key) as unknown as ItfDixieGunTable<ItfRow>   
    debugger; 
    dxRow.deleted = true 
    await this.put(dxRow,key)
  }

  async delete(key: string): Promise<void> {
    await this.deleteDxByKey(key)
    this.gunStore.get(key).put({ deleted: true, lastModeified: uuidv4() })

  }

  async doSyncGunToDexie(row: ItfDixieGunTable<ItfRow>, key: string): Promise<void>{
    if ((row).sessionId === this.sessionId) { return; }

    const dxRow = await this.dxTable.get((row).oid) as unknown as ItfDixieGunTable<ItfRow>
    if (!dxRow){
      await this.put(row, key, true)
      return;
    }
    if (row.lastModeified !== dxRow.lastModeified) {
      await this.put(row, key, true)
      return;
    }
  }

  async importCurrentDixieTableToGun(): Promise<void>{
    const all=await this.dxTable.toArray();
    for (let i=0;i<all.length;i++){
      await this.put(all[i],all[i].key,true, true)
    }

  }

  syncGunToDexie(): void {
    this.gunStore.map(async (row: ItfDixieGunTable<ItfRow>, key: string) => {
 
      this.doSyncGunToDexie(row, key)
    });
  }
}


