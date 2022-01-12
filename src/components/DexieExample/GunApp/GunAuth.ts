import Gun, {SEA} from "gun";
require("gun/sea");


function gunUserType(){
  return Gun().user()
}

export class GunAuth {
  gun: ReturnType<typeof Gun>
  user:  ReturnType<typeof gunUserType>
  private _priv=""
  private _pub=""

  constructor( gun: ReturnType<typeof Gun>){
    this.gun = gun
    this.user = gun.user().recall({ sessionStorage: true });    
  }

  get priv(): string{
    return this._priv
  }

  get pub(): string{
    return this._pub
  }

  get isLoggedIn(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.user as any).is !== undefined
  }

  async decrypt(data: string):Promise<string>{
    const str=await SEA.decrypt(data, this.priv) as string
    return str
  }

  async encrypt(data: string):Promise<string>{
    const str=await SEA.encrypt(data, this.priv)
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
    this._priv = user.sea.priv
    this._pub = user.sea.pub
    return user;

  }
}
