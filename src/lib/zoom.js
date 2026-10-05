/** Zoom steps for the image viewer, in percent of the viewer width. */
export const ZOOM_STEPS = [25, 50, 75, 100, 150, 200];
export const DEFAULT_ZOOM = 100;

/**
 * @param {number} current a value from ZOOM_STEPS
 * @param {1 | -1} direction
 * @returns {number} the next step, or `current` at either end
 */
export function stepZoom(current, direction) {
  const index = ZOOM_STEPS.indexOf(current);
  const next = ZOOM_STEPS[(index === -1 ? ZOOM_STEPS.indexOf(DEFAULT_ZOOM) : index) + direction];
  return next ?? current;
}
