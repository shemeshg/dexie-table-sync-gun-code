import Dexie from "dexie";
import Gun from "gun";
import { v4 as uuidv4 } from 'uuid';
import { GunAuth } from "./GunAuth";
import { GunGroup } from "./GunGroup";
import { gunGetType } from "./GunHelper"



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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private callbackCtx?: any

  private sessionId = uuidv4()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private callnack = (row: ItfDixieGunTable<ItfRow>, idx: string): void => { return; }
  lastModifiedNotifications: string[] = []

  constructor(txTable: Dexie.Table<ItfRow, string>, gunStore: ReturnType<typeof gun.get>,
    gun: ReturnType<typeof Gun>, user: GunAuth, encryptedFields: string[]) {
    this.dxTable = txTable as unknown as Dexie.Table<ItfDixieGunTable<ItfRow>, string>
    this.gunTableDataStore = gunStore.get("data")
    this.gunGroupStore = gunStore.get("group")
    this.gunEveryoneGroup = new GunGroup(this.gunGroupStore, user, encryptedFields)


  }

  private eliminateRepeatingNotifications(row: ItfDixieGunTable<ItfRow>) {
    if (this.lastModifiedNotifications.indexOf(row.lastModeified) > -1) { return true; }
    if (this.lastModifiedNotifications.length > 100) { this.lastModifiedNotifications = [] }
    this.lastModifiedNotifications.push(row.lastModeified)

    return false
  }

  private async mapOnCallback(row: ItfDixieGunTable<ItfRow>, idx: string) {
    if (this.eliminateRepeatingNotifications(row)) { return; }
    await this.doSyncGunToDexie(row, idx)
    this.callnack.call(this.callbackCtx, row, idx as string)
  }



  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setCallback(callnack = (row: ItfDixieGunTable<ItfRow>, idx: string): void => { return; }, callbackCtx: unknown): Promise<void> {
    await this.gunEveryoneGroup.initGroup()
    this.callbackCtx = callbackCtx
    this.callnack = callnack;
    this.gunTableDataStore.map().on((row: ItfDixieGunTable<ItfRow>, idx: string) => { this.mapOnCallback.call(this, row, idx as string) })
  }

  async add(row: ItfRow): Promise<void> {
    let r = row as unknown as ItfDixieGunTable<ItfRow>
    r.lastModeified = uuidv4()
    r.sessionId = this.sessionId
    r.deleted = false;
    const key = await this.dxTable.add(r)
    r.key = key
    r = await this.gunEveryoneGroup.writeDatarow(r as unknown as { [id: string]: string; }) as unknown as ItfDixieGunTable<ItfRow>
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

    const r = await this.gunEveryoneGroup.writeDatarow(row as unknown as { [id: string]: string; })
    this.gunTableDataStore.get(key).put(r)
  }

  private async deleteDxByKey(key: string): Promise<void> {
    const dxRow = await this.dxTable.get(key) as unknown as ItfDixieGunTable<ItfRow>
    dxRow.deleted = true
    
    await this.put(dxRow, key)
  }

  async delete(key: string): Promise<void> {
    await this.deleteDxByKey(key)
    this.gunTableDataStore.get(key).put({ sessionId: this.sessionId, deleted: true, lastModeified: uuidv4() })

  }

  async doSyncGunToDexie(row: ItfDixieGunTable<ItfRow>, key: string): Promise<void> {
    if (row.sessionId === this.sessionId) { return; }
    
    const decryptedRow = await this.gunEveryoneGroup.readDatarow(row as unknown as { [id: string]: string; }) as unknown as ItfDixieGunTable<ItfRow>
    
    const dxRow = await this.dxTable.get(decryptedRow.oid) as unknown as ItfDixieGunTable<ItfRow>
    if (!dxRow) {
      await this.put(decryptedRow, key, true)
      return;
    }
    if (decryptedRow.lastModeified !== dxRow.lastModeified) {
      await this.put(decryptedRow, key, true)
      return;
    }
  }

  async importCurrentDixieTableToGun(): Promise<void> {
    const all = await this.dxTable.toArray();
    for (let i = 0; i < all.length; i++) {
      await this.put(all[i], all[i].key, true, true)
    }

  }


}
