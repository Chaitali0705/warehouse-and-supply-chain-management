import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { AiInsightsService } from '../services/ai-insights.service';

@ApiTags('reports/ai-insights')
@Controller('reports/ai-insights')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiInsightsController {
  constructor(private readonly aiInsightsService: AiInsightsService) {}

  @Get()
  @Roles(UserRole.admin, UserRole.manager, UserRole.warehouse_staff, UserRole.procurement, UserRole.sales, UserRole.analyst)
  @ApiOperation({ summary: 'Generate offline supply chain decision support insights' })
  getInsights() {
    return this.aiInsightsService.getInsights();
  }
}
