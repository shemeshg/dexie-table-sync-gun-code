import Gun, {SEA} from "gun";
import { IGunCryptoKeyPair } from "gun/types/types";
require("gun/sea");


function gunUserType(){
  return Gun().user()
}

const gunSeaToken="gunSeaToken"

export class GunAuth {
  private gun: ReturnType<typeof Gun>
  private user:  ReturnType<typeof gunUserType>
  private _pair?: IGunCryptoKeyPair


  constructor( gun: ReturnType<typeof Gun>){
    this.gun = gun
    this.user = gun.user().recall({ sessionStorage: true });   
    if(this.isLoggedIn){
      this._pair = JSON.parse(localStorage.getItem(gunSeaToken) as string)
    } else {
      localStorage.removeItem(gunSeaToken)
    }
  }

  get pair(): IGunCryptoKeyPair | undefined{
    return this._pair
  }



  get isLoggedIn(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.user as any).is !== undefined    
  }

  async decryptAsym(data: string, epub: string):Promise<string>{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sea:any = SEA
    const str=sea.decrypt(data, await sea.secret(epub, this.pair)) as string; 
    return str
  }

  async encryptAsym(data: string, epubEncryptFor: string):Promise<string>{
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sea:any = SEA
    const str=await SEA.encrypt(data, await sea.secret(epubEncryptFor, this.pair));
    return str
  }

  gunLogout(): void {
    this.user.leave();
  }

  gunRegisterUser(username: string, password: string): Promise<string> {
    
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

  private _gunAuthUser(username: string, password: string): Promise<unknown> {
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

  async gunAuthUser(username: string, password: string): Promise<unknown> {
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await this._gunAuthUser(username,password) as any
    debugger;
    this._pair = user.sea
    localStorage.setItem(gunSeaToken, JSON.stringify(this._pair))
    return user;

  }
}
