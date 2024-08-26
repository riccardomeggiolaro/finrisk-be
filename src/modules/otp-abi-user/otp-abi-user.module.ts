/* eslint-disable prettier/prettier */
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OtpAbiUserAbstractService } from './service/otp-abi-user.abstract.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpAbiUser, OtpAbiUserSchema } from './entity/otp-abi-user.schema';
import { UserModule } from '@modules/user';

@Module({})
export class OtpAbiUserModule {
    static forRoot(providers: Provider[], global = true): DynamicModule {
        return {
            global,
            module: UserModule,
            imports: [
                MongooseModule.forFeature([{name: OtpAbiUser.name, schema: OtpAbiUserSchema}])
            ],
            providers: [
                ...providers
            ],
            exports: [OtpAbiUserAbstractService]
        }
    }
}