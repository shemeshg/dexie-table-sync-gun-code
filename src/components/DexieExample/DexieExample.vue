<template>
  <p v-if="!isIpfsReady">Loading IPFS...</p>
  <div v-if="isIpfsReady">
    <p>Status {{ syncUrl }}</p>
    <button v-if="isSyncDefined" @click="doLogout">Logout gun</button>
    <div v-if="!isSyncDefined">
      User name:
      <input type="text" v-if="!isSyncDefined" v-model="gunStoreUser" />
      Password:
      <input type="text" v-if="!isSyncDefined" v-model="gunStorePassword" />
    </div>
    <button v-if="!isSyncDefined" @click="doAuthenticate">
      Login and sync Gun
    </button>
    <button v-if="!isSyncDefined" @click="doRegisterUser">
      Register new user
    </button>
    <div v-if="isSyncDefined">
      <p>
        If you want to recreate the Gun Store, or import astore just created new
        store
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

import {gunApp} from "./GunApp"

export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {    

    const friendsListRef = ref();
    const isIpfsReady = ref(false);
    const isSyncDefined = ref(false);
    const syncUrl = ref("");
    const gunStoreUser = ref("");
    const gunStorePassword = ref("");
    const doOnMounted = async () => {
      isSyncDefined.value = gunApp.gunAuth.isLoggedIn;
      isIpfsReady.value = true;
    };

    const doLogout = async () => {
      gunApp.gunAuth.gunLogout();
      isSyncDefined.value = false;
    };

    const doAuthenticate = async () => {

      try {
        (await gunApp.gunAuth.gunAuthUser(
          gunStoreUser.value,
          gunStorePassword.value
        )) as string;
        syncUrl.value = "User authenticated";
      } catch (e) {
        syncUrl.value = e as string;
        return;
      }

      isSyncDefined.value = true;
      syncUrl.value = "";
    };
    const importCurrentDixieTableToGun = async () => {
      friendsListRef.value.importCurrentDixieTableToGun();
    };

    const doRegisterUser = async () => {
      try {
        (await gunApp.gunAuth.gunRegisterUser(
          gunStoreUser.value,
          gunStorePassword.value
        )) as string;
        syncUrl.value = "User created, please login";
      } catch (e) {
        syncUrl.value = e as string;
        return;
      }
    };
    onMounted(doOnMounted);

    return {
      isSyncDefined,
      doLogout,
      doAuthenticate,
      syncUrl,
      gunStoreUser,
      isIpfsReady,
      importCurrentDixieTableToGun,
      friendsListRef,
      gunStorePassword,
      doRegisterUser,
    };
  },
});
</script>
