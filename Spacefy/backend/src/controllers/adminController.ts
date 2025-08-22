import { Request, Response } from "express";
import RentalModel from "../models/rentalModel";
import SpaceModel from "../models/spaceModel";
import AssessmentModel from "../models/assessmentModel";
import UserModel from "../models/userModel";
import mongoose from "mongoose";
import redisConfig from "../config/redisConfig";

// Obter métricas gerais do proprietário
export const getOwnerMetrics = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const { startDate, endDate, spaceId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      res.status(400).json({ error: "ID do proprietário inválido." });
      return;
    }

    // Criar chave de cache baseada nos filtros
    const cacheKey = `owner_metrics_${ownerId}_${JSON.stringify(req.query)}`;
    const cachedMetrics = await redisConfig.getRedis(cacheKey);
    
    if (cachedMetrics) {
      res.status(200).json(JSON.parse(cachedMetrics));
      return;
    }

    // Construir filtros de data
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.start_date = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      dateFilter.end_date = { $lte: new Date(endDate as string) };
    }

    // Filtro de espaço
    const spaceFilter = spaceId && mongoose.Types.ObjectId.isValid(spaceId as string) 
      ? { space: spaceId } 
      : {};

    // Buscar aluguéis do proprietário
    const rentals = await RentalModel.find({
      owner: ownerId,
      ...dateFilter,
      ...spaceFilter
    }).populate('space', 'space_name').populate('user', 'name surname');

    // Calcular métricas
    const totalRentals = rentals.length;
    const totalRevenue = rentals.reduce((sum, rental) => sum + rental.value, 0);
    
    // Agrupar por espaço
    const rentalsBySpace = rentals.reduce((acc, rental) => {
      const spaceName = (rental.space as any)?.space_name || 'Espaço desconhecido';
      if (!acc[spaceName]) {
        acc[spaceName] = {
          count: 0,
          revenue: 0,
          rentals: []
        };
      }
      acc[spaceName].count++;
      acc[spaceName].revenue += rental.value;
      acc[spaceName].rentals.push(rental);
      return acc;
    }, {} as any);

    // Agrupar por mês
    const rentalsByMonth = rentals.reduce((acc, rental) => {
      const month = rental.start_date.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          count: 0,
          revenue: 0
        };
      }
      acc[month].count++;
      acc[month].revenue += rental.value;
      return acc;
    }, {} as any);

    // Buscar avaliações dos espaços do proprietário
    const spaces = await SpaceModel.find({ owner_id: ownerId }).select('_id space_name');
    const spaceIds = spaces.map(space => space._id);
    
    const assessments = await AssessmentModel.find({
      spaceID: { $in: spaceIds }
    }).populate('userID', 'name surname');

    // Calcular média de avaliações por espaço
    const assessmentsBySpace = assessments.reduce((acc, assessment) => {
      const spaceId = assessment.spaceID.toString();
      if (!acc[spaceId]) {
        acc[spaceId] = {
          totalScore: 0,
          count: 0,
          assessments: []
        };
      }
      acc[spaceId].totalScore += assessment.score;
      acc[spaceId].count++;
      acc[spaceId].assessments.push(assessment);
      return acc;
    }, {} as any);

    // Calcular médias
    Object.keys(assessmentsBySpace).forEach(spaceId => {
      assessmentsBySpace[spaceId].averageScore = 
        assessmentsBySpace[spaceId].totalScore / assessmentsBySpace[spaceId].count;
    });

    const metrics = {
      totalRentals,
      totalRevenue,
      rentalsBySpace,
      rentalsByMonth,
      assessmentsBySpace,
      spaces: spaces.map(space => ({
        id: space._id,
        name: space.space_name
      }))
    };

    await redisConfig.setRedis(cacheKey, JSON.stringify(metrics), 300);

    res.status(200).json(metrics);
    return;
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    res.status(500).json({ error: "Erro interno ao buscar métricas." });
    return;
  }
};

// Obter detalhes de aluguéis com filtros
export const getRentalsWithFilters = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const { 
      startDate, 
      endDate, 
      spaceId, 
      userId, 
      page = 1, 
      limit = 10,
      sortBy = 'start_date',
      sortOrder = 'desc'
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      res.status(400).json({ error: "ID do proprietário inválido." });
      return;
    }

    // Criar chave de cache
    const cacheKey = `rentals_filtered_${ownerId}_${JSON.stringify(req.query)}`;
    const cachedRentals = await redisConfig.getRedis(cacheKey);
    
    if (cachedRentals) {
      res.status(200).json(JSON.parse(cachedRentals));
      return;
    }

    // Construir filtros
    const filter: any = { owner: ownerId };
    
    if (startDate) {
      filter.start_date = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      filter.end_date = { $lte: new Date(endDate as string) };
    }
    if (spaceId && mongoose.Types.ObjectId.isValid(spaceId as string)) {
      filter.space = spaceId;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
      filter.user = userId;
    }

    // Configurar paginação
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Buscar aluguéis
    const rentals = await RentalModel.find(filter)
      .populate('space', 'space_name image_url')
      .populate('user', 'name surname email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string));

    // Contar total
    const total = await RentalModel.countDocuments(filter);

    const result = {
      rentals,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    };

    await redisConfig.setRedis(cacheKey, JSON.stringify(result), 300);

    res.status(200).json(result);
    return;
  } catch (error) {
    console.error("Erro ao buscar aluguéis filtrados:", error);
    res.status(500).json({ error: "Erro interno ao buscar aluguéis." });
    return;
  }
};

// Obter relatório de faturamento
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const { startDate, endDate, groupBy = 'month' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      res.status(400).json({ error: "ID do proprietário inválido." });
      return;
    }

    const cacheKey = `revenue_report_${ownerId}_${JSON.stringify(req.query)}`;
    const cachedReport = await redisConfig.getRedis(cacheKey);
    
    if (cachedReport) {
      res.status(200).json(JSON.parse(cachedReport));
      return;
    }

    // Construir filtros de data
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.start_date = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      dateFilter.end_date = { $lte: new Date(endDate as string) };
    }

    // Pipeline de agregação
    const pipeline: any[] = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(ownerId),
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'spaces',
          localField: 'space',
          foreignField: '_id',
          as: 'space'
        }
      },
      {
        $unwind: '$space'
      }
    ];

    if (groupBy === 'month') {
      pipeline.push({
        $group: {
          _id: {
            year: { $year: '$start_date' },
            month: { $month: '$start_date' }
          },
          totalRevenue: { $sum: '$value' },
          rentalCount: { $sum: 1 },
          spaces: { $addToSet: '$space.space_name' }
        }
      });
    } else if (groupBy === 'space') {
      pipeline.push({
        $group: {
          _id: '$space._id',
          spaceName: { $first: '$space.space_name' },
          totalRevenue: { $sum: '$value' },
          rentalCount: { $sum: 1 }
        }
      });
    }

    pipeline.push({
      $sort: { '_id': 1 }
    });

    const report = await RentalModel.aggregate(pipeline);

    await redisConfig.setRedis(cacheKey, JSON.stringify(report), 300);

    res.status(200).json(report);
    return;
  } catch (error) {
    console.error("Erro ao gerar relatório de faturamento:", error);
    res.status(500).json({ error: "Erro interno ao gerar relatório." });
    return;
  }
};
