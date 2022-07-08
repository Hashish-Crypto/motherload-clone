import { _decorator, Component, RigidBody2D, Animation, Vec2, Node } from 'cc'
import { GameSceneManager } from './GameSceneManager'
import Direction from './enums/Direction'

const { ccclass, property } = _decorator

@ccclass('PlayerManager')
export class PlayerManager extends Component {
  @property({ type: Node })
  public gameSceneManagerNode: Node | null = null

  public controllerActive: boolean = true
  public movementCommands: Direction[] = []
  public lastMovementCommand: Direction = Direction.NULL
  public movementTimerActive: boolean = false
  public movementTimer: number = 0
  public canDigTimerActive: boolean = false
  public canDigTimer: number = 0
  private _gameSceneManager: GameSceneManager | null = null
  private _velocity: number = 1.5
  private _body: RigidBody2D | null = null
  private _animation: Animation | null = null

  onLoad() {
    this._gameSceneManager = this.gameSceneManagerNode.getComponent(GameSceneManager)
    this._body = this.node.getComponent(RigidBody2D)
    this._animation = this.node.getComponent(Animation)
  }

  update(deltaTime: number) {
    // If the movement key is pressed, it maintains a continuous impulse.
    if (this.controllerActive && this.movementCommands.length >= 1 && this.movementTimerActive) {
      this.movementTimer += deltaTime
      if (this.movementTimer >= 0.1) {
        this.move()
        this.movementTimer = 0
      }
    }
  }

  public flyLeft() {
    if (this._body.linearVelocity.y < this._velocity * 4) {
      this._body.applyLinearImpulseToCenter(new Vec2(0, this._velocity * 2), true)
    }
    this._animation.play('flyLeft')
  }

  public flyRight() {
    if (this._body.linearVelocity.y < this._velocity * 4) {
      this._body.applyLinearImpulseToCenter(new Vec2(0, this._velocity * 2), true)
    }
    this._animation.play('flyRight')
  }

  public digDownLeft() {
    this._animation.play('digDownLeft')
  }

  public digDownRight() {
    this._animation.play('digDownRight')
  }

  public moveLeft() {
    console.log(this._body.linearVelocity.x)
    console.log(-this._velocity * 4)
    if (this._body.linearVelocity.x > -this._velocity * 4) {
      this._body.applyLinearImpulseToCenter(new Vec2(-this._velocity, 0), true)
    }
    this._animation.play('moveLeft')
  }

  public moveRight() {
    console.log(this._body.linearVelocity.x)
    if (this._body.linearVelocity.x < this._velocity * 4) {
      this._body.applyLinearImpulseToCenter(new Vec2(this._velocity, 0), true)
    }
    this._animation.play('moveRight')
  }

  public digLeft() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('digLeft')
  }

  public digRight() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('digRight')
  }

  public idleLeft() {
    this._animation.play('idleLeft')
  }

  public idleRight() {
    this._animation.play('idleRight')
  }

  public move() {
    if (this.movementCommands.length >= 1) {
      if (this.movementCommands[this.movementCommands.length - 1] === Direction.UP) {
        this.flyLeft()
        this.movementTimerActive = true
      } else if (this.movementCommands[this.movementCommands.length - 1] === Direction.RIGHT) {
        if (this._gameSceneManager.canDig(Direction.RIGHT)) {
          this.digRight()
          this.canDigTimerActive = true
        } else {
          this.moveRight()
        }
        this.movementTimerActive = true
      } else if (this.movementCommands[this.movementCommands.length - 1] === Direction.DOWN) {
        if (this._gameSceneManager.canDig(Direction.DOWN)) {
          this.digDownLeft()
          this.canDigTimerActive = true
        } else {
          this.idleLeft()
        }
        this.movementTimerActive = true
      } else if (this.movementCommands[this.movementCommands.length - 1] === Direction.LEFT) {
        if (this._gameSceneManager.canDig(Direction.LEFT)) {
          this.digLeft()
          this.canDigTimerActive = true
        } else {
          this.moveLeft()
        }
        this.movementTimerActive = true
      }
    }
  }
}
