import { Vec2 } from 'cc'
import Direction from '../enums/Direction'

const getVectorDirection = (xA: number, yA: number, xB: number, yB: number) => {
  const vector = new Vec2(xB - xA, yB - yA).normalize()
  const cos = Math.cos(Math.PI / 8)
  if (vector.x < cos && vector.x > -cos && vector.y >= cos) {
    return Direction.UP
  }
  if (vector.x >= cos && vector.y < cos && vector.y > -cos) {
    return Direction.RIGHT
  }
  if (vector.x < cos && vector.x > -cos && vector.y <= -cos) {
    return Direction.DOWN
  }
  if (vector.x <= -cos && vector.y < cos && vector.y > -cos) {
    return Direction.LEFT
  }

  return undefined
}

export default getVectorDirection
