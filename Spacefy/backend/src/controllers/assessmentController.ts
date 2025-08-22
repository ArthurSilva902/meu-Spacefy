import { Request, Response } from "express";
import Review from "../models/assessmentModel";
import mongoose from "mongoose";
import { IBaseUser } from "../types/user";
import redisConfig from "../config/redisConfig";
import RentalModel from "../models/rentalModel";
import SpaceModel from "../models/spaceModel";

// Registrar uma avaliação (função existente atualizada)
export const createAssessment = async (req: Request, res: Response) => {
  try {
    // Garante que o usuário está autenticado
    if (!req.auth || !req.auth.id) {
      res.status(401).json({ error: "Usuário não autenticado." });
      return;
    }

    const { spaceID, userID, score, comment, evaluationType = 'user_to_user' } = req.body || {};

    // Verificação de campos obrigatórios
    if (!spaceID || !userID || score === undefined) {
      res
        .status(400)
        .json({ error: "Campos obrigatórios: spaceID, userID e score." });
      return;
    }

    // Validação da nota
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      res.status(400).json({ error: "A nota deve ser um número inteiro entre 1 e 5 estrelas." });
      return;
    }

    // Validar se os IDs são ObjectIds válidos
    if (!mongoose.Types.ObjectId.isValid(spaceID)) {
      res.status(400).json({ error: "ID do espaço inválido." });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      res.status(400).json({ error: "ID do usuário inválido." });
      return;
    }

    // Buscar o usuário avaliado
    const UserModel = require("../models/userModel");
    const evaluatedUser = await UserModel.findById(userID);

    if (!evaluatedUser) {
      res.status(404).json({ error: "Usuário avaliado não encontrado." });
      return;
    }

    // Não permitir autoavaliação
    if (req.auth.id === userID) {
      res.status(400).json({ error: "Você não pode se autoavaliar." });
      return;
    }

    // Verificar se o usuário tem permissão para avaliar
    if (evaluationType === 'owner_to_tenant') {
      // Verificar se o usuário é realmente o proprietário do espaço
      const space = await SpaceModel.findById(spaceID);
      if (!space || space.owner_id.toString() !== req.auth.id) {
        res.status(403).json({ error: "Apenas o proprietário do espaço pode avaliar o locatário." });
        return;
      }
    }

    // Verificar se já existe uma avaliação desse avaliador para esse usuário e espaço
    const existingReview = await Review.findOne({
      userID: new mongoose.Types.ObjectId(userID),
      spaceID: new mongoose.Types.ObjectId(spaceID),
      createdBy: req.auth.id,
      evaluationType: evaluationType
    });

    if (existingReview) {
      res.status(400).json({
        error: "Você já avaliou este usuário para este espaço com este tipo de avaliação.",
      });
      return;
    }

    // Cria a avaliação
    const review = await Review.create({
      spaceID: new mongoose.Types.ObjectId(spaceID),
      userID: new mongoose.Types.ObjectId(userID),
      score,
      comment,
      evaluation_date: new Date(),
      createdBy: req.auth.id,
      evaluationType: evaluationType,
      isOwnerEvaluation: evaluationType === 'owner_to_tenant'
    });

    // Invalida os caches relacionados
    await Promise.all([
      redisConfig.deleteRedis(`assessments_space_${spaceID}`),
      redisConfig.deleteRedis(`assessments_user_${userID}`),
      redisConfig.deleteRedis(`average_score_${spaceID}`),
      redisConfig.deleteRedisPattern("top_rated_spaces_*"),
      redisConfig.deleteRedis(`user_rating_${userID}`),
      redisConfig.deleteRedisPattern(`assessments_${evaluationType}_*`)
    ]);

    res.status(201).json(review);
    return;
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    res.status(500).json({ error: "Erro interno ao criar avaliação." });
    return;
  }
};

