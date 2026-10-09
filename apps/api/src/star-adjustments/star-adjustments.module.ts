import { Module } from "@nestjs/common";
import { StarAdjustmentsController } from "./star-adjustments.controller";

@Module({ controllers: [StarAdjustmentsController] })
export class StarAdjustmentsModule {}
