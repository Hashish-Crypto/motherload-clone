import { Node } from 'cc'
import type IGroundItem from './IGroundItem'

export default interface IGround extends IGroundItem {
  node: Node
  active: boolean
}
