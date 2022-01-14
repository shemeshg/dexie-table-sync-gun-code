<template>
  <div>
    <p>Status {{ syncUrl }}</p>
    <div >
      Application Id:
      <input type="text"  v-model="gunApplicationId" :readonly="isSyncDefined" />
      <p> Start application, with same AppId in two different browsers </p>
    </div>
    <button v-if="!isSyncDefined" @click="doStart">
      Start 
    </button>   
    <div v-if="isSyncDefined">
      <p>
        If you want to recreate the Gun Store, or import astore from local table        
      </p>
      <p>
        The sync from Gun connected store to Dexie is Auto
      </p>
      <p>
        <button @click="importCurrentDixieTableToGun">
          Import current DixieTable to Gun
        </button>
      </p>
    </div>

    <FriendsList v-if="isSyncDefined" ref="friendsListRef" />
  </div>
</template>
<script lang="ts">
import FriendsList from "@/components/DexieExample/FriendsList.vue"; // @ is an alias to /src
import { defineComponent, ref } from "vue";

import {setGunApp} from "./GunApp"

export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {    

    const friendsListRef = ref();
    const isSyncDefined = ref(false);
  
    const gunApplicationId = ref("");
  

    const doStart = async () => {
      setGunApp(gunApplicationId.value)
      isSyncDefined.value=true
    };
    const importCurrentDixieTableToGun = async () => {
      friendsListRef.value.importCurrentDixieTableToGun();
    };

    return {
      isSyncDefined,
      doStart,
      gunApplicationId,
      importCurrentDixieTableToGun,
      friendsListRef,
    };
  },
});
</script>
