import type { Address, User } from "@/types";
import { apiFetch } from "@/lib/api";

export type AddressInput = Omit<Address, "id">;

export async function getProfile(): Promise<User> {
  return apiFetch<User>("/account/profile");
}

export async function updateProfile(data: {
  name?: string;
  cpf?: string;
  phone?: string;
}): Promise<User> {
  return apiFetch<User>("/account/profile", { method: "PUT", body: data });
}

export async function getAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>("/account/addresses");
}

export async function createAddress(data: AddressInput): Promise<Address> {
  return apiFetch<Address>("/account/addresses", { method: "POST", body: data });
}

export async function updateAddress(id: string, data: Partial<AddressInput>): Promise<Address> {
  return apiFetch<Address>(`/account/addresses/${id}`, { method: "PUT", body: data });
}

export async function deleteAddress(id: string): Promise<void> {
  return apiFetch<void>(`/account/addresses/${id}`, { method: "DELETE" });
}
