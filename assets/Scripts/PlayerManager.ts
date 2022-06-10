import { _decorator, Component, RigidBody2D, Animation, Vec2 } from 'cc'

const { ccclass } = _decorator

@ccclass('PlayerManager')
export class PlayerManager extends Component {
  private _velocity: number = 5
  private _body: RigidBody2D | null = null
  private _animation: Animation | null = null

  onLoad() {
    this._body = this.node.getComponent(RigidBody2D)
    this._animation = this.node.getComponent(Animation)
  }

  // update(deltaTime: number) {}

  public flyLeft() {
    this._body.linearVelocity = new Vec2(0, this._velocity)
    this._animation.play('flyLeft')
  }

  public flyRight() {
    this._body.linearVelocity = new Vec2(0, this._velocity)
    this._animation.play('flyRight')
  }

  public digDownLeft() {
    this._body.linearVelocity = new Vec2(0, -this._velocity)
    this._animation.play('digDownLeft')
  }

  public digDownRight() {
    this._body.linearVelocity = new Vec2(0, -this._velocity)
    this._animation.play('digDownRight')
  }

  public moveLeft() {
    this._body.linearVelocity = new Vec2(-this._velocity, 0)
    this._animation.play('moveLeft')
  }

  public moveRight() {
    this._body.linearVelocity = new Vec2(this._velocity, 0)
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
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('idleLeft')
  }

  public idleRight() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('idleRight')
  }
}
