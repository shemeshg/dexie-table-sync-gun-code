# dexie-table-sync-gun

Sync dixie table to Gun

https://shemeshg.github.io/dexie-table-sync-gun/

```
import { GunApp } from "./GunApp/GunApp"
export const gunApp=new GunApp("UnqueAppId128")

const dexieGunFriends = gunApp.createStore<Friend>("friends", db.friends);
await dexieGunFriends.setCallback(
        async (row: ItfDixieGunTable<Friend>, key: string) => {          
          refreshListvie(); // refresh UI
        },
        this //Context to bind
      );

```


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
