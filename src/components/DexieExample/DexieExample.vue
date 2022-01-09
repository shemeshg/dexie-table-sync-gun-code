<template>
  <p v-if="!isIpfsReady">Loading IPFS...</p>
  <div v-if="isIpfsReady">
    <p v-if="isSyncDefined">Sync with {{ syncUrl }}</p>
    <button v-if="isSyncDefined" @click="doUndefineSync">undefine sync</button>
    <input type="text" v-if="!isSyncDefined" v-model="orbitdbUrlToOpen" />
    <button v-if="!isSyncDefined" @click="doDefineSync">Start Gun</button>
    <div v-if="isSyncDefined">
      <p>
        Since every node rollup its own changes, no consistency among nodes
        guaranteed <br />
        Send replica to all, to set current replica as source of truth, <br />
        and other nodes will re-rollup on top of that <br />
      </p>
      <p>
        <button @click="sendReplicaToall">Send replica to all</button>
      </p>
    </div>

    <FriendsList v-if="isSyncDefined" />
  </div>
</template>
<script lang="ts">
import FriendsList from "@/components/DexieExample/FriendsList.vue"; // @ is an alias to /src
import { defineComponent, ref, onMounted } from "vue";


export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {

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

//paste.oninput = () => { copy.put(paste.value) };


      /*
    copy.on((data) => { paste.value = data });
        

      };
    */
    };
    const sendReplicaToall = async () => {
      //
    };
    onMounted(doOnMounted);

    return {
      isSyncDefined,
      doUndefineSync,
      doDefineSync,
      syncUrl,
      orbitdbUrlToOpen,
      isIpfsReady,
      sendReplicaToall,
    };
  },
});
</script>
