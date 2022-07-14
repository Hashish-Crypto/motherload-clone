interface ICargoBayItem {
  name: string
  price: number
}

export default interface IAttributes {
  wallet: number
  movementSpeed: number
  drillSpeed: number
  radiator: number
  hullResistance: number
  currentHullResistance: number
  fuelTankCapacity: number
  currentFuelTankCapacity: number
  cargoBayCapacity: number
  currentCargoBayCapacity: number
  cargoBayItems: ICargoBayItem[]
}
