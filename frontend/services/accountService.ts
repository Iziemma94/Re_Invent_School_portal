// Services keep API logic out of page files.
import api from "@/lib/axios";
import { CurrentUser } from "@/types";

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get("/accounts/me/");
  return response.data;
}