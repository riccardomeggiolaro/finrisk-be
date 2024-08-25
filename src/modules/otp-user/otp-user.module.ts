/* eslint-disable prettier/prettier */
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OtpUserAbstractService } from './service/otp-user.abstract.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpUser, OtpUserSchema } from './entity/otp-user.schema';
import { UserModule } from '@modules/user';

@Module({})
export class OtpUserModule {
    static forRoot(providers: Provider[], global = true): DynamicModule {
        return {
            global,
            module: UserModule,
            imports: [
                MongooseModule.forFeature([{name: OtpUser.name, schema: OtpUserSchema}])
            ],
            providers: [
                ...providers
            ],
            exports: [OtpUserAbstractService]
        }
    }
}