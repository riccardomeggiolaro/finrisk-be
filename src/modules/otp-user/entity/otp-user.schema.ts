/* eslint-disable prettier/prettier */
import { User } from '@modules/user';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OtpUserDocument = HydratedDocument<OtpUser>;

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
export class OtpUser {
  id?: string;
  
  @Prop()
  otpCode: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;
}

export const OtpUserSchema = SchemaFactory.createForClass(OtpUser);

OtpUserSchema.pre('findOne', function (next) {
    this.populate('user');
    next();
});

OtpUserSchema.pre('findOneAndDelete', function (next) {
  this.populate('user');
  next();
});