export default interface IGroundItem {
  name: string
  canBeDug: boolean
  hardiness: number | null
  canBeExploded: boolean
  damage: number | null
  price: number | null
  instantCash: boolean
}
