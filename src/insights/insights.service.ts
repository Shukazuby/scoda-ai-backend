import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Idea, IdeaDocument } from "../ideas/schemas/idea.schema";
import { User, UserDocument } from "../auth/schemas/user.schema";

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async getStats(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const ideas = await this.ideaModel.find({
      userId: new Types.ObjectId(userId),
    });

    const totalIdeas = ideas.length;
    const totalNodes = ideas.reduce((sum, idea) => sum + idea.nodes.length, 0);
    const avgNodesPerIdea = totalIdeas > 0 ? totalNodes / totalIdeas : 0;

    // Get most used category
    const categoryCounts: Record<string, number> = {};
    ideas.forEach((idea) => {
      idea.nodes.forEach((node) => {
        if (node.category) {
          categoryCounts[node.category] =
            (categoryCounts[node.category] || 0) + 1;
        }
      });
    });

    const mostUsedCategory =
      Object.keys(categoryCounts).length > 0
        ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "None";

    // Ideas this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const ideasThisWeek = await this.ideaModel.countDocuments({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: oneWeekAgo },
    });

    return {
      totalIdeas,
      totalNodes,
      avgNodesPerIdea: Math.round(avgNodesPerIdea * 10) / 10,
      mostUsedCategory,
      ideasThisWeek,
      creditsUsed: 100 - (user.credits || 100),
    };
  }

  async getWeeklyActivity(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const ideas = await this.ideaModel.find({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: oneWeekAgo },
    });

    const activity: Record<string, number> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Initialize all days to 0
    days.forEach((day) => {
      activity[day] = 0;
    });

    ideas.forEach((idea) => {
      const day = days[new Date(idea.createdAt).getDay()];
      activity[day] = (activity[day] || 0) + 1;
    });

    return days.map((day) => ({
      day,
      ideas: activity[day] || 0,
    }));
  }

  async getCategoryDistribution(userId: string) {
    const ideas = await this.ideaModel.find({
      userId: new Types.ObjectId(userId),
    });

    const categoryCounts: Record<string, number> = {};
    let total = 0;

    ideas.forEach((idea) => {
      idea.nodes.forEach((node) => {
        if (node.category) {
          categoryCounts[node.category] =
            (categoryCounts[node.category] || 0) + 1;
          total++;
        }
      });
    });

    const distribution = Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categories

    return distribution;
  }

  async getMostActiveCategories(userId: string) {
    const ideas = await this.ideaModel.find({
      userId: new Types.ObjectId(userId),
    });

    const categoryCounts: Record<string, number> = {};

    ideas.forEach((idea) => {
      idea.nodes.forEach((node) => {
        if (node.category) {
          categoryCounts[node.category] =
            (categoryCounts[node.category] || 0) + 1;
        }
      });
    });

    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
