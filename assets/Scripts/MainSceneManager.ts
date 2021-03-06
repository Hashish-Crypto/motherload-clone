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
  PhysicsSystem2D,
  Contact2DType,
  Collider2D,
  RigidBody2D,
  instantiate,
  CircleCollider2D,
  Canvas,
  Camera,
  Label,
} from 'cc'
import { PlayerManager } from './PlayerManager'
import generateGroundGrid from './lib/generateGroundGrid'
import getDistanceBetweenPoints from './lib/getDistanceBetweenPoints'
import getVectorNarrowDirection from './lib/getVectorNarrowDirection'
import type IGround from './types/IGround'
import Direction from './enums/Direction'
import DamageType from './enums/DamageType'

const { ccclass, property } = _decorator

@ccclass('MainSceneManager')
export class MainSceneManager extends Component {
  @property({ type: Node })
  public groundRef: Node | null = null

  @property({ type: Prefab })
  public groundPrefab: Prefab | null = null

  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null

  @property({ type: Node })
  public canvasNode: Node | null = null

  @property({ type: Label })
  public fuelLabel: Label | null = null

  @property({ type: Label })
  public hullLabel: Label | null = null

  @property({ type: Label })
  public cashLabel: Label | null = null

  @property({ type: Label })
  public cargoBayLabel: Label | null = null

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

    const playerNode = instantiate(this.playerPrefab)
    this.canvasNode.addChild(playerNode)
    this._player = playerNode.getComponent(PlayerManager)
    this.canvasNode.getComponent(Canvas).cameraComponent = this._player.node
      .getChildByName('Camera')
      .getComponent(Camera)

    PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this)
  }

  update(deltaTime: number) {
    // Periodically check if there is a ground that can be dug.
    if (
      this._player.node.isValid &&
      this._player.controllerActive &&
      this._player.movementCommands.length >= 1 &&
      this._player.canDigTimerActive
    ) {
      this._player.canDigTimer += deltaTime
      this._groundHardinessTimer += deltaTime
      if (this._player.canDigTimer >= 0.2) {
        this._player.canDigTimer = 0
        if (this._player.lastMovementCommand === Direction.DOWN && this.canDig(Direction.DOWN)) {
          this._player.digDownLeft()
        } else if (this._player.lastMovementCommand === Direction.LEFT && this.canDig(Direction.LEFT)) {
          this._player.digLeft()
        } else if (this._player.lastMovementCommand === Direction.RIGHT && this.canDig(Direction.RIGHT)) {
          this._player.digRight()
        }
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
          this._groundHardinessTimer = 0
          this._player.movementTimerActive = false
          this._player.idleLeft()
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._player.movementCommands = this._player.movementCommands.filter(
          (direction) => direction !== Direction.RIGHT
        )
        if (this._player.movementCommands.length === 0) {
          this._groundHardinessTimer = 0
          this._player.movementTimerActive = false
          this._player.canDigTimerActive = false
          this._player.idleRight()
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._player.movementCommands = this._player.movementCommands.filter(
          (direction) => direction !== Direction.DOWN
        )
        if (this._player.movementCommands.length === 0) {
          this._groundHardinessTimer = 0
          this._player.movementTimerActive = false
          this._player.canDigTimerActive = false
          this._player.idleLeft()
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._player.movementCommands = this._player.movementCommands.filter(
          (direction) => direction !== Direction.LEFT
        )
        if (this._player.movementCommands.length === 0) {
          this._groundHardinessTimer = 0
          this._player.movementTimerActive = false
          this._player.canDigTimerActive = false
          this._player.idleLeft()
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

  private _onBeginContact(a: Collider2D, b: Collider2D) {
    // Check if velocity is to high, if so do damage.
    if (
      !this._player.fallDamageTimerActive &&
      a.node.name === 'Ground' &&
      b.node.name === 'Player' &&
      b.node.getComponent(RigidBody2D).linearVelocity.y <= -8
    ) {
      this._player.calculateDamage(DamageType.FALL, Math.abs(b.node.getComponent(RigidBody2D).linearVelocity.y) - 8)
      this._player.fallDamageTimerActive = true
    }
  }

  public canDig(direction: Direction): boolean {
    // Can't dig while it's falling.
    if (this._player.body.linearVelocity.y >= 0.1 || this._player.body.linearVelocity.y < -0.1) return false

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
              this._player.node.position.y + this._player.node.getComponent(CircleCollider2D).offset.y,
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
          getVectorNarrowDirection(
            this._player.node.position.x,
            this._player.node.position.y + this._player.node.getComponent(CircleCollider2D).offset.y,
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
        this._player.node.getComponent(CircleCollider2D).radius +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.height / 2
      const w1 = closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const h2 = Math.abs(
        this._player.node.position.y +
          this._player.node.getComponent(CircleCollider2D).offset.y -
          closestToPlayerGrounds[0].ground.node.position.y
      )
      if (
        closestToPlayerGrounds[0].ground.canBeDug &&
        Math.hypot(h1, w1) >= closestToPlayerGrounds[0].distance &&
        h2 <= h1 + 2
      ) {
        if (
          this._groundHardinessTimer >=
          closestToPlayerGrounds[0].ground.hardiness * this._player.attributes.drillSpeed
        ) {
          this._groundHardinessTimer = 0
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          if (closestToPlayerGrounds[0].ground.damage !== null) {
            if (closestToPlayerGrounds[0].ground.name === 'lava') {
              this._player.calculateDamage(DamageType.LAVA, closestToPlayerGrounds[0].ground.damage)
            } else {
              this._player.calculateDamage(DamageType.EXPLOSION, closestToPlayerGrounds[0].ground.damage)
            }
          }
          this._player.addItemToCargoBay(closestToPlayerGrounds[0].ground)
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
          getVectorNarrowDirection(
            this._player.node.position.x,
            this._player.node.position.y + this._player.node.getComponent(CircleCollider2D).offset.y,
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
        this._player.node.getComponent(CircleCollider2D).radius +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const w2 = Math.abs(this._player.node.position.x - closestToPlayerGrounds[0].ground.node.position.x)
      if (closestToPlayerGrounds[0].ground.canBeDug && w2 <= w1 + 1) {
        if (
          this._groundHardinessTimer >=
          closestToPlayerGrounds[0].ground.hardiness * this._player.attributes.drillSpeed
        ) {
          this._groundHardinessTimer = 0
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          if (closestToPlayerGrounds[0].ground.damage !== null) {
            if (closestToPlayerGrounds[0].ground.name === 'lava') {
              this._player.calculateDamage(DamageType.LAVA, closestToPlayerGrounds[0].ground.damage)
            } else {
              this._player.calculateDamage(DamageType.EXPLOSION, closestToPlayerGrounds[0].ground.damage)
            }
          }
          this._player.addItemToCargoBay(closestToPlayerGrounds[0].ground)
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
          getVectorNarrowDirection(
            this._player.node.position.x,
            this._player.node.position.y + this._player.node.getComponent(CircleCollider2D).offset.y,
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
        this._player.node.getComponent(CircleCollider2D).radius +
        closestToPlayerGrounds[0].ground.node.getComponent(UITransform).contentSize.width / 2
      const w2 = Math.abs(this._player.node.position.x - closestToPlayerGrounds[0].ground.node.position.x)
      if (closestToPlayerGrounds[0].ground.canBeDug && w2 <= w1 + 1) {
        if (
          this._groundHardinessTimer >=
          closestToPlayerGrounds[0].ground.hardiness * this._player.attributes.drillSpeed
        ) {
          this._groundHardinessTimer = 0
          closestToPlayerGrounds[0].ground.active = false
          closestToPlayerGrounds[0].ground.node.destroy()
          if (closestToPlayerGrounds[0].ground.damage !== null) {
            if (closestToPlayerGrounds[0].ground.name === 'lava') {
              this._player.calculateDamage(DamageType.LAVA, closestToPlayerGrounds[0].ground.damage)
            } else {
              this._player.calculateDamage(DamageType.EXPLOSION, closestToPlayerGrounds[0].ground.damage)
            }
          }
          this._player.addItemToCargoBay(closestToPlayerGrounds[0].ground)
        }
        return true
      }

      this._player.idleRight()
      return false
    }

    return false
  }

  public gameOver() {
    this._player.controllerActive = false
    this._player.respawn()
    // this._player.node.destroy()
    // const playerNode = instantiate(this.playerPrefab)
    // this.canvasNode.addChild(playerNode)
    // this._player = playerNode.getComponent(PlayerManager)
  }
}