// NOVA FUNÇÃO: Proprietário avalia locatário
export const createOwnerAssessment = async (req: Request, res: Response) => {
  try {
    // Garante que o usuário está autenticado
    if (!req.auth || !req.auth.id) {
      res.status(401).json({ error: "Usuário não autenticado." });
      return;
    }

    const { rentalID, score, comment } = req.body || {};

    // Verificação de campos obrigatórios
    if (!rentalID || score === undefined) {
      res.status(400).json({ error: "Campos obrigatórios: rentalID e score." });
      return;
    }

    // Validação da nota
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      res.status(400).json({ error: "A nota deve ser um número inteiro entre 1 e 5 estrelas." });
      return;
    }

    // Validar se o rentalID é válido
    if (!mongoose.Types.ObjectId.isValid(rentalID)) {
      res.status(400).json({ error: "ID do aluguel inválido." });
      return;
    }

    // Buscar o aluguel
    const rental = await RentalModel.findById(rentalID).populate('space');
    if (!rental) {
      res.status(404).json({ error: "Aluguel não encontrado." });
      return;
    }

    // Verificar se o usuário é o proprietário do espaço
    if (rental.owner.toString() !== req.auth.id) {
      res.status(403).json({ error: "Apenas o proprietário do espaço pode avaliar o locatário." });
      return;
    }

    // Verificar se o aluguel já foi concluído (data de fim já passou)
    if (new Date() < rental.end_date) {
      res.status(400).json({ error: "Só é possível avaliar após o aluguel ser concluído." });
      return;
    }

    // Verificar se já existe uma avaliação do proprietário para este aluguel
    const existingAssessment = await Review.findOne({
      rentalID: new mongoose.Types.ObjectId(rentalID),
      createdBy: req.auth.id,
      evaluationType: 'owner_to_tenant'
    });

    if (existingAssessment) {
      res.status(400).json({ error: "Você já avaliou este locatário para este aluguel." });
      return;
    }

    // Criar a avaliação do proprietário para o locatário
    const assessment = await Review.create({
      spaceID: rental.space,
      userID: rental.user, // Locatário
      score,
      comment,
      evaluation_date: new Date(),
      createdBy: req.auth.id, // Proprietário
      evaluationType: 'owner_to_tenant',
      isOwnerEvaluation: true,
      rentalID: new mongoose.Types.ObjectId(rentalID)
    });

    // Invalida os caches relacionados
    await Promise.all([
      redisConfig.deleteRedis(`assessments_space_${rental.space}`),
      redisConfig.deleteRedis(`assessments_user_${rental.user}`),
      redisConfig.deleteRedis(`user_rating_${rental.user}`),
      redisConfig.deleteRedisPattern(`assessments_owner_to_tenant_*`)
    ]);

    res.status(201).json({
      message: "Avaliação do proprietário criada com sucesso!",
      assessment
    });
    return;
  } catch (error) {
    console.error("Erro ao criar avaliação do proprietário:", error);
    res.status(500).json({ error: "Erro interno ao criar avaliação." });
    return;
  }
};

// NOVA FUNÇÃO: Obter avaliações de um usuário (incluindo avaliações de proprietários)
export const getUserAssessments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { evaluationType, page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    // Tenta obter os dados do cache
    const cacheKey = `user_assessments_${userId}_${evaluationType || 'all'}_page_${page}_limit_${limit}`;
    const cachedAssessments = await redisConfig.getRedis(cacheKey);
    
    if (cachedAssessments) {
      res.status(200).json(JSON.parse(cachedAssessments));
      return;
    }

    // Construir filtro
    const filter: any = { userID: userId };
    if (evaluationType) {
      filter.evaluationType = evaluationType;
    }

    // Paginação
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const total = await Review.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit as string));

    const assessments = await Review.find(filter)
      .populate('createdBy', 'name surname profilePhoto')
      .populate('spaceID', 'space_name location')
      .sort({ evaluation_date: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const response = {
      assessments,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        total,
        hasNextPage: parseInt(page as string) < totalPages,
        hasPreviousPage: parseInt(page as string) > 1
      }
    };

    // Cache por 5 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(response), 300);

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error("Erro ao buscar avaliações do usuário:", error);
    res.status(500).json({ error: "Erro interno ao buscar avaliações." });
    return;
  }
};

// NOVA FUNÇÃO: Obter rating médio de um usuário
export const getUserRating = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    // Tenta obter os dados do cache
    const cacheKey = `user_rating_${userId}`;
    const cachedRating = await redisConfig.getRedis(cacheKey);
    
    if (cachedRating) {
      res.status(200).json(JSON.parse(cachedRating));
      return;
    }

    // Calcular rating médio
    const result = await Review.aggregate([
      { $match: { userID: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$score" },
          totalAssessments: { $sum: 1 },
          scoreDistribution: {
            $push: "$score"
          }
        }
      }
    ]);

    let rating = {
      averageScore: 0,
      totalAssessments: 0,
      scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (result.length > 0) {
      const data = result[0];
      rating.averageScore = Math.round(data.averageScore * 10) / 10; // Arredonda para 1 casa decimal
      rating.totalAssessments = data.totalAssessments;
      
      // Calcular distribuição de notas
      data.scoreDistribution.forEach((score: number) => {
        rating.scoreDistribution[score as keyof typeof rating.scoreDistribution]++;
      });
    }

    // Cache por 10 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(rating), 600);

    res.status(200).json(rating);
    return;
  } catch (error) {
    console.error("Erro ao calcular rating do usuário:", error);
    res.status(500).json({ error: "Erro interno ao calcular rating." });
    return;
  }
};

