import {
  _decorator,
  Component,
  Node,
  Prefab,
  UITransform,
  EventKeyboard,
  input,
  Input,
  KeyCode,
  BoxCollider2D,
  // PhysicsSystem2D,
  // Contact2DType,
  // Collider2D,
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
  public playerNode: Node | null = null

  private _groundGrid: IGround[][] = []
  private _groundGridWidth: number = 50
  private _groundGridHeight: number = 100
  private _groundHardinessTimer: number = 0
  private _player: PlayerManager | null = null

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
    this._player = this.playerNode.getComponent(PlayerManager)

    // PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this)
  }

  update(deltaTime: number) {
    // Periodically check if there is a ground that can be dug.
    if (this._player.controllerActive && this._player.movementCommands.length >= 1 && this._player.canDigTimerActive) {
      this._player.canDigTimer += deltaTime
      this._groundHardinessTimer += deltaTime
      if (this._player.canDigTimer >= 0.2) {
        if (this._player.lastMovementCommand === Direction.DOWN && this.canDig(Direction.DOWN)) {
          this._player.digDownLeft()
        } else if (this._player.lastMovementCommand === Direction.LEFT && this.canDig(Direction.LEFT)) {
          this._player.digLeft()
        } else if (this._player.lastMovementCommand === Direction.RIGHT && this.canDig(Direction.RIGHT)) {
          this._player.digRight()
        }
        this._player.canDigTimer = 0
      }
    }
  }

  private _onKeyDown(event: EventKeyboard) {
    if (this._player.controllerActive) {
      if (event.keyCode === KeyCode.KEY_W && !this._player.movementCommands.includes(Direction.UP)) {
        this._player.lastMovementCommand = Direction.UP
        this._player.movementCommands.push(Direction.UP)
        this._player.move()
      } else if (event.keyCode === KeyCode.KEY_D && !this._player.movementCommands.includes(Direction.RIGHT)) {
        this._player.lastMovementCommand = Direction.RIGHT
        this._player.movementCommands.push(Direction.RIGHT)
        this._player.move()
      } else if (event.keyCode === KeyCode.KEY_S && !this._player.movementCommands.includes(Direction.DOWN)) {
        this._player.lastMovementCommand = Direction.DOWN
        this._player.movementCommands.push(Direction.DOWN)
        this._player.move()
      } else if (event.keyCode === KeyCode.KEY_A && !this._player.movementCommands.includes(Direction.LEFT)) {
        this._player.lastMovementCommand = Direction.LEFT
        this._player.movementCommands.push(Direction.LEFT)
        this._player.move()
      }
    }
  }

  private _onKeyUp(event: EventKeyboard) {
    if (this._player.controllerActive) {
      if (event.keyCode === KeyCode.KEY_W) {
        this._player.movementCommands = this._player.movementCommands.filter((direction) => direction !== Direction.UP)
        if (this._player.movementCommands.length === 0) {
          this._player.idleLeft()
          this._player.movementTimerActive = false
          this._groundHardinessTimer = 0
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._player.movementCommands = this._player.movementCommands.filter(
          (direction) => direction !== Direction.RIGHT
        )
        if (this._player.movementCommands.length === 0) {
          this._player.idleRight()
          this._player.movementTimerActive = false
          this._player.canDigTimerActive = false
          this._groundHardinessTimer = 0
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._player.movementCommands = this._player.movementCommands.filter(
          (direction) => direction !== Direction.DOWN
        )
        if (this._player.movementCommands.length === 0) {
          this._player.idleLeft()
          this._player.movementTimerActive = false
          this._player.canDigTimerActive = false
          this._groundHardinessTimer = 0
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._player.movementCommands = this._player.movementCommands.filter(
          (direction) => direction !== Direction.LEFT
        )
        if (this._player.movementCommands.length === 0) {
          this._player.idleLeft()
          this._player.movementTimerActive = false
          this._player.canDigTimerActive = false
          this._groundHardinessTimer = 0
        }
      }

      // If there is still a key pressed, it triggers the player movement.
      if (
        this._player.lastMovementCommand !== this._player.movementCommands[this._player.movementCommands.length - 1]
      ) {
        this._player.move()
      }
    }
  }

  // private _onBeginContact(a: Collider2D, b: Collider2D) {
  // TODO: Check if velocity is to high, if so do damage.
  // }

  public canDig(direction: Direction): boolean {
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
              this._player.node.position.x,
              this._player.node.position.y + this._player.node.getComponent(BoxCollider2D).offset.y,
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
            this._player.node.position.x,
            this._player.node.position.y + this._player.node.getComponent(BoxCollider2D).offset.y,
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
        this._player.node.getComponent(BoxCollider2D).size.height / 2 +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.height / 2
      const w1 = closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const h2 = Math.abs(
        this._player.node.position.y +
          this._player.node.getComponent(BoxCollider2D).offset.y -
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

      this._player.idleLeft()
      return false
    }

    if (direction === Direction.LEFT) {
      // Get the 8 closest grounds to the player.
      for (let i = 0; i < 8; i += 1) {
        if (
          getVectorDirection(
            this._player.node.position.x,
            this._player.node.position.y + this._player.node.getComponent(BoxCollider2D).offset.y,
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
        this._player.node.getComponent(BoxCollider2D).size.width / 2 +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const w2 = Math.abs(this._player.node.position.x - closestToPlayerGrounds[0].ground.node.position.x)
      if (closestToPlayerGrounds[0].ground.canBeDug && w2 <= w1 + 1) {
        if (this._groundHardinessTimer >= closestToPlayerGrounds[0].ground.hardiness) {
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          this._groundHardinessTimer = 0
        }
        return true
      }

      this._player.idleLeft()
      return false
    }

    if (direction === Direction.RIGHT) {
      // Get the 8 closest grounds to the player.
      for (let i = 0; i < 8; i += 1) {
        if (
          getVectorDirection(
            this._player.node.position.x,
            this._player.node.position.y + this._player.node.getComponent(BoxCollider2D).offset.y,
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
        this._player.node.getComponent(BoxCollider2D).size.width / 2 +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const w2 = Math.abs(this._player.node.position.x - closestToPlayerGrounds[0].ground.node.position.x)
      if (closestToPlayerGrounds[0].ground.canBeDug && w2 <= w1 + 1) {
        if (this._groundHardinessTimer >= closestToPlayerGrounds[0].ground.hardiness) {
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          this._groundHardinessTimer = 0
        }
        return true
      }

      this._player.idleRight()
      return false
    }

    return false
  }
}
