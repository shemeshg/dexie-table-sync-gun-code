import { GunAuth } from "./GunAuth"
import {gunGetType} from "./GunHelper"
import {SEA} from "gun";
require("gun/sea");


export class GunGroup{
  /*
  pubKey = "****"
  pubKeyEncBySelf = "***"
  users = [{userPubKey: "user1:", groupPrvKeyEncByUser: "*******"}]  
  */
  encryptFields: string[] = ["title"]
  groupStore: ReturnType<typeof gunGetType>
  gunAuth: GunAuth
  readonly challange="challange"
  challangeEnc=""

  users: {pub: string;eGroupPrvKey: string;}[]=[]

  private _pub=""
  get pub(): string{
    return this._pub
  }

  private _priv=""
  get priv(): string{
    return this._priv
  }

  constructor(groupStore:  ReturnType<typeof gunGetType>, gunAuth: GunAuth){
    this.groupStore = groupStore
    this.gunAuth = gunAuth
  }



  async createGroupKeys():Promise<void>{
      const groupPair=await SEA.pair()
      if (!groupPair){throw new Error("Could not create group pair")}
      this._priv = groupPair.priv
      this.challangeEnc=await this.encrypt(this.challange) as string
      const eGroupPrvKey=await this.gunAuth.encrypt(groupPair.priv) 
      this.users=[{pub: this.gunAuth.pub, eGroupPrvKey: eGroupPrvKey}]    
  }

  async encrypt(data: string): Promise<unknown>{
    return await SEA.encrypt(data, this._priv)
  }

  async decrypt(data: string): Promise<unknown>{
    return await SEA.decrypt(data, this._priv)
  }

  async canUserAccessGroup(): Promise<boolean>{
    const user=this.users.filter((row)=>{return row.pub= this.gunAuth.pub})[0]
    if (!user){throw new Error("User not in group")}
    this._priv  = await this.gunAuth.decrypt(user.eGroupPrvKey)
    const challangeExpected = await this.decrypt(this.challangeEnc)
    if (challangeExpected === this.challange){      
      return true
    } else {
      return false
    }
  }





}