// Editar uma avaliação
export const updateAssessment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { score, comment } = req.body || {};

  // Validação da nota
  if (score !== undefined && (score < 0 || score > 5)) {
    res.status(400).json({ error: "A nota deve ser entre 0 e 5 estrelas." });
    return;
  }

  try {
    const review = await Review.findByIdAndUpdate(
      id,
      { score, comment },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ error: "Avaliação não encontrada." });
      return;
    }

    // Invalida os caches relacionados
    await Promise.all([
      redisConfig.deleteRedis(`assessments_space_${review.spaceID}`),
      redisConfig.deleteRedis(`assessments_user_${review.userID}`),
      redisConfig.deleteRedis(`average_score_${review.spaceID}`),
      redisConfig.deleteRedisPattern('top_rated_spaces_*')
    ]);

    res.status(200).json(review);
    return;
  } catch (error) {
    console.error("Erro ao atualizar avaliação:", error);
    res.status(500).json({ error: "Erro ao atualizar avaliação." });
    return;
  }
};

// Excluir uma avaliação
export const deleteAssessment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Busca a avaliação antes de excluir para verificar as permissões
    const assessment = await Review.findById(id);

    if (!assessment) {
      res.status(404).json({ error: "Avaliação não encontrada." });
      return;
    }

    // Verifica se o usuário é o dono da avaliação ou um administrador
    if (!req.auth || (req.auth.id !== assessment.userID.toString() && req.auth.role !== "admin")) {
      res.status(403).json({ 
        error: "Acesso negado. Apenas o autor da avaliação ou um administrador podem excluí-la." 
      });
      return;
    }

    const deleted = await Review.findByIdAndDelete(id);

    // Invalida os caches relacionados
    await Promise.all([
      redisConfig.deleteRedis(`assessments_space_${assessment.spaceID}`),
      redisConfig.deleteRedis(`assessments_user_${assessment.userID}`),
      redisConfig.deleteRedis(`average_score_${assessment.spaceID}`),
      redisConfig.deleteRedisPattern('top_rated_spaces_*')
    ]);

    res.status(200).json({ message: "Avaliação excluída com sucesso." });
    return;
  } catch (error) {
    console.error("Erro ao excluir avaliação:", error);
    res.status(500).json({ error: "Erro ao excluir avaliação." });
    return;
  }
};

// Buscar avaliações de um espaço específico
export const getAssessmentsBySpace = async (req: Request, res: Response) => {
  const { spaceId } = req.params;

  try {
    // Validação do ID do espaço
    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      res.status(400).json({ error: "ID do espaço inválido." });
      return;
    }

    // Tenta obter os dados do cache
    const cacheKey = `assessments_space_${spaceId}`;
    const cachedAssessments = await redisConfig.getRedis(cacheKey);
    
    if (cachedAssessments) {
      res.status(200).json(JSON.parse(cachedAssessments));
      return;
    }

    const assessments = await Review.find({ spaceID: spaceId })
      .populate({
        path: 'userID',
        select: 'name',
        model: 'user'
      })
      .lean();
    
    // Formatar os dados para retornar apenas o necessário
    const formattedAssessments = assessments.map(assessment => ({
      _id: assessment._id,
      score: assessment.score,
      comment: assessment.comment,
      evaluation_date: assessment.evaluation_date,
      userID: assessment.userID ? {
        _id: assessment.userID._id,
        name: (assessment.userID as IBaseUser).name
      } : null,
      spaceID: assessment.spaceID
    }));

    // Salva no cache por 5 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(formattedAssessments), 300);

    res.status(200).json(formattedAssessments);
    return;
  } catch (error: any) {
    console.error("Erro detalhado ao buscar avaliações:", error);
    res.status(500).json({ 
      error: "Erro ao buscar avaliações do espaço.",
      details: error.message 
    });
    return;
  }
};

