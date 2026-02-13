import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { InsightsController } from "./insights.controller";
import { InsightsService } from "./insights.service";
import { Idea, IdeaSchema } from "../ideas/schemas/idea.schema";
import { User, UserSchema } from "../auth/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Idea.name, schema: IdeaSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
