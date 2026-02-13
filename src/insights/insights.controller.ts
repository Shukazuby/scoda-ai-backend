import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { InsightsService } from "./insights.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("insights")
@Controller("insights")
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @UseGuards(JwtAuthGuard)
  @Get("stats")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get user statistics",
    description: "Returns comprehensive statistics about user's idea generation activity",
  })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
    schema: {
      example: {
        totalIdeas: 24,
        totalNodes: 156,
        avgNodesPerIdea: 6.5,
        mostUsedCategory: "Productivity",
        ideasThisWeek: 8,
        creditsUsed: 24,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStats(@Request() req) {
    return this.insightsService.getStats(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("activity")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get weekly activity",
    description: "Returns daily idea generation count for the past week",
  })
  @ApiResponse({
    status: 200,
    description: "Weekly activity retrieved successfully",
    schema: {
      example: [
        { day: "Mon", ideas: 3 },
        { day: "Tue", ideas: 5 },
        { day: "Wed", ideas: 2 },
        { day: "Thu", ideas: 4 },
        { day: "Fri", ideas: 6 },
        { day: "Sat", ideas: 3 },
        { day: "Sun", ideas: 1 },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getWeeklyActivity(@Request() req) {
    return this.insightsService.getWeeklyActivity(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("categories")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get category distribution",
    description: "Returns percentage distribution of ideas by category",
  })
  @ApiResponse({
    status: 200,
    description: "Category distribution retrieved successfully",
    schema: {
      example: [
        { name: "Productivity", value: 35, count: 42 },
        { name: "Wellness", value: 28, count: 34 },
        { name: "Lifestyle", value: 22, count: 26 },
        { name: "Technology", value: 15, count: 18 },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCategoryDistribution(@Request() req) {
    return this.insightsService.getCategoryDistribution(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("most-active")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get most active categories",
    description: "Returns top categories by idea count",
  })
  @ApiResponse({
    status: 200,
    description: "Most active categories retrieved successfully",
    schema: {
      example: [
        { name: "Productivity", count: 12 },
        { name: "Wellness", count: 8 },
        { name: "Lifestyle", count: 6 },
        { name: "Technology", count: 4 },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getMostActiveCategories(@Request() req) {
    return this.insightsService.getMostActiveCategories(req.user._id);
  }
}
