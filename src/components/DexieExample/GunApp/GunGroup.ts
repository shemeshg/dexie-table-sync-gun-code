import { GunAuth } from "./GunAuth"
import {gunGetType} from "./GunHelper"



export class GunGroup{
  /*
  pubKey = "****"
  pubKeyEncBySelf = "***"
  users = [{userPubKey: "user1:", groupPrvKeyEncByUser: "*******"}]  
  */
  encryptFields = ["fields1","title"]
  groupStore: ReturnType<typeof gunGetType>
  gunAuth: GunAuth
  constructor(groupStore:  ReturnType<typeof gunGetType>, gunAuth: GunAuth){
    this.groupStore = groupStore
    this.gunAuth = gunAuth
  }


  async populateGroupInfo():Promise<boolean>{
    const populatedGroupDataSuccessfull = true
    if (populatedGroupDataSuccessfull){
      return true
    } else {
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