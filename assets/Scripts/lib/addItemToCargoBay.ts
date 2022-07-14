import { PlayerManager } from '../PlayerManager'
import IGround from '../types/IGround'

const addItemToCargoBay = (ground: IGround, player: PlayerManager) => {
  if (ground.price !== null) {
    if (ground.instantCash) {
      player.attributes.wallet += ground.price
      return
    }

    if (player.attributes.currentCargoBayCapacity >= 1) {
      player.attributes.cargoBayItems.push({
        name: ground.name,
        price: ground.price,
      })
      player.attributes.currentCargoBayCapacity -= 1
    }
  }
}

export default addItemToCargoBay
