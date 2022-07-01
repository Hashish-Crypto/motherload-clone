export default interface IGroundItem {
  name: string | null
  canBeDug: boolean | null
  hardiness: number | null
  canBeExploded: boolean | null
  damage: number | null
  price: number | null
  instantCash: boolean | null
}
