import { GunAuth } from "./GunAuth"
import { getOnce, gunGetType, putOnce } from "./GunHelper"
import { SEA } from "gun";
import { IGunCryptoKeyPair } from "gun/types/types";
require("gun/sea");


export class GunGroup {
  encryptedFields: string[] 
  private groupStore: ReturnType<typeof gunGetType>
  private gunAuth: GunAuth

  private challangeEnc = ""
  private challange = ""

  private users: { epub: string; eGroupPrvKey: string; }[] = []
  

  private _pub = ""
  private get pub(): string {
    return this._pub
  }

  private _priv = ""
  private get priv(): string {
    return this._priv
  }

  constructor(groupStore: ReturnType<typeof gunGetType>, gunAuth: GunAuth, encryptedFields: string[]) {
    this.groupStore = groupStore
    this.gunAuth = gunAuth
    this.encryptedFields = encryptedFields
  }

  private async readGroupParamsFromStore() {
    const challange = await getOnce(this.groupStore.get("challange"))
    this.challange = challange as string
    this.challangeEnc = await getOnce(this.groupStore.get("challangeEnc")) as string
    const users = await getOnce(this.groupStore.get("users")) as string
    this.users = JSON.parse(users)
  }

  private async createGroupParams() {
    const groupPair = await SEA.pair()
    if (!groupPair) { throw new Error("Could not create group pair") }
    this._priv = groupPair.priv
    this.challange = groupPair.epub
    this.challangeEnc = await this.encrypt(this.challange) as string
    if (!this.gunAuth.pair) { throw new Error("No epub to encrypt group data to") }
    const eGroupPrvKey = await this.gunAuth.encryptAsym(groupPair.priv, this.gunAuth.pair.epub)
    this.users = [{ epub: this.gunAuth.pair.epub, eGroupPrvKey: eGroupPrvKey }]
    await putOnce(this.groupStore, {
      challange: this.challange,
      challangeEnc: this.challangeEnc,
      users: JSON.stringify(this.users)
    })
  }

  async initGroup(): Promise<void> {
    const challange = await getOnce(this.groupStore.get("challange"))
    if (challange) {
      await this.readGroupParamsFromStore()
    } else {
      await this.createGroupParams()
    }
  }

  async encrypt(data: string): Promise<unknown> {
    return await SEA.encrypt(data, this._priv)
  }

  async decrypt(data: string): Promise<unknown> {
    return await SEA.decrypt(data, this._priv)
  }

  async canUserAccessGroup(): Promise<boolean> {
    if (!this.gunAuth.pair) { throw new Error("No epub to decrypt group data to"); }
    const user = this.users.filter((row) => { return row.epub = (this.gunAuth.pair as IGunCryptoKeyPair).epub })[0]
    if (!user) { throw new Error("User not in group") }
    this._priv = await this.gunAuth.decryptAsym(user.eGroupPrvKey, user.epub)
    const challangeExpected = await this.decrypt(this.challangeEnc)
    if (challangeExpected === this.challange) {
      return true
    } else {
      return false
    }
  }





}