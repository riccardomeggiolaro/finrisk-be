/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { User } from "../entity/user.schema";
import { OptionsUser } from "../entity/user.interface";

@Injectable()
export abstract class UserAbstractService {
  abstract findByUsername(username: string, enabled?: boolean): Promise<User>;
  abstract findById(id: string): Promise<User>;
  abstract create(user: User): Promise<User>;
  abstract update(id: string, options: OptionsUser): Promise<User>;
  abstract counterUsers(): Promise<number>;
}