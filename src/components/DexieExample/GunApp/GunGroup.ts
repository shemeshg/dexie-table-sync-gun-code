import { GunAuth } from "./GunAuth"
import { getOnce, gunGetType } from "./GunHelper"
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
  
  private _priv = ""
  isUserCanAccessGroup=false

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
    this.groupStore.put( {
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
    
    this.isUserCanAccessGroup =await this.canUserAccessGroup()  
  }

  async readDatarow(datarowByRef: { [id: string]: string; }): Promise<{ [id: string]: string; }>{
    const datarow={...datarowByRef}
    for (let i=0;i<this.encryptedFields.length;i++){
      const field=this.encryptedFields[i]
      if (Object.keys(datarow).indexOf(field) === -1) {continue}
      if (this.isUserCanAccessGroup){
        const dec = await this.decrypt(datarow[field]) as string
        try {
          datarow[field]=JSON.parse(dec)
        } catch{
          datarow[field]=dec
        }
        
      } else {
        datarow[field]="#####"
      }      
    }  
    
    return datarow;  
  }

  async writeDatarow(datarowByRef: { [id: string]: string; }): Promise<{ [id: string]: string; }>{
    const datarow={...datarowByRef}
    for (let i=0;i<this.encryptedFields.length;i++){
      const field=this.encryptedFields[i]
      if (Object.keys(datarow).indexOf(field) === -1) {continue}
      if (this.isUserCanAccessGroup){
        const s=JSON.stringify(datarow[field])
        datarow[field]=await this.encrypt(s) as string
      } else {
        delete datarow[field]
      }
    }

    return datarow;
  }  

  private async encrypt(data: string): Promise<unknown> {
    return await SEA.encrypt(data, this._priv)
  }

  private async decrypt(data: string): Promise<unknown> {
    return await SEA.decrypt(data, this._priv)
  }

  private async canUserAccessGroup(): Promise<boolean> {
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