// db.ts
import Dexie from 'dexie';
import 'dexie-observable';
import 'dexie-syncable';
import { exportDB} from "dexie-export-import";

export interface Friend {
  oid?: string;
  name: string;
  age: number;
}

export class MySubClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  friends!: Dexie.Table<Friend, number>; // number = type of the primkey 

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      friends: '$$oid, name, age' // Primary key and indexed props
    });
  }

  async doExport():Promise<Blob>{
    return await exportDB(this,{prettyJson: true})
  }


}




export const db = new MySubClassedDexie();
