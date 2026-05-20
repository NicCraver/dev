import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "o5-env-show-company";

function readShowCompany(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useO5ShowCompany() {
  const [showCompany, setShowCompanyState] = useState(readShowCompany);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, showCompany ? "1" : "0");
  }, [showCompany]);

  const setShowCompany = useCallback((next: boolean) => {
    setShowCompanyState(next);
  }, []);

  return { showCompany, setShowCompany };
}
