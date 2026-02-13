import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  @Get("health")
  @ApiOperation({
    summary: "Health check",
    description: "Returns the health status of the API",
  })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
    schema: {
      example: {
        status: "ok",
        timestamp: "2024-01-01T00:00:00.000Z",
        service: "scoda-ai-backend",
      },
    },
  })
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "scoda-ai-backend",
    };
  }
}
