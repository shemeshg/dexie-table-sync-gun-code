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
import { GunDexie, gun, ItfDixieGunTable } from "./GunHelper";
import { Friend, db } from "./db";

export default defineComponent({
  props: {
    refreshText: String,
  },
  components: { FriendAdder },
  setup() {
    const addStatus = ref("");
    const friendAddComponentRef = ref();

    const frendslistAry: Ref<ItfDixieGunTable<Friend>[]> = ref([]);
    const tbStore = gun.get("db-998138").get("fiends");
    
    const dexieGunFriends = new GunDexie<Friend>(db.friends, tbStore);

    const refreshListvie = async () => {
      frendslistAry.value = await dexieGunFriends.dxTable.toArray();
      frendslistAry.value = frendslistAry.value.filter((row) => {
        return row.deleted === false;
      });
    };

    dexieGunFriends.setCallback(
      async (row: ItfDixieGunTable<Friend>, key: string) => {
        await dexieGunFriends.doSyncGunToDexie(row, key);
        refreshListvie()
      }
    );

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
        refreshListvie()
      } catch (error) {
        addStatus.value = `Failed to add
          ${params.name}: ${error}`;
      }
    };

    const doOnMounted = async () => {
      refreshListvie()
    };

    const delItem = async (id: string) => {
      await dexieGunFriends.delete(id);
      refreshListvie()
      addStatus.value = `Deleted ${id}`;

      friendAddComponentRef.value.resetForm();
    };

    const importCurrentDixieTableToGun=async()=>{
      await dexieGunFriends.importCurrentDixieTableToGun()
    }

    const runTest = () => {
      debugger;
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
      importCurrentDixieTableToGun
    };
  },
});
</script>
