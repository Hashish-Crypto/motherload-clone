import { _decorator, Component, RigidBody2D, Animation, Vec2, Label } from 'cc'
import { MainSceneManager } from './MainSceneManager'
import Direction from './enums/Direction'
import IAttributes from './types/IAttributes'
import BaseAttributes from './consts/BaseAttributes'
import DamageType from './enums/DamageType'

const { ccclass } = _decorator

@ccclass('PlayerManager')
export class PlayerManager extends Component {
  public controllerActive: boolean = true
  public movementCommands: Direction[] = []
  public lastMovementCommand: Direction = Direction.NULL
  public movementTimerActive: boolean = false
  public canDigTimerActive: boolean = false
  public canDigTimer: number = 0
  public body: RigidBody2D | null = null
  public fallDamageTimerActive: boolean = false
  public attributes: IAttributes = {
    wallet: BaseAttributes.wallet,
    movementSpeed: BaseAttributes.movementSpeed,
    drillSpeed: BaseAttributes.drillSpeed,
    radiator: BaseAttributes.radiator,
    hullResistance: BaseAttributes.hullResistance,
    currentHullResistance: BaseAttributes.hullResistance,
    fuelTankCapacity: BaseAttributes.fuelTankCapacity,
    currentFuelTankCapacity: BaseAttributes.fuelTankCapacity,
    cargoBayCapacity: BaseAttributes.cargoBayCapacity,
    cargoBayItems: [],
    currentCargoBayCapacity: BaseAttributes.cargoBayCapacity,
  }

  private _mainScene: MainSceneManager | null = null
  private _animation: Animation | null = null
  private _movementTimer: number = 0
  private _fuelTimer: number = 0
  private _fallDamageTimer: number = 0

  onLoad() {
    this._mainScene = this.node
      .getParent()
      .getParent()
      .getChildByName('MainSceneManager')
      .getComponent(MainSceneManager)
    this.body = this.node.getComponent(RigidBody2D)
    this._animation = this.node.getComponent(Animation)
  }

  update(deltaTime: number) {
    // If the movement key is pressed, it maintains a continuous impulse.
    if (this.controllerActive && this.movementCommands.length >= 1 && this.movementTimerActive) {
      this._movementTimer += deltaTime
      if (this._movementTimer >= 0.1) {
        this._movementTimer = 0
        this.move()
      }
    }

    // Consumes fuel when performing actions.
    if (this.controllerActive && this.movementCommands.length >= 1) {
      this._fuelTimer += deltaTime
      if (this._fuelTimer >= 1) {
        this._fuelTimer = 0
        // this._setFuel((this.attributes.currentFuelTankCapacity -= 0.25))
        // Fuel consumes fast for testing:
        this._setFuel((this.attributes.currentFuelTankCapacity -= 1))
      }
    }

    // Insures fall damage only every 0.1 seconds.
    if (this.fallDamageTimerActive) {
      this._fallDamageTimer += deltaTime
      if (this._fallDamageTimer >= 0.1) {
        this._fallDamageTimer = 0
        this.fallDamageTimerActive = false
      }
    }
  }

  public flyLeft() {
    if (this.body.linearVelocity.y < this.attributes.movementSpeed * 4) {
      this.body.applyLinearImpulseToCenter(new Vec2(0, this.attributes.movementSpeed * 2), true)
    }
    this._animation.play('flyLeft')
  }

  public flyRight() {
    if (this.body.linearVelocity.y < this.attributes.movementSpeed * 4) {
      this.body.applyLinearImpulseToCenter(new Vec2(0, this.attributes.movementSpeed * 2), true)
    }
    this._animation.play('flyRight')
  }

  public digDownLeft() {
    this.body.linearVelocity = new Vec2(0, 0)
    this._animation.play('digDownLeft')
  }

  public digDownRight() {
    this.body.linearVelocity = new Vec2(0, 0)
    this._animation.play('digDownRight')
  }

  public moveLeft() {
    if (this.body.linearVelocity.x > -this.attributes.movementSpeed * 4) {
      this.body.applyLinearImpulseToCenter(new Vec2(-this.attributes.movementSpeed, 0), true)
    }
    this._animation.play('moveLeft')
  }

  public moveRight() {
    if (this.body.linearVelocity.x < this.attributes.movementSpeed * 4) {
      this.body.applyLinearImpulseToCenter(new Vec2(this.attributes.movementSpeed, 0), true)
    }
    this._animation.play('moveRight')
  }

  public digLeft() {
    this.body.linearVelocity = new Vec2(0, 0)
    this._animation.play('digLeft')
  }

  public digRight() {
    this.body.linearVelocity = new Vec2(0, 0)
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
        if (this._mainScene.canDig(Direction.RIGHT)) {
          this.digRight()
          this.canDigTimerActive = true
        } else {
          this.moveRight()
        }
        this.movementTimerActive = true
      } else if (this.movementCommands[this.movementCommands.length - 1] === Direction.DOWN) {
        if (this._mainScene.canDig(Direction.DOWN)) {
          this.digDownLeft()
          this.canDigTimerActive = true
        } else {
          this.idleLeft()
        }
        this.movementTimerActive = true
      } else if (this.movementCommands[this.movementCommands.length - 1] === Direction.LEFT) {
        if (this._mainScene.canDig(Direction.LEFT)) {
          this.digLeft()
          this.canDigTimerActive = true
        } else {
          this.moveLeft()
        }
        this.movementTimerActive = true
      }
    }
  }

  public respawn() {
    console.log(this.node.position)
    this.controllerActive = false
    this.movementCommands = []
    this.lastMovementCommand = Direction.NULL
    this.movementTimerActive = false
    this.canDigTimerActive = false
    this.canDigTimer = 0
    this.fallDamageTimerActive = false
    this._movementTimer = 0
    this._fuelTimer = 0
    this._fallDamageTimer = 0
    this.attributes.currentHullResistance = this.attributes.hullResistance
    this.attributes.currentFuelTankCapacity = this.attributes.fuelTankCapacity
    this.attributes.cargoBayItems = []
    this.attributes.currentCargoBayCapacity = this.attributes.cargoBayCapacity
    this.controllerActive = true
    this.node.setPosition(0, 0)
    console.log('Respawn.')
    console.log(this.node.position)
  }

  private _setFuel(value: number) {
    this.attributes.currentFuelTankCapacity = value
    if (this.attributes.currentFuelTankCapacity <= 0) {
      this._mainScene.gameOver()
    }
    this._mainScene.node
      .getParent()
      .getChildByName('GameUI')
      .getChildByName('FuelLabel')
      .getChildByName('Label')
      .getComponent(Label).string =
      'Fuel: ' + Math.ceil(this.attributes.currentFuelTankCapacity) + '/' + this.attributes.fuelTankCapacity
  }

  public calculateDamage(type: DamageType, damage: number) {
    if (type === DamageType.FALL || type === DamageType.EXPLOSION) {
      this.attributes.currentHullResistance -= damage
    } else if (type === DamageType.LAVA) {
      this.attributes.currentHullResistance -= damage * this.attributes.radiator
    }
    if (this.attributes.currentHullResistance <= 0) {
      this._mainScene.gameOver()
    }
  }
}
