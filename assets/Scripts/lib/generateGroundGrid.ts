import { instantiate, Prefab, UITransform, resources, randomRangeInt, Node, SpriteFrame, Sprite } from 'cc'
import type IGroundItem from '../types/IGroundItem'
import type IGround from '../types/IGround'
import GroundItems from '../consts/GroundItems'

const generateGroundGrid = (
  groundPrefab: Prefab,
  groundGridWidth: number,
  groundGridHeight: number,
  groundGrid: IGround[][],
  groundRef: Node
) => {
  const tempGroundNode = instantiate(groundPrefab)
  const squareSide = tempGroundNode.getComponent(UITransform).width
  tempGroundNode.destroy()
  const gridWidth = (groundGridWidth / 2) * squareSide
  const gridHeight = groundGridHeight * squareSide
  for (let y = 0; y < groundGridHeight; y += 1) {
    groundGrid[y] = []

    for (let x = 0; x < groundGridWidth; x += 1) {
      groundGrid[y][x] = {
        node: instantiate(groundPrefab),
        active: true,
        name: null,
        canBeDug: null,
        hardiness: null,
        canBeExploded: null,
        damage: null,
        price: null,
        instantCash: null,
      }
      groundGrid[y][x].node.setPosition(x * squareSide - gridWidth, y * squareSide - gridHeight)

      if (y === groundGridHeight - 1) {
        if (x >= 20 && x <= 28) {
          loadGround(GroundItems.concrete, groundGrid[y][x])
        } else {
          loadGround(GroundItems.grass, groundGrid[y][x])
        }
      } else {
        const randomNumber = randomRangeInt(0, 40)
        if (randomNumber === 0) {
          loadGround(GroundItems.ironium, groundGrid[y][x])
        } else if (randomNumber === 1) {
          loadGround(GroundItems.bronzium, groundGrid[y][x])
        } else if (randomNumber === 2) {
          loadGround(GroundItems.silverium, groundGrid[y][x])
        } else if (randomNumber === 3) {
          loadGround(GroundItems.goldium, groundGrid[y][x])
        } else if (randomNumber === 4) {
          loadGround(GroundItems.platinium, groundGrid[y][x])
        } else if (randomNumber === 5) {
          loadGround(GroundItems.einsteinium, groundGrid[y][x])
        } else if (randomNumber === 6) {
          loadGround(GroundItems.emerald, groundGrid[y][x])
        } else if (randomNumber === 7) {
          loadGround(GroundItems.ruby, groundGrid[y][x])
        } else if (randomNumber === 8) {
          loadGround(GroundItems.diamond, groundGrid[y][x])
        } else if (randomNumber === 9) {
          loadGround(GroundItems.amazonite, groundGrid[y][x])
        } else if (randomNumber === 10) {
          loadGround(GroundItems.dinosaurBones, groundGrid[y][x])
        } else if (randomNumber === 11) {
          loadGround(GroundItems.treasure, groundGrid[y][x])
        } else if (randomNumber === 12) {
          loadGround(GroundItems.martianSkeleton, groundGrid[y][x])
        } else if (randomNumber === 13) {
          loadGround(GroundItems.religiousArtifact, groundGrid[y][x])
        } else if (randomNumber === 14) {
          loadGround(GroundItems.rock, groundGrid[y][x])
        } else if (randomNumber === 15) {
          loadGround(GroundItems.lava, groundGrid[y][x])
        } else {
          loadGround(GroundItems.ground, groundGrid[y][x])
        }
      }

      groundRef.addChild(groundGrid[y][x].node)
    }
  }
}

const loadGround = (groundItem: IGroundItem, ground: IGround) => {
  resources.load('Textures/Tiles/' + groundItem.name + '/spriteFrame', SpriteFrame, (error, spriteFrame) => {
    ground.node.getComponent(Sprite).spriteFrame = spriteFrame
    if (error) console.log(error)
  })
  ground.name = groundItem.name
  ground.canBeDug = groundItem.canBeDug
  ground.hardiness = groundItem.hardiness
  ground.canBeExploded = groundItem.canBeExploded
  ground.damage = groundItem.damage
  ground.price = groundItem.price
  ground.instantCash = groundItem.instantCash
}

export default generateGroundGrid
