"use server";

export async function saveChatModelAsCookie(model: string) {
  // Since we're not using cookies anymore, this can be a no-op
  console.log("Chat model selected:", model);
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "public" | "private";
}) {
  // Since we're not persisting data, this can be a no-op
  console.log("Chat visibility updated:", { chatId, visibility });
}
