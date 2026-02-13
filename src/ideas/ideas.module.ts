import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdeasController } from "./ideas.controller";
import { IdeasService } from "./ideas.service";
import { LangChainService } from "./langchain.service";
import { Idea, IdeaSchema } from "./schemas/idea.schema";
import { User, UserSchema } from "../auth/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Idea.name, schema: IdeaSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [IdeasController],
  providers: [IdeasService, LangChainService],
  exports: [IdeasService],
})
export class IdeasModule {}
