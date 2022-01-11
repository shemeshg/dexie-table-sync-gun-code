import Gun from "gun";
require("gun/sea");


function gunUserType(){
  return Gun().user()
}

export class GunAuth {
  gun: ReturnType<typeof Gun>
  user:  ReturnType<typeof gunUserType>
  private _epriv=""
  private _epub=""

  constructor( gun: ReturnType<typeof Gun>){
    this.gun = gun
    this.user = gun.user().recall({ sessionStorage: true });    
  }

  get epriv(): string{
    return this._epriv
  }

  get epub(): string{
    return this._epub
  }

  get isLoggedIn(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.user as any).is !== undefined
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
    debugger;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await this._gunAuthUser(username,password) as any
    this._epriv = user.sea.epriv
    this._epub = user.sea.epub
    return user;

  }
}
