/* eslint-disable prettier/prettier */
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../entity/user.schema';
import { Model } from 'mongoose';
import { UserAbstractService } from './user.abstract.service';
import { Injectable } from '@nestjs/common';
import { OptionsUser } from '../entity/user.interface';

@Injectable()
export class UserService extends UserAbstractService {
    
  constructor(@InjectModel(User.name) private userSchema: Model<User>) {
    super();
  }

  async findByUsername(username: string, folderParent?: string): Promise<User> {
    const q: object = {
      username
    }
    if (folderParent) q["folderParent"] = folderParent;
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

  async update(id: string, options: OptionsUser): Promise<User> {
    return (await this.userSchema.findByIdAndUpdate(id, options, {new: true})).toObject()  
  }

  async counterUsers(): Promise<number> {
    return await this.userSchema.countDocuments({enabled: true});
  }
}