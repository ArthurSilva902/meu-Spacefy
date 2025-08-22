import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { FaStar, FaRegStar, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const UserRatingCard = ({ userId, showDetails = false, onToggleDetails }) => {
  const [rating, setRating] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserRating();
      if (showDetails) {
        fetchUserAssessments();
      }
    }
  }, [userId, showDetails]);

  const fetchUserRating = async () => {
    try {
      const response = await api.get(`/assessment/user-rating/${userId}`);
      setRating(response.data);
    } catch (error) {
      console.error('Erro ao buscar rating:', error);
      setError('Erro ao carregar rating do usuário');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssessments = async () => {
    try {
      const response = await api.get(`/assessment/user-assessments/${userId}`);
      setAssessments(response.data.assessments || []);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast.error('Erro ao carregar avaliações');
    }
  };

  const renderStars = (score) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className="me-1">
          {i <= score ? (
            <FaStar className="text-warning" />
          ) : (
            <FaRegStar className="text-muted" />
          )}
        </span>
      );
    }
    return stars;
  };

  const getScoreLabel = (score) => {
    if (score >= 4.5) return { text: 'Excelente', variant: 'success' };
    if (score >= 4.0) return { text: 'Muito Bom', variant: 'success' };
    if (score >= 3.5) return { text: 'Bom', variant: 'primary' };
    if (score >= 3.0) return { text: 'Regular', variant: 'warning' };
    if (score >= 2.0) return { text: 'Ruim', variant: 'warning' };
    return { text: 'Péssimo', variant: 'danger' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Body className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Carregando rating...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  if (!rating) {
    return (
      <Card className="mb-3">
        <Card.Body>
          <p className="text-muted mb-0">Usuário ainda não possui avaliações</p>
        </Card.Body>
      </Card>
    );
  }

  const scoreLabel = getScoreLabel(rating.averageScore);

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Rating do Usuário</h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={onToggleDetails}
        >
          {showDetails ? <FaEyeSlash /> : <FaEye />}
          {showDetails ? ' Ocultar' : ' Ver'} Detalhes
        </Button>
      </Card.Header>
      
      <Card.Body>
        <div className="row align-items-center">
          <div className="col-md-4 text-center">
            <div className="rating-display mb-2">
              <span className="display-4 text-warning">
                {rating.averageScore.toFixed(1)}
              </span>
              <span className="text-muted">/5</span>
            </div>
            <div className="stars-display mb-2">
              {renderStars(Math.round(rating.averageScore))}
            </div>
            <Badge bg={scoreLabel.variant} className="mb-2">
              {scoreLabel.text}
            </Badge>
            <p className="text-muted small mb-0">
              {rating.totalAssessments} avaliação{rating.totalAssessments !== 1 ? 'ões' : ''}
            </p>
          </div>
          
          <div className="col-md-8">
            <h6>Distribuição de Notas:</h6>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="d-flex align-items-center mb-2">
                <span className="me-2">{star} ⭐</span>
                <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{
                      width: `${rating.totalAssessments > 0 ? (rating.scoreDistribution[star] / rating.totalAssessments) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-muted small" style={{ minWidth: '30px' }}>
                  {rating.scoreDistribution[star]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {showDetails && (
          <div className="mt-4">
            <h6>Avaliações Recebidas:</h6>
            {assessments.length === 0 ? (
              <p className="text-muted">Nenhuma avaliação encontrada</p>
            ) : (
              <div className="assessments-list">
                {assessments.map((assessment) => (
                  <div key={assessment._id} className="assessment-item border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="stars-display mb-1">
                          {renderStars(assessment.score)}
                        </div>
                        <small className="text-muted">
                          Avaliado em {formatDate(assessment.evaluation_date)}
                        </small>
                      </div>
                      <Badge 
                        bg={assessment.evaluationType === 'owner_to_tenant' ? 'primary' : 'secondary'}
                      >
                        {assessment.evaluationType === 'owner_to_tenant' ? 'Proprietário' : 'Usuário'}
                      </Badge>
                    </div>
                    
                    {assessment.comment && (
                      <p className="mb-0">{assessment.comment}</p>
                    )}
                    
                    {assessment.spaceID && (
                      <small className="text-muted">
                        Espaço: {assessment.spaceID.space_name || 'N/A'}
                      </small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserRatingCard;
