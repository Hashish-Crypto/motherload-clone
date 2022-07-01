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
  BoxCollider2D,
} from 'cc'
import { PlayerManager } from './PlayerManager'
import generateGroundGrid from './lib/generateGroundGrid'
import getDistanceBetweenPoints from './lib/getDistanceBetweenPoints'
import getVectorDirection from './lib/getVectorDirection'
import type IGround from './types/IGround'
import Direction from './enums/Direction'

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
  private _groundGridWidth: number = 50
  private _groundGridHeight: number = 100
  private _playerControllerActive: boolean = true
  private _movementCommands: Direction[] = []
  private _lastMovementCommand: Direction = Direction.NULL
  private _playerManager: PlayerManager | null = null
  private _movementTimer: number = 0
  private _movementTimerActive: boolean = false
  private _canDigTimer: number = 0
  private _canDigTimerActive: boolean = false
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
    if (this._playerControllerActive && this._movementCommands.length >= 1 && this._canDigTimerActive) {
      this._canDigTimer += deltaTime
      this._groundHardinessTimer += deltaTime
      if (this._canDigTimer >= 0.25) {
        if (this._lastMovementCommand === Direction.DOWN && this._canDig(Direction.DOWN)) {
          this._playerManager.digDownLeft()
        } else if (this._lastMovementCommand === Direction.LEFT && this._canDig(Direction.LEFT)) {
          this._playerManager.digLeft()
        } else if (this._lastMovementCommand === Direction.RIGHT && this._canDig(Direction.RIGHT)) {
          this._playerManager.digRight()
        }
        this._canDigTimer = 0
      }
    }
  }

  private _onKeyDown(event: EventKeyboard) {
    if (this._playerControllerActive) {
      if (event.keyCode === KeyCode.KEY_W && !this._movementCommands.includes(Direction.UP)) {
        this._lastMovementCommand = Direction.UP
        this._movementCommands.push(Direction.UP)
        this._movePlayer()
      } else if (event.keyCode === KeyCode.KEY_D && !this._movementCommands.includes(Direction.RIGHT)) {
        this._lastMovementCommand = Direction.RIGHT
        this._movementCommands.push(Direction.RIGHT)
        this._movePlayer()
      } else if (event.keyCode === KeyCode.KEY_S && !this._movementCommands.includes(Direction.DOWN)) {
        this._lastMovementCommand = Direction.DOWN
        this._movementCommands.push(Direction.DOWN)
        this._movePlayer()
      } else if (event.keyCode === KeyCode.KEY_A && !this._movementCommands.includes(Direction.LEFT)) {
        this._lastMovementCommand = Direction.LEFT
        this._movementCommands.push(Direction.LEFT)
        this._movePlayer()
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
          this._groundHardinessTimer = 0
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.RIGHT)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleRight()
          this._movementTimerActive = false
          this._canDigTimerActive = false
          this._groundHardinessTimer = 0
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.DOWN)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
          this._canDigTimerActive = false
          this._groundHardinessTimer = 0
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._movementCommands = this._movementCommands.filter((direction) => direction !== Direction.LEFT)
        if (this._movementCommands.length === 0) {
          this._playerManager.idleLeft()
          this._movementTimerActive = false
          this._canDigTimerActive = false
          this._groundHardinessTimer = 0
        }
      }

      // If there is still a key pressed, it triggers the player movement.
      if (this._lastMovementCommand !== this._movementCommands[this._movementCommands.length - 1]) {
        this._movePlayer()
      }
    }
  }

  private _movePlayer() {
    if (this._movementCommands.length >= 1) {
      if (this._movementCommands[this._movementCommands.length - 1] === Direction.UP) {
        this._playerManager.flyLeft()
        this._movementTimerActive = true
      } else if (this._movementCommands[this._movementCommands.length - 1] === Direction.RIGHT) {
        if (this._canDig(Direction.RIGHT)) {
          this._playerManager.digRight()
          this._canDigTimerActive = true
        } else {
          this._playerManager.moveRight()
        }
        this._movementTimerActive = true
      } else if (this._movementCommands[this._movementCommands.length - 1] === Direction.DOWN) {
        if (this._canDig(Direction.DOWN)) {
          this._playerManager.digDownLeft()
          this._canDigTimerActive = true
        } else {
          this._playerManager.idleLeft()
        }
        this._movementTimerActive = true
      } else if (this._movementCommands[this._movementCommands.length - 1] === Direction.LEFT) {
        if (this._canDig(Direction.LEFT)) {
          this._playerManager.digLeft()
          this._canDigTimerActive = true
        } else {
          this._playerManager.moveLeft()
        }
        this._movementTimerActive = true
      }
    }
  }

  private _onBeginContact(a: Collider2D, b: Collider2D) {
    // TODO: Check if velocity is to high, if so do damage.
  }

  private _canDig(direction: Direction): boolean {
    const groundNodes: {
      distance: number
      ground: IGround
    }[] = []
    let validNodes = 0

    // Get all active ground.
    for (let y = 0; y < this._groundGridHeight; y += 1) {
      for (let x = 0; x < this._groundGridWidth; x += 1) {
        if (this._groundGrid[y][x].active) {
          groundNodes.push({
            distance: getDistanceBetweenPoints(
              this.player.position.x,
              this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
              this._groundGrid[y][x].node.position.x,
              this._groundGrid[y][x].node.position.y
            ),
            ground: this._groundGrid[y][x],
          })

          validNodes += 1
        }
      }
    }

    if (validNodes === 0) return false

    groundNodes.sort((a, b) => a.distance - b.distance)

    const closestToPlayerGrounds: {
      distance: number
      ground: IGround
    }[] = []

    if (direction === Direction.DOWN) {
      // Get the 8 closest grounds to the player.
      for (let i = 0; i < 8; i += 1) {
        if (
          getVectorDirection(
            this.player.position.x,
            this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
            groundNodes[i].ground.node.position.x,
            groundNodes[i].ground.node.position.y
          ) === Direction.DOWN
        ) {
          closestToPlayerGrounds.push(groundNodes[i])
        }
      }

      if (closestToPlayerGrounds.length === 0) return false

      // Check if the down ground is in contact with the player.
      const h1 =
        this.player.getComponent(BoxCollider2D).size.height / 2 +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.height / 2
      const w1 = closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const h2 = Math.abs(
        this.player.position.y +
          this.player.getComponent(BoxCollider2D).offset.y -
          closestToPlayerGrounds[0].ground.node.position.y
      )
      if (
        closestToPlayerGrounds[0].ground.canBeDug &&
        Math.hypot(h1, w1) >= closestToPlayerGrounds[0].distance &&
        h2 <= h1 + 2
      ) {
        if (this._groundHardinessTimer >= closestToPlayerGrounds[0].ground.hardiness) {
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          this._groundHardinessTimer = 0
        }
        return true
      }

      this._playerManager.idleLeft()
      return false
    }

    if (direction === Direction.LEFT) {
      // Get the 8 closest grounds to the player.
      for (let i = 0; i < 8; i += 1) {
        if (
          getVectorDirection(
            this.player.position.x,
            this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
            groundNodes[i].ground.node.position.x,
            groundNodes[i].ground.node.position.y
          ) === Direction.LEFT
        ) {
          closestToPlayerGrounds.push(groundNodes[i])
        }
      }

      if (closestToPlayerGrounds.length === 0) return false
      // Check if the left ground is in contact with the player.
      const w1 =
        this.player.getComponent(BoxCollider2D).size.width / 2 +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const w2 = Math.abs(this.player.position.x - closestToPlayerGrounds[0].ground.node.position.x)
      if (closestToPlayerGrounds[0].ground.canBeDug && w2 <= w1 + 1) {
        if (this._groundHardinessTimer >= closestToPlayerGrounds[0].ground.hardiness) {
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          this._groundHardinessTimer = 0
        }
        return true
      }

      this._playerManager.idleLeft()
      return false
    }

    if (direction === Direction.RIGHT) {
      // Get the 8 closest grounds to the player.
      for (let i = 0; i < 8; i += 1) {
        if (
          getVectorDirection(
            this.player.position.x,
            this.player.position.y + this.player.getComponent(BoxCollider2D).offset.y,
            groundNodes[i].ground.node.position.x,
            groundNodes[i].ground.node.position.y
          ) === Direction.RIGHT
        ) {
          closestToPlayerGrounds.push(groundNodes[i])
        }
      }

      if (closestToPlayerGrounds.length === 0) return false
      // Check if the right ground is in contact with the player.
      const w1 =
        this.player.getComponent(BoxCollider2D).size.width / 2 +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const w2 = Math.abs(this.player.position.x - closestToPlayerGrounds[0].ground.node.position.x)
      if (closestToPlayerGrounds[0].ground.canBeDug && w2 <= w1 + 1) {
        if (this._groundHardinessTimer >= closestToPlayerGrounds[0].ground.hardiness) {
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          this._groundHardinessTimer = 0
        }
        return true
      }

      this._playerManager.idleRight()
      return false
    }

    return false
  }
}
