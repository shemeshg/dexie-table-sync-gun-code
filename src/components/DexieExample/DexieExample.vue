<template>
  <p v-if="!isIpfsReady">Loading IPFS...</p>
  <div v-if="isIpfsReady">
    <p v-if="isSyncDefined">Sync with {{ syncUrl }}</p>
    <button v-if="isSyncDefined" @click="doUndefineSync">undefine sync</button>
    <input type="text" v-if="!isSyncDefined" v-model="orbitdbUrlToOpen" />
    <button v-if="!isSyncDefined" @click="doDefineSync">Start Gun</button>
    <div v-if="isSyncDefined">
      <p>
          If you want to recreate the Gun Store, or import a new store
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
import { defineComponent, ref, onMounted } from "vue";


export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {
    const friendsListRef=ref()
    const isIpfsReady = ref(false);
    const isSyncDefined = ref(false);
    const syncUrl = ref("");
    const orbitdbUrlToOpen = ref("");

    const doOnMounted = async () => {
      isIpfsReady.value = true;
    };

    const doUndefineSync = async () => {
      isSyncDefined.value = false;
    };



    const doDefineSync = async () => {
      await doUndefineSync();

      isSyncDefined.value = true;
      syncUrl.value = "";

    };
    const importCurrentDixieTableToGun = async () => {
      friendsListRef.value.importCurrentDixieTableToGun();
      
    };
    onMounted(doOnMounted);

    return {
      isSyncDefined,
      doUndefineSync,
      doDefineSync,
      syncUrl,
      orbitdbUrlToOpen,
      isIpfsReady,
      importCurrentDixieTableToGun,
      friendsListRef,
    };
  },
});
</script>
