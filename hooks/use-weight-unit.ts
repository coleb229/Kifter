"use client";

import { useEffect, useState } from "react";
import type { WeightUnit } from "@/lib/weight";

const STORAGE_KEY = "kifted-weight-unit";

export function useWeightUnit() {
  const [unit, setUnitState] = useState<WeightUnit>("kg");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "kg" || stored === "lb") setUnitState(stored);
  }, []);

  function setUnit(next: WeightUnit) {
    setUnitState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggle() {
    setUnit(unit === "kg" ? "lb" : "kg");
  }

  return { unit, setUnit, toggle };
}
