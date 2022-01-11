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
  encryptFields: string[] = []
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



  async populateGroupInfo():Promise<boolean>{
    const populatedGroupDataSuccessfull = false
    if (populatedGroupDataSuccessfull){
      return true
    } else {
      const groupPair=await SEA.pair()
      if (!groupPair){throw new Error("Could not create group pair")}
      this._pub=groupPair.pub
      this.challangeEnc=await SEA.encrypt(this.challange, groupPair.pub) 
      const eGroupPrvKey=await this.gunAuth.encrypt(groupPair.priv, this.gunAuth.pub) 
      this.users=[{pub: this.gunAuth.pub, eGroupPrvKey: eGroupPrvKey}]
      
      //test challange
      const user=this.users.filter((row)=>{return row.pub= this.gunAuth.pub})[0]
      if (!user){throw new Error("User not in group")}
      const groupPrivKey = await this.gunAuth.decrypt(user.eGroupPrvKey)
      const challangeExpected = await SEA.decrypt(this.challangeEnc, groupPrivKey)
      if (challangeExpected === this.challange){
        this._priv = groupPrivKey
        debugger;
        console.log("*********")
      } else {
        throw new Error("User fiailed group challange")
      }


      return false
    }
    
  }

  isUserCanAccessGroup(): boolean{
    //params userPubKey: string

    // Find user in users
    // a = decrypt pubkey in groupPrvKeyEncByUser
    // decrypt  pubKeyEncBySelf with a
    // compare to pubKey
    return true;
  }

  getFieldsUserNotAllowedToSee(): string[]{
    if (this.isUserCanAccessGroup()){
      return []
    } 
    return this.encryptFields        
  }

  readRow():{[id: string]: string;}{
    const maskString="****"
    const a:{ [id: string] : string; }={"a":"t","title":"yoyo"}
    a["title"]=maskString
    return a
  }

  writeRow():{[id: string]: string;}{
    const a:{ [id: string] : string; }={"a":"t","title":"yoyo"}
    delete a["title"]
    return a
  }

}