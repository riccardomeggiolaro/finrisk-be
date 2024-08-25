/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { User } from "../entity/user.schema";

@Injectable()
export abstract class UserAbstractService {
  abstract findByUsername(username: string, enabled?: boolean): Promise<User>;
  abstract findById(id: string): Promise<User>;
  abstract create(user: User): Promise<User>;
  abstract enableUserAndAddAbiCode(id: string, enabled: boolean, abiCodeId: string): Promise<User>;
  abstract counterUsers(): Promise<number>;
}