import {
  _decorator,
  Component,
  Node,
  Prefab,
  PhysicsSystem2D,
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
import generateGroundGrid from './lib/generateGroundGrid'
import IGround from './types/IGround'

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

const { ccclass, property } = _decorator

@ccclass('GameSceneManager')
export class GameSceneManager extends Component {
  @property({ type: Node })
  public groundRef: Node | null = null

  @property({ type: Prefab })
  public groundPrefab: Prefab | null = null

  @property({ type: Node })
  public player: Node | null = null

  private _groundGrid: IGround[][] = []
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
  private _groundHardiness: number = 1
  private _groundHardinessTimer: number = 0

  onLoad() {
    // Generate ground.
    generateGroundGrid(
      this.groundPrefab,
      this._groundGridWidth,
      this._groundGridHeight,
      this._groundGrid,
      this.groundRef
    )

    input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this._onKeyUp, this)
    this._playerManager = this.player.getComponent(PlayerManager)

    PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this)
  }

  update(deltaTime: number) {
    // If the movement key is pressed, it maintains a continuous impulse.
    if (this._playerControllerActive && this._movementCommands.length >= 1 && this._movementTimerActive) {
      this._movementTimer += deltaTime
      if (this._movementTimer >= 0.1) {
        this._movePlayer()
        this._movementTimer = 0
      }
    }

    // Periodically check if there is a ground that can be dug.
    if (this._playerControllerActive && this._movementCommands.length >= 1 && this._canDigDownTimerActive) {
      this._canDigDownTimer += deltaTime
      this._groundHardinessTimer += deltaTime
      if (this._canDigDownTimer >= 0.25) {
        if (this._canDigDown()) {
          this._playerManager.digDownLeft()
        }
        this._movementTimer = 0
      }
    }
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
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.UP)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.RIGHT)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleRight()
          this._movementTimerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.DOWN)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
          this._canDigDownTimerActive = false
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.LEFT)
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
    // TODO: Check if velocity is to high, if so do damage.
  }

  private _canDigDown(): boolean {
    const groundNodes: IGroundNode[] = []
    let validNodes = 0

    // Get all valid ground.
    for (let y = 0; y < this._groundGridHeight; y += 1) {
      for (let x = 0; x < this._groundGridWidth; x += 1) {
        if (isValid(this._groundGrid[y][x])) {
          groundNodes.push({
            x: this._groundGrid[y][x].node.position.x,
            y: this._groundGrid[y][x].node.position.y,
            distance: this._getDistanceBetweenPoints(
              this.player.position.x,
              this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
              this._groundGrid[y][x].node.position.x,
              this._groundGrid[y][x].node.position.y
            ),
            node: this._groundGrid[y][x].node,
          })

          validNodes += 1
        }
      }
    }

    if (validNodes === 0) return false

    groundNodes.sort((a, b) => a.distance - b.distance)

    // Get the 8 closest grounds to the player.
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

    // Check if the ground below is in contact with the player.
    const h1 =
      this.player.getComponent(BoxCollider2D).size.height / 2 +
      belowPlayerGrounds[0].node.getComponent(UITransform).contentSize.height / 2
    const w1 = belowPlayerGrounds[0].node.getComponent(UITransform).contentSize.width / 2
    const h2 = Math.abs(
      this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y - belowPlayerGrounds[0].y
    )
    if (Math.hypot(h1, w1) >= belowPlayerGrounds[0].distance && h2 <= h1 + 2) {
      if (this._groundHardinessTimer >= this._groundHardiness) {
        belowPlayerGrounds[0].node.destroy()
        this._groundHardinessTimer = 0
      }
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
