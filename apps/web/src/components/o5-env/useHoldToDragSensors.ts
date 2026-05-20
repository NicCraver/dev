import { KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

const HOLD_ACTIVATION = { delay: 280, tolerance: 6 } as const;

export function useHoldToDragSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: HOLD_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: HOLD_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
