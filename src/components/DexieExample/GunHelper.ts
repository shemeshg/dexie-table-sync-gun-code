import Dexie from "dexie";
import Gun, { SEA } from "gun";
import { v4 as uuidv4 } from 'uuid';
require("gun/sea");

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
  callnack = (row: ItfDixieGunTable<ItfRow>, idx: string): void => { return; }
  lastModifiedNotifications: string[] = []

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
  constructor(txTable: Dexie.Table<ItfRow, string>, gunStore: ReturnType<typeof gun.get>,
  ) {
    this.dxTable = txTable as unknown as Dexie.Table<ItfDixieGunTable<ItfRow>, string>
    this.gunStore = gunStore

  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCallback(callnack = (row: ItfDixieGunTable<ItfRow>, idx: string): void => { return; }): void {
    this.callnack = callnack;
    this.gunStore.map().on((row, idx) => { this.mapOnCallback.call(this, row, idx as string) })
  }

  async add(row: ItfRow): Promise<void> {
    const r = row as unknown as ItfDixieGunTable<ItfRow>
    r.lastModeified = uuidv4()
    r.sessionId = this.sessionId
    r.deleted = false;
    const key = await this.dxTable.add(r)
    r.key = key
    this.gunStore.get(key).put(r)
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

    this.gunStore.get(key).put(row)

  }

  private async deleteDxByKey(key: string): Promise<void> {
    const dxRow = await this.dxTable.get(key) as unknown as ItfDixieGunTable<ItfRow>
    debugger;
    dxRow.deleted = true
    await this.put(dxRow, key)
  }

  async delete(key: string): Promise<void> {
    await this.deleteDxByKey(key)
    this.gunStore.get(key).put({ deleted: true, lastModeified: uuidv4() })

  }

  async doSyncGunToDexie(row: ItfDixieGunTable<ItfRow>, key: string): Promise<void> {
    if ((row).sessionId === this.sessionId) { return; }

    const dxRow = await this.dxTable.get((row).oid) as unknown as ItfDixieGunTable<ItfRow>
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
    this.gunStore.map(async (row: ItfDixieGunTable<ItfRow>, key: string) => {

      this.doSyncGunToDexie(row, key)
    });
  }
}

const applicationUnqueId = "yiuowae712367986kjhgdsnmbv"

class GunAuth {
  user = gun.user().recall({ sessionStorage: true });

  get isLoggedIn(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.user as any).is !== undefined
  }

  get pubKey(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.user as any).is.pub
  }

  async getDatabseInfo(): Promise<{status: number;msg: string;dbSecretKey?: string}> {
    const dbContainterName=`db-${applicationUnqueId}`
    const userConfig = gun.get(dbContainterName).get("config").get(this.pubKey)
    const dbSercurityChallange = gun.get(dbContainterName).get("config").get("securityChallange")
    const dbUserParams: { userChallange: string } = await getOnce(userConfig) as { userChallange: string }
    const sercurityChallange: { clearChallange: string, encChallange: string}= await getOnce(dbSercurityChallange) as any
    if (!dbUserParams) { return { status: 1, msg: "User not registered" } }
    if(!sercurityChallange){ return { status: 2, msg: "Db not initialized iwth security challange" } }
    const dbSecretKeyExpected: string = await SEA.verify(dbUserParams.userChallange, this.pubKey )  as any
    const challangeExpected = await SEA.decrypt(sercurityChallange.encChallange, dbSecretKeyExpected)
    if (challangeExpected !==sercurityChallange.clearChallange){ return { status: 3, msg: "Security challange failed" } }
    debugger;
    return { status: 0, msg: "", dbSecretKey: dbSecretKeyExpected }
  }

  gunLogout() {
    this.user.leave();
  }

  gunRegisterUser(username: string, password: string) {
    return new Promise((resolve, reject) => {
      this.user.create(username, password, (ack) => {
        const okReturn = ack as { ok: 0; pub: string };
        const errReturn = ack as { err: string };
        if (okReturn.ok === 0) {
          resolve(okReturn.pub);
        } else {
          reject(new Error(errReturn.err));
        }
      });
    });
  }

  gunAuthUser(username: string, password: string) {
    return new Promise((resolve, reject) => {
      this.user.auth(username, password, (ack) => {
        const ackErr = ack as { err: string; }
        if (ackErr.err) {
          reject(new Error(ackErr.err))
        } else {
          resolve(ack)
        }
      });
    })
  }
}

export const gunAuth = new GunAuth()