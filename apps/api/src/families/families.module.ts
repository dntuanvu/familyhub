import { Module } from "@nestjs/common";
import { FamiliesController } from "./families.controller";

@Module({ controllers: [FamiliesController] })
export class FamiliesModule {}
