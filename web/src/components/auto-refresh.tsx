"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraîchit en douceur les Server Components (router.refresh) à intervalle
 * régulier — sans recharger la page ni perdre la saisie en cours. Utilisé pour
 * refléter l'arrivée / l'état « prêt » des autres pirates d'un salon.
 */
export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
