import { Module } from "@nestjs/common";
import { TaskCompletionsController } from "./task-completions.controller";

@Module({ controllers: [TaskCompletionsController] })
export class TaskCompletionsModule {}
