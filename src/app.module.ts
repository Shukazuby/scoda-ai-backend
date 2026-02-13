import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { IdeasModule } from "./ideas/ideas.module";
import { InsightsModule } from "./insights/insights.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || "mongodb://localhost:27017/scoda-ai"),
    AuthModule,
    IdeasModule,
    InsightsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
