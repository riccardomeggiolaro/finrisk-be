/* eslint-disable prettier/prettier */
import { Reflector } from "@nestjs/core";

export const SetSchema = Reflector.createDecorator<{name: string}>();