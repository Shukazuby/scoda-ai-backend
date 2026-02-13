import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { IdeasService } from "./ideas.service";
import { GenerateIdeasDto } from "./dto/generate-ideas.dto";
import { CreateIdeaDto } from "./dto/create-idea.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("ideas")
@Controller()
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @UseGuards(JwtAuthGuard)
  @Post("generate-ideas")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Generate ideas from a topic using AI",
    description:
      "Uses LangChain and OpenAI to generate structured idea graphs from a topic input.",
  })
  @ApiResponse({
    status: 201,
    description: "Ideas generated successfully",
    schema: {
      example: {
        graph: {
          nodes: [
            {
              id: "node-1",
              label: "Deep Work Sessions",
              type: "main",
              description: "Structured time blocks for focused work",
              category: "Productivity",
            },
          ],
          edges: [
            {
              id: "edge-1",
              source: "node-1",
              target: "node-2",
              type: "hierarchical",
            },
          ],
          metadata: {
            topic: "Mindful productivity",
            generatedAt: "2024-01-01T00:00:00.000Z",
            version: "1.0",
          },
        },
        creditsUsed: 1,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async generateIdeas(@Request() req, @Body() generateIdeasDto: GenerateIdeasDto) {
    const result = await this.ideasService.generateIdeas(
      req.user._id,
      generateIdeasDto
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post("ideas")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Save an idea graph" })
  @ApiResponse({
    status: 201,
    description: "Idea saved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Request() req, @Body() createIdeaDto: CreateIdeaDto) {
    return this.ideasService.create(req.user._id, createIdeaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("ideas")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all user's saved ideas" })
  @ApiResponse({
    status: 200,
    description: "List of ideas retrieved successfully",
    schema: {
      example: [
        {
          id: "507f1f77bcf86cd799439011",
          topic: "Mindful productivity",
          graph: {
            nodes: [],
            edges: [],
          },
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Request() req) {
    const ideas = await this.ideasService.findAll(req.user._id);
    return ideas.map((idea) => ({
      id: idea._id,
      topic: idea.topic,
      graph: {
        nodes: idea.nodes,
        edges: idea.edges,
      },
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get("ideas/:id")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get a specific idea by ID" })
  @ApiParam({ name: "id", description: "Idea ID" })
  @ApiResponse({
    status: 200,
    description: "Idea retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Not your idea" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  async findOne(@Param("id") id: string, @Request() req) {
    const idea = await this.ideasService.findOne(id, req.user._id);
    return {
      id: idea._id,
      topic: idea.topic,
      graph: {
        nodes: idea.nodes,
        edges: idea.edges,
      },
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put("ideas/:id")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update an existing idea" })
  @ApiParam({ name: "id", description: "Idea ID" })
  @ApiResponse({
    status: 200,
    description: "Idea updated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Not your idea" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  async update(
    @Param("id") id: string,
    @Request() req,
    @Body() updateData: Partial<CreateIdeaDto>
  ) {
    const idea = await this.ideasService.update(id, req.user._id, updateData);
    return {
      id: idea._id,
      topic: idea.topic,
      graph: {
        nodes: idea.nodes,
        edges: idea.edges,
      },
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("ideas/:id")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete an idea" })
  @ApiParam({ name: "id", description: "Idea ID" })
  @ApiResponse({
    status: 200,
    description: "Idea deleted successfully",
    schema: {
      example: {
        message: "Idea deleted successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Not your idea" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  async remove(@Param("id") id: string, @Request() req) {
    // Ensure we pass a plain string userId for correct comparison
    return this.ideasService.remove(id, req.user._id.toString());
  }

  // @UseGuards(JwtAuthGuard)
  // @Post("ideas/:id/refine")
  // @ApiBearerAuth("JWT-auth")
  // @ApiOperation({
  //   summary: "Refine an existing idea using AI",
  //   description:
  //     "Uses LangChain to refine and expand an existing idea graph with more depth and connections.",
  // })
  // @ApiParam({ name: "id", description: "Idea ID" })
  // @ApiResponse({
  //   status: 200,
  //   description: "Idea refined successfully",
  // })
  // @ApiResponse({ status: 401, description: "Unauthorized" })
  // @ApiResponse({ status: 403, description: "Forbidden - Not your idea" })
  // @ApiResponse({ status: 404, description: "Idea not found" })
  // async refine(@Param("id") id: string, @Request() req) {
  //   const refinedIdeas = await this.ideasService.refine(id, req.user._id);
  //   return refinedIdeas;
  // }
}
