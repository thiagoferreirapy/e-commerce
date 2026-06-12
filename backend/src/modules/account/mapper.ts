import { Prisma } from "@prisma/client";
import type { AddressDTO, UserDTO } from "../../types";

export const userInclude = {
  addresses: { orderBy: { isDefault: "desc" } },
} satisfies Prisma.UserInclude;

export type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toAddressDTO(a: UserWithRelations["addresses"][number]): AddressDTO {
  return {
    id: a.id,
    label: a.label,
    recipient: a.recipient,
    cep: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement ?? undefined,
    district: a.district,
    city: a.city,
    state: a.state,
    isDefault: a.isDefault,
  };
}

export function toUserDTO(u: UserWithRelations): UserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    cpf: u.cpf ?? undefined,
    phone: u.phone ?? undefined,
    addresses: u.addresses.map(toAddressDTO),
  };
}
