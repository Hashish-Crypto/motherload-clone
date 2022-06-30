import { instantiate, Prefab, UITransform, resources, randomRangeInt, Node, SpriteFrame, Sprite } from 'cc'
import IGround from '../types/IGround'

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
        canBeDug: true,
        canBeExploded: true,
        price: 0,
        hardiness: null,
      }
      groundGrid[y][x].node.setPosition(x * squareSide - gridWidth, y * squareSide - gridHeight)

      if (y === groundGridHeight - 1) {
        if (x >= 10 && x <= 18) {
          loadGroundSprite('concrete', y, x, groundGrid)
          groundGrid[y][x].name = 'concrete'
          groundGrid[y][x].canBeDug = false
          groundGrid[y][x].canBeExploded = false
        } else {
          loadGroundSprite('grass', y, x, groundGrid)
          groundGrid[y][x].name = 'grass'
          groundGrid[y][x].hardiness = 1
        }
      } else {
        const randomNumber = randomRangeInt(0, 40)
        if (randomNumber === 0) {
          loadGroundSprite('ironium', y, x, groundGrid)
          groundGrid[y][x].name = 'ironium'
          groundGrid[y][x].hardiness = 1.5
          groundGrid[y][x].price = 30
        } else if (randomNumber === 1) {
          loadGroundSprite('bronzium', y, x, groundGrid)
          groundGrid[y][x].name = 'bronzium'
          groundGrid[y][x].hardiness = 2
          groundGrid[y][x].price = 60
        } else if (randomNumber === 2) {
          loadGroundSprite('silverium', y, x, groundGrid)
          groundGrid[y][x].name = 'silverium'
          groundGrid[y][x].hardiness = 2.5
          groundGrid[y][x].price = 100
        } else if (randomNumber === 3) {
          loadGroundSprite('goldium', y, x, groundGrid)
          groundGrid[y][x].name = 'goldium'
          groundGrid[y][x].hardiness = 3
          groundGrid[y][x].price = 250
        } else if (randomNumber === 4) {
          loadGroundSprite('platinium', y, x, groundGrid)
          groundGrid[y][x].name = 'platinium'
          groundGrid[y][x].hardiness = 3.5
          groundGrid[y][x].price = 750
        } else if (randomNumber === 5) {
          loadGroundSprite('einsteinium', y, x, groundGrid)
          groundGrid[y][x].name = 'einsteinium'
          groundGrid[y][x].hardiness = 4
          groundGrid[y][x].price = 2000
        } else if (randomNumber === 6) {
          loadGroundSprite('emerald', y, x, groundGrid)
          groundGrid[y][x].name = 'emerald'
          groundGrid[y][x].hardiness = 4.5
          groundGrid[y][x].price = 5000
        } else if (randomNumber === 7) {
          loadGroundSprite('ruby', y, x, groundGrid)
          groundGrid[y][x].name = 'ruby'
          groundGrid[y][x].hardiness = 5
          groundGrid[y][x].price = 20000
        } else if (randomNumber === 8) {
          loadGroundSprite('diamond', y, x, groundGrid)
          groundGrid[y][x].name = 'diamond'
          groundGrid[y][x].hardiness = 5.5
          groundGrid[y][x].price = 100000
        } else if (randomNumber === 9) {
          loadGroundSprite('amazonite', y, x, groundGrid)
          groundGrid[y][x].name = 'amazonite'
          groundGrid[y][x].hardiness = 6
          groundGrid[y][x].price = 500000
        } else if (randomNumber === 10) {
          loadGroundSprite('dinosaur_bones', y, x, groundGrid)
          groundGrid[y][x].name = 'dinosaur_bones'
          groundGrid[y][x].hardiness = 2
          groundGrid[y][x].price = 1000
        } else if (randomNumber === 11) {
          loadGroundSprite('treasure', y, x, groundGrid)
          groundGrid[y][x].name = 'treasure'
          groundGrid[y][x].hardiness = 2
          groundGrid[y][x].price = 5000
        } else if (randomNumber === 12) {
          loadGroundSprite('martian_skeleton', y, x, groundGrid)
          groundGrid[y][x].name = 'martian_skeleton'
          groundGrid[y][x].hardiness = 2
          groundGrid[y][x].price = 10000
        } else if (randomNumber === 13) {
          loadGroundSprite('religious_artifact', y, x, groundGrid)
          groundGrid[y][x].name = 'religious_artifact'
          groundGrid[y][x].hardiness = 2
          groundGrid[y][x].price = 50000
        } else if (randomNumber === 14) {
          loadGroundSprite('rock', y, x, groundGrid)
          groundGrid[y][x].name = 'concrete'
          groundGrid[y][x].canBeDug = false
        } else if (randomNumber === 15) {
          loadGroundSprite('lava', y, x, groundGrid)
          groundGrid[y][x].name = 'lava'
          groundGrid[y][x].hardiness = 2
        } else {
          loadGroundSprite('ground', y, x, groundGrid)
          groundGrid[y][x].name = 'ground'
          groundGrid[y][x].hardiness = 1
        }
      }

      groundRef.addChild(groundGrid[y][x].node)
    }
  }
}

const loadGroundSprite = (fileName: string, y: number, x: number, groundGrid: IGround[][]) => {
  resources.load('Textures/Tiles/' + fileName + '/spriteFrame', SpriteFrame, (error, spriteFrame) => {
    groundGrid[y][x].node.getComponent(Sprite).spriteFrame = spriteFrame
    if (error) console.log(error)
  })
}

export default generateGroundGrid
