/* eslint-disable prettier/prettier */
import { User } from '@modules/user';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { HydratedDocument, Types } from 'mongoose';

export type OtpAbiUserDocument = HydratedDocument<OtpAbiUser>;

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
export class OtpAbiUser {
  id?: string;

  @Prop({
    type: String,
    default: () => {
      return randomBytes(32).toString('hex');
    },
    unique: true
  })
  publicKey: string;
  
  @Prop({
    type: Number,
    default: () => {
        const buffer = randomBytes(3);
        const code = parseInt(buffer.toString('hex'), 16) % 900000 + 100000;
        return code;
    },
    unique: true
  })
  otpCode: number;

  @Prop()
  abiCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: Date, default: Date.now, expires: 120 }) // 300 seconds = 5 minutes
  createdAt: Date;
}

export const OtpAbiUserSchema = SchemaFactory.createForClass(OtpAbiUser);

OtpAbiUserSchema.pre('findOne', function (next) {
    this.populate('user');
    next();
});

OtpAbiUserSchema.pre('findOneAndDelete', function (next) {
  this.populate('user');
  next();
});

OtpAbiUserSchema.pre('findOneAndUpdate', function (next) {
  this.populate('user');
  next();
});