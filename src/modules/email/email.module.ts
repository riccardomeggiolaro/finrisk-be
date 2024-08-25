/* eslint-disable prettier/prettier */
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { EmailAbstractService } from './service/email.abstract.service';

@Module({})
export class EmailModule {
    static forRoot(providers: Provider[], global = true): DynamicModule {
        return {
            global,
            module: EmailModule,
            imports: [],
            providers: [
                ...providers,
            ],
            exports: [EmailAbstractService]
        }
    }
}