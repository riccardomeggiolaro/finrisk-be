/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from './user.interface';

export type UserDocument = HydratedDocument<User>;

@Schema({
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
})
export class User {
  id?: string;
  
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  company: string;

  @Prop({enum: Role})
  role?: Role;

  @Prop()
  abiCodeId?: string;

  @Prop()
  username: string;

  @Prop()
  hashedPassword?: string;

  @Prop()
  enabled?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});