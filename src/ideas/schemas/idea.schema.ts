import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type IdeaDocument = Idea & Document;

@Schema({ _id: false })
export class IdeaNode {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, enum: ["main", "sub", "related"] })
  type: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  // Content plan specific fields
  @Prop()
  platform?: string; // Instagram, TikTok, YouTube, LinkedIn, Twitter/X

  @Prop()
  format?: string; // Reel, Post, Story, Carousel, Video, Short, Thread, etc.

  @Prop()
  hook?: string; // Attention-grabbing opening line

  @Prop({ type: [String] })
  keyPoints?: string[]; // Array of key talking points

  @Prop({ type: [String] })
  hashtags?: string[]; // Array of relevant hashtags

  @Prop()
  postingTime?: string; // Suggested best time to post

  @Prop()
  engagementStrategy?: string; // How to encourage engagement

  @Prop()
  script?: string; // Optional script or outline for video content

  @Prop()
  caption?: string; // Optional caption text for the content

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

@Schema({ _id: false })
export class IdeaEdge {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  target: string;

  @Prop({ required: true, enum: ["hierarchical", "related", "suggested"] })
  type: string;

  @Prop()
  weight?: number;
}

@Schema({ timestamps: true })
export class Idea {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true })
  topic: string;

  @Prop({ type: [IdeaNode], required: true })
  nodes: IdeaNode[];

  @Prop({ type: [IdeaEdge], required: true })
  edges: IdeaEdge[];

  @Prop({ type: Object })
  metadata?: {
    generatedAt: string;
    version?: string;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

}

export const IdeaSchema = SchemaFactory.createForClass(Idea);
export const IdeaNodeSchema = SchemaFactory.createForClass(IdeaNode);
export const IdeaEdgeSchema = SchemaFactory.createForClass(IdeaEdge);