export const getAllAssessments = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== "admin") {
    res.status(403).json({ error: "Acesso negado. Usuário não autorizado. somente admin pode acessar" });
    return;
  }
  try {
    // Tenta obter os dados do cache
    const cacheKey = 'all_assessments';
    const cachedAssessments = await redisConfig.getRedis(cacheKey);
    
    if (cachedAssessments) {
      res.status(200).json(JSON.parse(cachedAssessments));
      return;
    }

    const assessments = await Review.find();

    // Salva no cache por 5 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(assessments), 300);

    res.status(200).json(assessments);
    return;
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar todas as avaliações." });
    return;
  }
};

export const getTopRatedSpaces = async (req: Request, res: Response) => {
  try {
    // Tenta obter os dados do cache
    const cacheKey = 'top_rated_spaces';
    const cachedSpaces = await redisConfig.getRedis(cacheKey);
    
    if (cachedSpaces) {
      res.status(200).json(JSON.parse(cachedSpaces));
      return;
    }

    const topSpaces = await Review.aggregate([
      {
        $group: {
          _id: "$spaceID",
          averageScore: { $avg: "$score" },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $sort: { averageScore: -1 }
      },
      {
        $limit: 25
      },
      {
        $lookup: {
          from: "spaces",
          localField: "_id",
          foreignField: "_id",
          as: "spaceInfo"
        }
      },
      {
        $unwind: "$spaceInfo"
      },
      {
        $project: {
          _id: 1,
          averageScore: 1,
          totalReviews: 1,
          space_name: "$spaceInfo.space_name",
          location: "$spaceInfo.location",
          price_per_hour: "$spaceInfo.price_per_hour",
          image_url: "$spaceInfo.image_url"
        }
      }
    ]);

    // Salva no cache por 5 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(topSpaces), 300);

    res.status(200).json(topSpaces);
    return;
  } catch (error) {
    console.error("Erro ao buscar espaços melhor avaliados:", error);
    res.status(500).json({ error: "Erro ao buscar espaços melhor avaliados." });
    return;
  }
};

export const getAssessmentsByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 3;
  const skip = (page - 1) * limit;

  try {
    // Validação do ID do usuário
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: "ID do usuário inválido." });
      return;
    }

    // Tenta obter os dados do cache
    const cacheKey = `assessments_user_${userId}_page_${page}`;
    const cachedAssessments = await redisConfig.getRedis(cacheKey);
    
    if (cachedAssessments) {
      res.status(200).json(JSON.parse(cachedAssessments));
      return;
    }

    // Busca o total de avaliações para calcular o total de páginas
    const totalAssessments = await Review.countDocuments({ userID: userId });
    const totalPages = Math.ceil(totalAssessments / limit);

    const assessments = await Review.find({ userID: userId })
      .populate({
        path: "spaceID",
        select: "space_name",
        model: "Space",
      })
      .populate({
        path: "createdBy",
        select: "name role", // Popula nome e papel de quem avaliou
        model: "user",
      })
      .sort({ evaluation_date: -1 })
      .skip(skip)
      .limit(limit);

    const response = {
      assessments,
      pagination: {
        currentPage: page,
        totalPages,
        totalAssessments,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };

    // Salva no cache por 5 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(response), 300);

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error("Erro ao buscar avaliações do usuário:", error);
    res.status(500).json({ error: "Erro ao buscar avaliações do usuário." });
    return;
  }
};

export const getAverageScoreBySpace = async (req: Request, res: Response) => {
  const { spaceId } = req.params;

  try {
    // Validação do ID do espaço
    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      res.status(400).json({ error: "ID do espaço inválido." });
      return;
    }

    // Tenta obter os dados do cache
    const cacheKey = `average_score_${spaceId}`;
    const cachedScore = await redisConfig.getRedis(cacheKey);
    
    if (cachedScore) {
      res.status(200).json(JSON.parse(cachedScore));
      return;
    }

    const result = await Review.aggregate([
      {
        $match: {
          spaceID: new mongoose.Types.ObjectId(spaceId)
        }
      },
      {
        $group: {
          _id: "$spaceID",
          averageScore: { $avg: "$score" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Retorna média 0 se não houver avaliações
    const response = result.length === 0 ? {
      spaceId,
      averageScore: 0,
      totalReviews: 0
    } : {
      spaceId,
      averageScore: Number(result[0].averageScore.toFixed(1)),
      totalReviews: result[0].totalReviews
    };

    // Salva no cache por 5 minutos
    await redisConfig.setRedis(cacheKey, JSON.stringify(response), 300);

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error("Erro ao calcular média das avaliações:", error);
    res.status(500).json({ error: "Erro ao calcular média das avaliações do espaço." });
    return;
  }
};

