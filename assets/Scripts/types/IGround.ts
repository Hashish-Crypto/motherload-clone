import { Node } from 'cc'

export default interface IGround {
  node: Node
  active: boolean
  name: string | null
  canBeDug: boolean
  canBeExploded: boolean
  hardiness: number | null
  price: number
}
