<template>
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
import { ItfDixieGunTable } from "./GunApp/GunDexieTable";

import { gunApp } from "./GunApp";
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

    const dexieGunFriends = gunApp.createStore<Friend>("friends", db.friends);

    const refreshListvie = async () => {
      frendslistAry.value = await dexieGunFriends.dxTable.toArray();
      frendslistAry.value = frendslistAry.value.filter((row) => {
        return row.deleted === false;
      });
    };

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
        refreshListvie();
      } catch (error) {
        addStatus.value = `Failed to add
          ${params.name}: ${error}`;
      }
    };

    const doOnMounted = async () => {

      await dexieGunFriends.setCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (row: ItfDixieGunTable<Friend>, key: string) => {
          //await dexieGunFriends.doSyncGunToDexie(row, key);
          refreshListvie();
        },
        this
      );
      refreshListvie();
    };

    const delItem = async (id: string) => {
      await dexieGunFriends.delete(id);
      refreshListvie();
      addStatus.value = `Deleted ${id}`;

      friendAddComponentRef.value.resetForm();
    };

    const importCurrentDixieTableToGun = async () => {
      await dexieGunFriends.importCurrentDixieTableToGun();
    };


    onMounted(doOnMounted);

    return {
      addStatus,
      friendAdd,
      friendAddComponentRef,
      delItem,
      doOnMounted,
      frendslistAry,
      importCurrentDixieTableToGun,
    };
  },
});
</script>
