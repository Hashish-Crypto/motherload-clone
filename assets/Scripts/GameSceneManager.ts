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
  NULL,
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
  private _groundGridWidth: number = 30
  private _groundGridHeight: number = 90
  private _playerControllerActive: boolean = true
  private _movementCommands: Direction[] = []
  private _lastMovementCommand: Direction = Direction.NULL
  private _playerManager: PlayerManager | null = null
  private _movementTimer: number = 0
  private _movementTimerActive: boolean = false
  private _canDigDownTimer: number = 0
  private _canDigDownTimerActive: boolean = false
  private

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
    if (this._playerControllerActive && this._movementCommands.length >= 1 && this._movementTimerActive) {
      this._movementTimer += deltaTime
      if (this._movementTimer >= 0.1) {
        this._movePlayer()
        this._movementTimer = 0
      }
    }

    if (this._playerControllerActive && this._movementCommands.length >= 1 && this._canDigDownTimerActive) {
      this._canDigDownTimer += deltaTime
      if (this._canDigDownTimer >= 0.25) {
        if (this._canDigDown()) {
          this._playerManager.digDownLeft()
        }
        this._movementTimer = 0
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
      if (event.keyCode === KeyCode.KEY_W && !this._movementCommands.includes(Direction.UP)) {
        this._lastMovementCommand = Direction.UP
        this._movementCommands.push(Direction.UP)
        this._movePlayer()
        this._movementTimerActive = true
      } else if (event.keyCode === KeyCode.KEY_D && !this._movementCommands.includes(Direction.RIGHT)) {
        this._lastMovementCommand = Direction.RIGHT
        this._movementCommands.push(Direction.RIGHT)
        this._movePlayer()
        this._movementTimerActive = true
      } else if (event.keyCode === KeyCode.KEY_S && !this._movementCommands.includes(Direction.DOWN)) {
        this._lastMovementCommand = Direction.DOWN
        this._movementCommands.push(Direction.DOWN)
        if (this._canDigDown()) {
          this._movePlayer()
        }
        this._canDigDownTimerActive = true
      } else if (event.keyCode === KeyCode.KEY_A && !this._movementCommands.includes(Direction.LEFT)) {
        this._lastMovementCommand = Direction.LEFT
        this._movementCommands.push(Direction.LEFT)
        this._movePlayer()
        this._movementTimerActive = true
      }
    }
  }

  private _onKeyUp(event: EventKeyboard) {
    if (this._playerControllerActive) {
      if (event.keyCode === KeyCode.KEY_W) {
        this._movementCommands = this._removeItem(this._movementCommands, Direction.UP)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._movementCommands = this._removeItem(this._movementCommands, Direction.RIGHT)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleRight()
          this._movementTimerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._movementCommands = this._removeItem(this._movementCommands, Direction.DOWN)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
          this._canDigDownTimerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._movementCommands = this._removeItem(this._movementCommands, Direction.LEFT)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
        }
      }

      // If there is still a key pressed, it triggers the player movement.
      if (this._lastMovementCommand !== this._movementCommands[this._movementCommands.length - 1]) {
        this._movePlayer()
        this._movementTimerActive = true
      }
    }
  }

  private _removeItem(arr: Direction[], value: Direction) {
    return arr.filter((element) => element !== value)
  }

  private _movePlayer() {
    if (this._movementCommands.length >= 1) {
      if (this._movementCommands[this._movementCommands.length - 1] === Direction.UP) {
        this._playerManager.flyLeft()
      } else if (this._movementCommands[this._movementCommands.length - 1] === Direction.RIGHT) {
        this._playerManager.moveRight()
      } else if (this._movementCommands[this._movementCommands.length - 1] === Direction.DOWN) {
        this._playerManager.digDownLeft()
      } else if (this._movementCommands[this._movementCommands.length - 1] === Direction.LEFT) {
        this._playerManager.moveLeft()
      }
    }
  }

  private _onBeginContact(a: Collider2D, b: Collider2D) {
    // TODO: Check if velocity is to high than do damage
  }

  private _canDigDown(): boolean {
    const groundNodes: IGroundNode[] = []
    let validNodes = 0

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

          validNodes += 1
        }
      }
    }

    if (validNodes === 0) return false

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

    if (belowPlayerGrounds.length === 0) return false

    const h1 =
      this.player.getComponent(BoxCollider2D).size.height / 2 +
      belowPlayerGrounds[0].node.getComponent(UITransform).contentSize.height / 2
    const w1 = belowPlayerGrounds[0].node.getComponent(UITransform).contentSize.width / 2
    const h2 = Math.abs(
      this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y - belowPlayerGrounds[0].y
    )

    if (Math.hypot(h1, w1) >= belowPlayerGrounds[0].distance && h2 <= h1 + 2) {
      belowPlayerGrounds[0].node.destroy()
      return true
    }

    return false
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
