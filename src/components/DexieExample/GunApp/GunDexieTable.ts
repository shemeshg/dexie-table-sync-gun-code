import Dexie from "dexie";
import Gun  from "gun";
import { v4 as uuidv4 } from 'uuid';
import { GunAuth } from "./GunAuth";
import { GunGroup } from "./GunGroup";
import {gunGetType} from "./GunHelper"
 


export type ItfDixieGunTable<T> = T & {
  lastModeified: string;
  sessionId: string
  deleted: boolean
  key: string
  oid: string
};

export class GunDexieTable<ItfRow> {
  

  dxTable: Dexie.Table<ItfDixieGunTable<ItfRow>, string>
  private gunTableDataStore: ReturnType<typeof gunGetType>
  private gunGroupStore: ReturnType<typeof gunGetType>
  private gunEveryoneGroup: GunGroup

  private sessionId = uuidv4()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private callnack = (row: ItfDixieGunTable<ItfRow>, idx: string): void => { return; }
  lastModifiedNotifications: string[] = []

  constructor(txTable: Dexie.Table<ItfRow, string>, gunStore: ReturnType<typeof gun.get>,
    gun: ReturnType<typeof Gun>, user: GunAuth) {
      this.dxTable = txTable as unknown as Dexie.Table<ItfDixieGunTable<ItfRow>, string>
      this.gunTableDataStore = gunStore.get("data")
      this.gunGroupStore = gunStore.get("group")
      this.gunEveryoneGroup = new GunGroup(this.gunGroupStore, user)      

  
    }

  private eliminateRepeatingNotifications(row: ItfDixieGunTable<ItfRow>) {
    if (this.lastModifiedNotifications.indexOf(row.lastModeified) > -1) { return true; }
    if (this.lastModifiedNotifications.length > 100) { this.lastModifiedNotifications = [] }
    this.lastModifiedNotifications.push(row.lastModeified)

    return false
  }

  private mapOnCallback(row: ItfDixieGunTable<ItfRow>, idx: string) {
    if (this.eliminateRepeatingNotifications(row)) { return; }
    this.doSyncGunToDexie(row, idx)
    this.callnack(row, idx)
  }

  async setupEveryoneGroup(): Promise<void>{
    await this.gunEveryoneGroup.initGroup()
    const canUserAccessGroup =await this.gunEveryoneGroup.canUserAccessGroup()    
    console.log(canUserAccessGroup)  
    const ecryptedFields=this.gunEveryoneGroup.encryptFields

    //write example
    const datarow: { [id: string]: string; }={"shalom":"98",title:"wqe"}
    for (let i=0;i<ecryptedFields.length;i++){
      const field=ecryptedFields[i]
      if (canUserAccessGroup){
        datarow[field]=await this.gunEveryoneGroup.encrypt(datarow[field]) as string
      } else {
        delete datarow[field]
      }
    }
    debugger;
    //Read example    
    
    for (let i=0;i<ecryptedFields.length;i++){
      const field=ecryptedFields[i]
      if (canUserAccessGroup){
        datarow[field]=await this.gunEveryoneGroup.decrypt(datarow[field]) as string
      } else {
        datarow[field]="#####"
      }      
    }
    debugger;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCallback(callnack = (row: ItfDixieGunTable<ItfRow>, idx: string): void => { return; }): void {
    this.callnack = callnack;
    this.gunTableDataStore.map().on((row: ItfDixieGunTable<ItfRow>, idx: string) => { this.mapOnCallback.call(this, row, idx as string) })
  }

  async add(row: ItfRow): Promise<void> {
    const r = row as unknown as ItfDixieGunTable<ItfRow>
    r.lastModeified = uuidv4()
    r.sessionId = this.sessionId
    r.deleted = false;
    const key = await this.dxTable.add(r)
    r.key = key
    this.gunTableDataStore.get(key).put(r)
  }

  async put(row: ItfDixieGunTable<ItfRow>, key: string,
    keepLastModified = false, doNotImportDixie = false): Promise<void> {
    if (!keepLastModified) {
      (row).lastModeified = uuidv4()
    }
    row.sessionId = this.sessionId
    if (!doNotImportDixie) {
      await this.dxTable.put(row, key)
    }

    this.gunTableDataStore.get(key).put(row)

  }

  private async deleteDxByKey(key: string): Promise<void> {
    const dxRow = await this.dxTable.get(key) as unknown as ItfDixieGunTable<ItfRow>
    dxRow.deleted = true
    await this.put(dxRow, key)
  }

  async delete(key: string): Promise<void> {
    await this.deleteDxByKey(key)
    this.gunTableDataStore.get(key).put({ deleted: true, lastModeified: uuidv4() })

  }

  async doSyncGunToDexie(row: ItfDixieGunTable<ItfRow>, key: string): Promise<void> {
    if ((row).sessionId === this.sessionId) { return; }

    const dxRow = await this.dxTable.get(row.oid) as unknown as ItfDixieGunTable<ItfRow>
    if (!dxRow) {
      await this.put(row, key, true)
      return;
    }
    if (row.lastModeified !== dxRow.lastModeified) {
      await this.put(row, key, true)
      return;
    }
  }

  async importCurrentDixieTableToGun(): Promise<void> {
    const all = await this.dxTable.toArray();
    for (let i = 0; i < all.length; i++) {
      await this.put(all[i], all[i].key, true, true)
    }

  }

  syncGunToDexie(): void {
    this.gunTableDataStore.map(async (row: ItfDixieGunTable<ItfRow>, key: string) => {

      this.doSyncGunToDexie(row, key)
    });
  }
}
