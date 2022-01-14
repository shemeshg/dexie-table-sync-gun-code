import { GunApp } from "./GunApp/GunApp"
export let gunApp: GunApp

export function setGunApp(applicationId: string): void {
  gunApp = new GunApp(applicationId)
}
