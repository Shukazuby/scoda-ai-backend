import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsIn,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class IdeaNodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ enum: ["main", "sub", "related"] })
  @IsString()
  @IsIn(["main", "sub", "related"])
  type: "main" | "sub" | "related";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  // Content plan specific fields
  @ApiProperty({ required: false, description: "Social media platform" })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ required: false, description: "Content format" })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiProperty({ required: false, description: "Attention-grabbing hook" })
  @IsOptional()
  @IsString()
  hook?: string;

  @ApiProperty({ required: false, type: [String], description: "Key talking points" })
  @IsOptional()
  @IsArray()
  keyPoints?: string[];

  @ApiProperty({ required: false, type: [String], description: "Relevant hashtags" })
  @IsOptional()
  @IsArray()
  hashtags?: string[];

  @ApiProperty({ required: false, description: "Suggested posting time" })
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiProperty({ required: false, description: "Engagement strategy" })
  @IsOptional()
  @IsString()
  engagementStrategy?: string;

  @ApiProperty({ required: false, description: "Optional script or outline for video content" })
  @IsOptional()
  @IsString()
  script?: string;

  @ApiProperty({ required: false, description: "Optional caption text for the content" })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

class IdeaEdgeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ enum: ["hierarchical", "related", "suggested"] })
  @IsString()
  @IsIn(["hierarchical", "related", "suggested"])
  type: "hierarchical" | "related" | "suggested";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class CreateIdeaDto {
  @ApiProperty({
    description: "Topic or theme of the idea",
    example: "Mindful productivity",
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: "Array of idea nodes",
    type: [IdeaNodeDto],
    example: [
      {
        id: "node-1",
        label: "Deep Work Sessions",
        type: "main",
        description: "Structured time blocks for focused work",
        category: "Productivity",
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdeaNodeDto)
  nodes: IdeaNodeDto[];

  @ApiProperty({
    description: "Array of edges connecting nodes",
    type: [IdeaEdgeDto],
    example: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "hierarchical",
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdeaEdgeDto)
  edges: IdeaEdgeDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: {
    generatedAt: string;
    version?: string;
  };
}
