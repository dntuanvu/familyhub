import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { FamiliesModule } from "./families/families.module";
import { MembersModule } from "./members/members.module";
import { TasksModule } from "./tasks/tasks.module";
import { TaskCompletionsModule } from "./task-completions/task-completions.module";
import { RewardsModule } from "./rewards/rewards.module";
import { RedemptionsModule } from "./redemptions/redemptions.module";
import { StarAdjustmentsModule } from "./star-adjustments/star-adjustments.module";
import { EventsModule } from "./events/events.module";
import { StarBalanceModule } from "./star-balance/star-balance.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    FamiliesModule,
    MembersModule,
    TasksModule,
    TaskCompletionsModule,
    RewardsModule,
    RedemptionsModule,
    StarAdjustmentsModule,
    EventsModule,
    StarBalanceModule,
  ],
})
export class AppModule {}
