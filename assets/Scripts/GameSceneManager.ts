import {
  _decorator,
  Component,
  Node,
  Prefab,
  PhysicsSystem2D,
  instantiate,
  randomRangeInt,
  Sprite,
  resources,
  SpriteFrame,
  UITransform,
  EventKeyboard,
  input,
  Input,
  KeyCode,
  Contact2DType,
  Collider2D,
  Vec2,
  BoxCollider2D,
  isValid,
} from 'cc'
import { PlayerManager } from './PlayerManager'

const { ccclass, property } = _decorator

interface IGroundNode {
  x: number
  y: number
  distance: number
  node: Node
}

enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

@ccclass('GameSceneManager')
export class GameSceneManager extends Component {
  @property({ type: Node })
  public groundRef: Node | null = null

  @property({ type: Prefab })
  public groundPrefab: Prefab | null = null

  @property({ type: Node })
  public player: Node | null = null

  private _groundGrid: Node[][] = []
  private _groundGridWidth: number = 20
  private _groundGridHeight: number = 20
  private _playerControllerActive: boolean = true
  private _movementCommands: string[] = []
  private _lastMovementCommand: string = ''
  private _playerManager: PlayerManager | null = null
  private _timer: number = 0
  private _timerActive: boolean = false

  onLoad() {
    const tempGroundNode = instantiate(this.groundPrefab)
    const squareSide = tempGroundNode.getComponent(UITransform).width
    tempGroundNode.destroy()
    const gridWidth = (this._groundGridWidth / 2) * squareSide
    const gridHeight = this._groundGridHeight * squareSide
    for (let y = 0; y < this._groundGridHeight; y += 1) {
      this._groundGrid[y] = []

      for (let x = 0; x < this._groundGridWidth; x += 1) {
        this._groundGrid[y][x] = instantiate(this.groundPrefab)
        this._groundGrid[y][x].setPosition(x * squareSide - gridWidth, y * squareSide - gridHeight)

        if (y === this._groundGridHeight - 1) {
          if (x >= 10 && x <= 18) {
            this._loadGroundSprite('concrete', y, x)
          } else {
            this._loadGroundSprite('grass', y, x)
          }
        } else {
          const randomNumber = randomRangeInt(0, 40)
          if (randomNumber === 0) {
            this._loadGroundSprite('ironium', y, x)
          } else if (randomNumber === 1) {
            this._loadGroundSprite('bronzium', y, x)
          } else if (randomNumber === 2) {
            this._loadGroundSprite('silverium', y, x)
          } else if (randomNumber === 3) {
            this._loadGroundSprite('goldium', y, x)
          } else if (randomNumber === 4) {
            this._loadGroundSprite('platinium', y, x)
          } else if (randomNumber === 5) {
            this._loadGroundSprite('einsteinium', y, x)
          } else if (randomNumber === 6) {
            this._loadGroundSprite('emerald', y, x)
          } else if (randomNumber === 7) {
            this._loadGroundSprite('ruby', y, x)
          } else if (randomNumber === 8) {
            this._loadGroundSprite('diamond', y, x)
          } else if (randomNumber === 9) {
            this._loadGroundSprite('amazonite', y, x)
          } else if (randomNumber === 10) {
            this._loadGroundSprite('dinosaur_bones', y, x)
          } else if (randomNumber === 11) {
            this._loadGroundSprite('treasure', y, x)
          } else if (randomNumber === 12) {
            this._loadGroundSprite('martian_skeleton', y, x)
          } else if (randomNumber === 13) {
            this._loadGroundSprite('relic', y, x)
          } else if (randomNumber === 14) {
            this._loadGroundSprite('rock', y, x)
          } else if (randomNumber === 15) {
            this._loadGroundSprite('lava', y, x)
          } else {
            this._loadGroundSprite('ground', y, x)
          }
        }

        this.groundRef.addChild(this._groundGrid[y][x])
      }
    }

    input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this._onKeyUp, this)
    this._playerManager = this.player.getComponent(PlayerManager)

    PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this)
  }

  update(deltaTime: number) {
    if (this._playerControllerActive && this._movementCommands.length >= 1 && this._timerActive) {
      this._timer += deltaTime
      if (this._timer >= 0.1) {
        this._movePlayer()
        this._timer = 0
      }
    }
  }

  private _loadGroundSprite(fileName: string, y: number, x: number) {
    resources.load('Textures/Tiles/' + fileName + '/spriteFrame', SpriteFrame, (error, spriteFrame) => {
      this._groundGrid[y][x].getComponent(Sprite).spriteFrame = spriteFrame
      if (error) console.log(error)
    })
  }

  private _onKeyDown(event: EventKeyboard) {
    if (this._playerControllerActive) {
      if (event.keyCode === KeyCode.KEY_W && !this._movementCommands.includes('w')) {
        this._lastMovementCommand = 'w'
        this._movementCommands.push('w')
        this._movePlayer()
        this._timerActive = true
      } else if (event.keyCode === KeyCode.KEY_D && !this._movementCommands.includes('d')) {
        this._lastMovementCommand = 'd'
        this._movementCommands.push('d')
        this._movePlayer()
        this._timerActive = true
      } else if (event.keyCode === KeyCode.KEY_S && !this._movementCommands.includes('s')) {
        this._lastMovementCommand = 's'
        this._movementCommands.push('s')
        this._movePlayer()
        this._belowPlayerGround()
        this._timerActive = true
      } else if (event.keyCode === KeyCode.KEY_A && !this._movementCommands.includes('a')) {
        this._lastMovementCommand = 'a'
        this._movementCommands.push('a')
        this._movePlayer()
        this._timerActive = true
      }
    }
  }

  private _onKeyUp(event: EventKeyboard) {
    if (this._playerControllerActive) {
      if (event.keyCode === KeyCode.KEY_W) {
        this._movementCommands = this._removeItem(this._movementCommands, 'w')
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._timerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._movementCommands = this._removeItem(this._movementCommands, 'd')
        if (this._movementCommands.length === 0) {
          this._playerManager.idleRight()
          this._timerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._movementCommands = this._removeItem(this._movementCommands, 's')
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._timerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._movementCommands = this._removeItem(this._movementCommands, 'a')
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._timerActive = false
        }
      }

      // If there is still a key pressed, it triggers the player movement.
      if (this._lastMovementCommand !== this._movementCommands[this._movementCommands.length - 1]) {
        this._movePlayer()
        this._timerActive = true
      }
    }
  }

  private _removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }

  private _movePlayer() {
    if (this._movementCommands.length >= 1) {
      if (this._movementCommands[this._movementCommands.length - 1] === 'w') {
        this._playerManager.flyLeft()
      } else if (this._movementCommands[this._movementCommands.length - 1] === 'd') {
        this._playerManager.moveRight()
      } else if (this._movementCommands[this._movementCommands.length - 1] === 's') {
        this._playerManager.digDownLeft()
      } else if (this._movementCommands[this._movementCommands.length - 1] === 'a') {
        this._playerManager.moveLeft()
      }
    }
  }

  private _onBeginContact(a: Collider2D, b: Collider2D) {
    // TODO: Check if velocity is to high than do damage
  }

  private _belowPlayerGround() {
    // TODO: Check if the active nodes on this._groundGrid
    const groundNodes: IGroundNode[] = []

    for (let y = 0; y < this._groundGridHeight; y += 1) {
      for (let x = 0; x < this._groundGridWidth; x += 1) {
        if (isValid(this._groundGrid[y][x])) {
          groundNodes.push({
            x: this._groundGrid[y][x].position.x,
            y: this._groundGrid[y][x].position.y,
            distance: this._getDistanceBetweenPoints(
              this.player.position.x,
              this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
              this._groundGrid[y][x].position.x,
              this._groundGrid[y][x].position.y
            ),
            node: this._groundGrid[y][x],
          })
        }
      }
    }

    groundNodes.sort((a, b) => a.distance - b.distance)

    const belowPlayerGrounds: IGroundNode[] = []
    for (let i = 0; i < 8; i += 1) {
      if (
        this._getVectorDirection(
          this.player.position.x,
          this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
          groundNodes[i].x,
          groundNodes[i].y
        ) === Direction.DOWN
      ) {
        belowPlayerGrounds.push(groundNodes[i])
      }
    }

    if (belowPlayerGrounds.length === 0) return

    if (
      Math.hypot(
        this.player.getComponent(BoxCollider2D).size.height / 2 +
          belowPlayerGrounds[0].node.getComponent(UITransform).contentSize.height / 2,
        belowPlayerGrounds[0].node.getComponent(UITransform).contentSize.width / 2
      ) >= belowPlayerGrounds[0].distance
    ) {
      belowPlayerGrounds[0].node.destroy()
    }
  }

  private _getDistanceBetweenPoints(xA: number, yA: number, xB: number, yB: number) {
    return Math.hypot(xB - xA, yB - yA)
  }

  private _getVectorDirection(xA: number, yA: number, xB: number, yB: number) {
    const vector = new Vec2(xB - xA, yB - yA).normalize()
    const piDividedBy4 = Math.PI / 4
    if (vector.x < piDividedBy4 && vector.x > -piDividedBy4 && vector.y >= piDividedBy4) {
      return Direction.UP
    }
    if (vector.x >= piDividedBy4 && vector.y < piDividedBy4 && vector.y > -piDividedBy4) {
      return Direction.RIGHT
    }
    if (vector.x < piDividedBy4 && vector.x > -piDividedBy4 && vector.y <= -piDividedBy4) {
      return Direction.DOWN
    }
    if (vector.x <= -piDividedBy4 && vector.y < piDividedBy4 && vector.y > -piDividedBy4) {
      return Direction.LEFT
    }

    return undefined
  }
}
