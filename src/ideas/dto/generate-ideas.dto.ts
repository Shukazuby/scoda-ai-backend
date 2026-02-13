import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GenerateIdeasDto {
  @ApiProperty({
    description: "Topic or theme for idea generation",
    example: "Mindful productivity",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, {
    message: "Topic is too long. Maximum length is 200 characters.",
  })
  topic: string;
}
