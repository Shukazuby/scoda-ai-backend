import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Idea, IdeaDocument } from "./schemas/idea.schema";
import { User, UserDocument } from "../auth/schemas/user.schema";
import { GenerateIdeasDto } from "./dto/generate-ideas.dto";
import { CreateIdeaDto } from "./dto/create-idea.dto";
import { LangChainService } from "./langchain.service";

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private langChainService: LangChainService
  ) {}

  async generateIdeas(userId: string, generateIdeasDto: GenerateIdeasDto) {
    const { topic } = generateIdeasDto;

    // Load user and enforce credits
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.credits <= 0) {
      throw new ForbiddenException("You have no credits left");
    }

    // Use LangChain to generate ideas
    const graph = await this.langChainService.generateIdeas(topic);

    // Deduct one credit
    user.credits = Math.max(0, (user.credits ?? 0) - 1);
    await user.save();

    return {
      graph,
      creditsUsed: 1,
      remainingCredits: user.credits,
    };
  }

  async create(userId: string, createIdeaDto: CreateIdeaDto) {
    const idea = new this.ideaModel({
      userId: new Types.ObjectId(userId),
      ...createIdeaDto,
    });

    await idea.save();
    return idea;
  }

  async findAll(userId: string) {
    return this.ideaModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async findOne(id: string, userId: string) {
    const idea = await this.ideaModel.findById(id);
    if (!idea) {
      throw new NotFoundException("Idea not found");
    }

    // Check if user owns this idea
    if (idea.userId.toString() !== userId) {
      throw new ForbiddenException("You don't have permission to access this idea");
    }

    return idea;
  }

  async update(id: string, userId: string, updateData: Partial<CreateIdeaDto>) {
    const idea = await this.ideaModel.findById(id);
    if (!idea) {
      throw new NotFoundException("Idea not found");
    }

    if (idea.userId.toString() !== userId) {
      throw new ForbiddenException("You don't have permission to update this idea");
    }

    Object.assign(idea, updateData);
    await idea.save();
    return idea;
  }

  async remove(id: string, userId: string) {
    const idea = await this.ideaModel.findById(id);
    if (!idea) {
      throw new NotFoundException("Idea not found");
    }

    if (idea.userId.toString() !== userId) {
      throw new ForbiddenException("You don't have permission to delete this idea");
    }

    await this.ideaModel.findByIdAndDelete(id);
    return { message: "Idea deleted successfully" };
  }

  // async refine(id: string, userId: string) {
  //   const idea = await this.findOne(id, userId);

  //   // Use LangChain to refine the idea
  //     const refinedIdeas = await this.langChainService.refineIdeas(
  //     idea.topic,
  //     idea.nodes.map(node => node.label).join("\n")
  //   );

  //   return refinedIdeas;
  // }
}
