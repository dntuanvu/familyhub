import { Module } from "@nestjs/common";
import { StarBalanceController } from "./star-balance.controller";

@Module({ controllers: [StarBalanceController] })
export class StarBalanceModule {}
