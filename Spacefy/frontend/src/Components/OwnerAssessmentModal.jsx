import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const OwnerAssessmentModal = ({ show, onHide, rental, onSuccess }) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setScore(0);
      setComment('');
      setHoveredStar(0);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (score === 0) {
      toast.error('Por favor, selecione uma nota');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/assessment/owner-assessment', {
        rentalID: rental._id,
        score: score,
        comment: comment.trim() || undefined
      });

      toast.success('Avaliação enviada com sucesso!');
      onSuccess && onSuccess(response.data);
      onHide();
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao enviar avaliação';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const starValue = i;
      const isFilled = hoveredStar >= starValue || score >= starValue;
      const isHalf = !isFilled && (hoveredStar >= starValue - 0.5 || score >= starValue - 0.5);
      
      stars.push(
        <span
          key={i}
          className="star-icon"
          onClick={() => setScore(starValue)}
          onMouseEnter={() => setHoveredStar(starValue)}
          onMouseLeave={() => setHoveredStar(0)}
          style={{ cursor: 'pointer', fontSize: '2rem', margin: '0 5px' }}
        >
          {isFilled ? (
            <FaStar className="text-warning" />
          ) : isHalf ? (
            <FaStarHalfAlt className="text-warning" />
          ) : (
            <FaRegStar className="text-muted" />
          )}
        </span>
      );
    }
    return stars;
  };

  if (!rental) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Avaliar Locatário</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="rental-info mb-4 p-3 bg-light rounded">
          <h6>Informações do Aluguel:</h6>
          <p className="mb-1"><strong>Espaço:</strong> {rental.space?.space_name || 'N/A'}</p>
          <p className="mb-1"><strong>Locatário:</strong> {rental.user?.name || 'N/A'}</p>
          <p className="mb-1"><strong>Data:</strong> {new Date(rental.start_date).toLocaleDateString('pt-BR')} - {new Date(rental.end_date).toLocaleDateString('pt-BR')}</p>
          <p className="mb-0"><strong>Valor:</strong> R$ {rental.value?.toFixed(2) || 'N/A'}</p>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label><strong>Nota (1-5 estrelas):</strong></Form.Label>
            <div className="text-center">
              {renderStars()}
            </div>
            <div className="text-center mt-2">
              <small className="text-muted">
                {score > 0 && (
                  <>
                    {score === 1 && 'Péssimo'}
                    {score === 2 && 'Ruim'}
                    {score === 3 && 'Regular'}
                    {score === 4 && 'Bom'}
                    {score === 5 && 'Excelente'}
                  </>
                )}
              </small>
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label><strong>Comentário (opcional):</strong></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a experiência com este locatário..."
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {comment.length}/500 caracteres
            </Form.Text>
          </Form.Group>

          <Alert variant="info">
            <strong>Dica:</strong> Sua avaliação ajuda outros proprietários a conhecerem melhor os locatários e contribui para uma comunidade mais confiável.
          </Alert>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading || score === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Enviando...
            </>
          ) : (
            'Enviar Avaliação'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OwnerAssessmentModal;
