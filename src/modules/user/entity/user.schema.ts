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
  company: string;

  @Prop({enum: Role})
  role?: Role;

  @Prop()
  abiCodeId?: string;

  @Prop()
  username: string;

  @Prop()
  hashedPassword?: string;

  @Prop({ default: false })
  enabled?: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create a TTL index that expires documents after 5 minutes if enabled is false
UserSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 300, // 5 minutes
  partialFilterExpression: { enabled: false } 
});