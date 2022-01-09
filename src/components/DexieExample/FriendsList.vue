<template>
  <button @click="runTest">run test</button><br />
  <p>Add friend</p>
  <FriendAdder
    @friend-add="friendAdd"
    :status="addStatus"
    ref="friendAddComponentRef"
  />
  <li v-for="item in frendslistAry" :key="item.oid">
    {{ item.name }} {{ item.age }}
    <button @click="delItem(item.oid)">Del</button>
  </li>
</template>
<script lang="ts">
import FriendAdder from "@/components/DexieExample/FriendAdder.vue"; // @ is an alias to /src
import { defineComponent, ref, onMounted, Ref } from "vue";
import { GunDexie, gun } from "./GunHelper";
import { Friend, db } from "./db";

export default defineComponent({
  props: {
    refreshText: String,
  },
  components: { FriendAdder },
  setup() {
    const addStatus = ref("");
    const friendAddComponentRef = ref();
    const frendslistAry: Ref<Friend[]> = ref([]);
    const tbStore = gun.get("db-998135").get("fiends");
    const dexieGunFriends = new GunDexie<Friend>(
      db.friends,
      tbStore,
    );

    dexieGunFriends.setCallback(async (row:any, key: any)=>{
      debugger;
      await dexieGunFriends.doSyncGunToDexie(row, key)
      frendslistAry.value = await dexieGunFriends.dxTable.toArray();
      frendslistAry.value = frendslistAry.value.filter((row)=>{return (row as any).deleted === false})
      console.log(frendslistAry.value)
      debugger;
    })

    const friendAdd = async (params: Friend) => {
      addStatus.value = "";

      try {
        // Add the new friend!
        const id = await dexieGunFriends.add({
          name: params.name,
          age: params.age,
        });

        addStatus.value = `Friend ${params.name}
          successfully added. Got id ${id}`;

        friendAddComponentRef.value.resetForm();
        frendslistAry.value = await dexieGunFriends.dxTable.toArray();
        frendslistAry.value = frendslistAry.value.filter((row)=>{return (row as any).deleted === false})
      } catch (error) {
        addStatus.value = `Failed to add
          ${params.name}: ${error}`;
      }
    };

    const doOnMounted = async () => {
      frendslistAry.value = await dexieGunFriends.dxTable.toArray();
      frendslistAry.value = frendslistAry.value.filter((row)=>{return (row as any).deleted === false})
      //
    };

    const delItem = async (id: string) => {
      await dexieGunFriends.delete(id);
      frendslistAry.value = await dexieGunFriends.dxTable.toArray();
      frendslistAry.value = frendslistAry.value.filter((row)=>{return (row as any).deleted === false})
      addStatus.value = `Deleted ${id}`;

        friendAddComponentRef.value.resetForm();
      debugger
    };

    const runTest = () => {
      dexieGunFriends.syncGunToDexie();
    };
    onMounted(doOnMounted);

    return {
      addStatus,
      friendAdd,
      friendAddComponentRef,
      delItem,
      doOnMounted,
      frendslistAry,
      runTest,
    };
  },
});
</script>
