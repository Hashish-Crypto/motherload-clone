import { PlayerManager } from '../PlayerManager'
import IGround from '../types/IGround'

const calculateDamage = (ground: IGround, player: PlayerManager) => {
  if (ground.damage !== null) {
    player.attributes.currentHullResistance -= ground.damage * player.attributes.radiator
  }
}

export default calculateDamage
