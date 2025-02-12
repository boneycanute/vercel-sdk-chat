"use client";

import { updateChatVisibility } from "@/app/(chat)/actions";
import { useMemo } from "react";
import useSWR from "swr";

type VisibilityType = "public" | "private";

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    }
  );

  const visibilityType = useMemo(() => localVisibility, [localVisibility]);

  const setVisibilityType = async (visibility: VisibilityType) => {
    setLocalVisibility(visibility);
    await updateChatVisibility({ chatId, visibility });
  };

  return {
    visibilityType,
    setVisibilityType,
  };
}
