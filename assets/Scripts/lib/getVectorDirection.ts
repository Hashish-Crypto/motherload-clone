import { Vec2 } from 'cc'
import Direction from '../enums/Direction'

const getVectorDirection = (xA: number, yA: number, xB: number, yB: number) => {
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

export default getVectorDirection
