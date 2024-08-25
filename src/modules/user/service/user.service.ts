/* eslint-disable prettier/prettier */
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../entity/user.schema';
import { Model } from 'mongoose';
import { UserAbstractService } from './user.abstract.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService extends UserAbstractService {
    
  constructor(@InjectModel(User.name) private userSchema: Model<User>) {
    super();
  }

  async findByUsername(username: string, enabled?: boolean): Promise<User> {
    const q: object = {
      username
    }
    if (enabled) q["enabled"] = enabled;
    const user = await this.userSchema.findOne(q);
    return user ? user.toObject() : null;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userSchema.findById(id);
    return user ? user.toObject() : null;
  }

  async create(user: User): Promise<User> {
    return (await this.userSchema.create(user)).toObject();
  }

  async enableUserAndAddAbiCode(id: string, enabled: boolean, abiCodeId: string): Promise<User> {
    return (await this.userSchema.findByIdAndUpdate(id, {enabled, abiCodeId}, {new: true})).toObject()  
  }

  async counterUsers(): Promise<number> {
    return await this.userSchema.countDocuments({enabled: true});
  }
}