/** Keep the camera still inside the middle 60% of the visible map. */
export function needsCameraFollow(x: number, y: number, width: number, height: number): boolean {
  return x < width * .2 || x > width * .8 || y < height * .2 || y > height * .8;
}
